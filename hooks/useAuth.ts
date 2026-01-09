import { useEffect, useState, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface UseAuthReturn {
  user: User | null;
  isOrganizer: boolean;
  isVenueOwner: boolean;
  isEditor: boolean;
  loading: boolean;
}

// GLOBAL state shared across ALL useAuth instances
// This ensures roles are fetched only once per user session
const globalAuthState = {
  user: null as User | null,
  roles: {
    isOrganizer: false,
    isVenueOwner: false,
    isEditor: false,
  },
  roleFetched: new Set<string>(),
  roleFetching: new Set<string>(),
  listeners: new Set<() => void>(),
  authInitialized: false,
  authListener: null as (() => void) | null,
};

// Notify all listeners when auth state changes
function notifyListeners() {
  globalAuthState.listeners.forEach((listener) => listener());
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(globalAuthState.user);
  const [isOrganizer, setIsOrganizer] = useState(globalAuthState.roles.isOrganizer);
  const [isVenueOwner, setIsVenueOwner] = useState(globalAuthState.roles.isVenueOwner);
  const [isEditor, setIsEditor] = useState(globalAuthState.roles.isEditor);
  // Only show loading if auth hasn't been initialized yet
  const [loading, setLoading] = useState(!globalAuthState.authInitialized);
  
  // Memoize supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), []);
  
  // Create a listener to sync with global state
  const updateLocalState = useRef(() => {
    setUser(globalAuthState.user);
    setIsOrganizer(globalAuthState.roles.isOrganizer);
    setIsVenueOwner(globalAuthState.roles.isVenueOwner);
    setIsEditor(globalAuthState.roles.isEditor);
    setLoading(false); // Always set loading to false when state updates
  });
  
  // Register this component as a listener
  useEffect(() => {
    globalAuthState.listeners.add(updateLocalState.current);
    return () => {
      globalAuthState.listeners.delete(updateLocalState.current);
    };
  }, []);

  const fetchUserRole = async (userId: string) => {
    // Prevent duplicate fetches globally across ALL hook instances
    if (globalAuthState.roleFetched.has(userId) || globalAuthState.roleFetching.has(userId)) {
      return;
    }
    
    globalAuthState.roleFetching.add(userId);

    try {
      const response = await fetch(`/api/auth/role?userId=${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update GLOBAL state
        globalAuthState.roles = {
          isOrganizer: data.isOrganizer || false,
          isVenueOwner: data.isVenueOwner || false,
          isEditor: data.isEditor || false,
        };
        globalAuthState.roleFetched.add(userId);
        
        // Notify all listeners (all useAuth instances)
        notifyListeners();
      } else {
        // Non-200 response - default to false
        globalAuthState.roles = {
          isOrganizer: false,
          isVenueOwner: false,
          isEditor: false,
        };
        globalAuthState.roleFetched.add(userId); // Mark as fetched to prevent retries
        notifyListeners();
      }
    } catch (error) {
      // Network error or other fetch failures - silently handle
      if (process.env.NODE_ENV === "development") {
        console.warn("Role fetch failed (non-critical):", error);
      }
      globalAuthState.roles = {
        isOrganizer: false,
        isVenueOwner: false,
        isEditor: false,
      };
      globalAuthState.roleFetched.add(userId); // Mark as fetched to prevent retry loops
      notifyListeners();
    } finally {
      globalAuthState.roleFetching.delete(userId);
    }
  };

  useEffect(() => {
    // Initialize auth ONCE globally (not per hook instance)
    if (!globalAuthState.authInitialized) {
      globalAuthState.authInitialized = true;

      const getUser = async () => {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        // Update GLOBAL state
        globalAuthState.user = currentUser;
        
        // Notify all listeners (this will update all component states and set loading to false)
        notifyListeners();

        // Fetch roles in the background without blocking
        if (currentUser && !globalAuthState.roleFetched.has(currentUser.id)) {
          fetchUserRole(currentUser.id).catch(() => {
            // Silently handle errors - roles are non-critical
          });
        } else if (currentUser === null) {
          globalAuthState.roles = {
            isOrganizer: false,
            isVenueOwner: false,
            isEditor: false,
          };
          globalAuthState.roleFetched.clear();
          notifyListeners();
        }
      };

      getUser();

      // Set up auth state listener ONCE globally
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event: any, session: Session | null) => {
        const currentUser = session?.user ?? null;
        const previousUserId = globalAuthState.user?.id;
        
        // Update GLOBAL state
        globalAuthState.user = currentUser;
        
        // Only fetch role if user actually changed
        if (currentUser && currentUser.id !== previousUserId) {
          globalAuthState.roleFetched.clear(); // Clear cache for new user
          fetchUserRole(currentUser.id);
        } else if (currentUser === null) {
          globalAuthState.roles = {
            isOrganizer: false,
            isVenueOwner: false,
            isEditor: false,
          };
          globalAuthState.roleFetched.clear();
        }
        
        // Notify all listeners (all useAuth instances) of the change
        notifyListeners();
      });

      globalAuthState.authListener = subscription.unsubscribe;
    }

    // Sync local state with global state immediately
    setUser(globalAuthState.user);
    setIsOrganizer(globalAuthState.roles.isOrganizer);
    setIsVenueOwner(globalAuthState.roles.isVenueOwner);
    setIsEditor(globalAuthState.roles.isEditor);
    
    // If auth already initialized, we're not loading
    if (globalAuthState.authInitialized) {
      setLoading(false);
    } else {
      // Will be set to false after getUser completes
      setLoading(true);
    }

    // No cleanup needed - auth listener is global and persists across component unmounts
  }, [supabase]);

  return { user, isOrganizer, isVenueOwner, isEditor, loading };
}

