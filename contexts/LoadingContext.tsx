import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface LoadingContextType {
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    showLoading: () => void;
    hideLoading: () => void;
    addLoadingHold: (key: string) => void;
    removeLoadingHold: (key: string) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
    const [internalLoading, setInternalLoading] = useState(false);
    const [holds, setHolds] = useState<Set<string>>(new Set());

    const showLoading = useCallback(() => setInternalLoading(true), []);
    const hideLoading = useCallback(() => setInternalLoading(false), []);

    const addLoadingHold = useCallback((key: string) => {
        setHolds(prev => {
            const newHolds = new Set(prev);
            newHolds.add(key);
            return newHolds;
        });
    }, []);

    const removeLoadingHold = useCallback((key: string) => {
        setHolds(prev => {
            const newHolds = new Set(prev);
            newHolds.delete(key);
            return newHolds;
        });
    }, []);

    const isLoading = internalLoading || holds.size > 0;

    return (
        <LoadingContext.Provider value={{
            isLoading,
            setIsLoading: setInternalLoading,
            showLoading,
            hideLoading,
            addLoadingHold,
            removeLoadingHold
        }}>
            {children}
        </LoadingContext.Provider>
    );
}

export function useLoading() {
    const context = useContext(LoadingContext);
    if (context === undefined) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
}
