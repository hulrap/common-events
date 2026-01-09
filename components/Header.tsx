
import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { useNotifications } from "@/hooks/useNotifications";
import { DesktopHeader } from "./Header/DesktopHeader";
import { MobileHeader } from "./Header/MobileHeader";
import { MenuCard, MenuCardProps } from "./Header/MenuCard";

// Export these to maintain compatibility if they were imported elsewhere
export { MenuCard };
export type { MenuCardProps };

// Header component - Renders both responsive versions
export function Header() {
  const { user, isOrganizer, isVenueOwner } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [isDesktopOpen, setIsDesktopOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isMapPage = router.pathname === "/map";
  const isCalendarPage = router.pathname === "/calendar";

  const { notifications, markAsRead } = useNotifications();

  // Replaced inline queries with hook usage above

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('users')
        .select('profile_image')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // Cache profile for 5 mins
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsDesktopOpen(false);
    setIsMobileOpen(false);
    router.push("/");
  };

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const handleNotificationOpen = (open: boolean) => {
    // setIsOpen(false); // Close main menu if open (optional)
    setIsNotificationsOpen(open);
    // Removed automatic markAllRead to allow viewing unread stats
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAsRead(undefined); // No ID = Mark All
  };

  const commonProps = {
    user,
    userProfile,
    notifications,
    isOrganizer,
    isVenueOwner,
    isMapPage,
    isCalendarPage,
    handleSignOut,
    isNotificationsOpen,
    handleNotificationOpen,
    setIsNotificationsOpen,
    markAsRead,
    handleMarkAllRead
  };

  return (
    <>
      <DesktopHeader {...commonProps} isOpen={isDesktopOpen} setIsOpen={setIsDesktopOpen} />
      <MobileHeader {...commonProps} isOpen={isMobileOpen} setIsOpen={setIsMobileOpen} />
    </>
  );
}
