import type { AppProps } from "next/app";
import Head from "next/head";
import { useEffect, useState, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MapProvider } from "@/components/Map/MapProvider";
import { Layout } from "@/components/Layout";
import { Toaster } from "@/components/ui/sonner";
import { FilterProvider } from "@/contexts/FilterContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "@/styles/globals.css";
import '@/components/Map/map-overrides.css';
import { setCsrfToken } from '@/lib/api-client';
import { LoadingProvider, useLoading } from "@/contexts/LoadingContext";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useRouter } from "next/router";

declare global {
  interface Window {
    workbox: any;
  }
}

function GlobalLoader() {
  const { isLoading } = useLoading();
  const router = useRouter();
  const { showLoading, hideLoading } = useLoading();

  const isNavigatingRef = useRef(false);

  useEffect(() => {
    const handleStart = (url: string) => {
      if (url !== router.asPath) {
        isNavigatingRef.current = true;
        showLoading();
      }
    };

    const handleStop = () => {
      isNavigatingRef.current = false;
      setTimeout(() => {
        // Only hide if we haven't started a new navigation in the meantime
        if (!isNavigatingRef.current) {
          hideLoading();
        }
      }, 200);
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleStop);
    router.events.on('routeChangeError', handleStop);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleStop);
      router.events.off('routeChangeError', handleStop);
    };
  }, [router, showLoading, hideLoading]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300">
      <LoadingSpinner size="lg" />
    </div>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  // Create QueryClient instance (stable across re-renders)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
            gcTime: 10 * 60 * 1000, // 10 minutes - garbage collection time (formerly cacheTime)
            retry: 3, // Retry failed requests 3 times
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff: 1s, 2s, 4s... max 30s
            refetchOnWindowFocus: false, // Don't refetch on window focus (optional)
          },
        },
      })
  );

  useEffect(() => {
    document.documentElement.classList.add("dark");

    // Fetch CSRF token on app mount
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch('/api/auth/csrf');
        const data = await response.json();
        if (data.csrfToken) {
          setCsrfToken(data.csrfToken);
        }
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
      }
    };

    fetchCsrfToken();

    // Manual Service Worker Registration
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      window.workbox !== undefined
    ) {
      const wb = window.workbox;
      wb.register();
    } else if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log(
            "Service Worker registered with scope:",
            registration.scope
          );
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LoadingProvider>
          <MapProvider>
            <FilterProvider>
              <Layout>
                <Head>
                  <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no"
                  />
                </Head>
                <GlobalLoader />
                <Component {...pageProps} />
                <Toaster />
              </Layout>
            </FilterProvider>
          </MapProvider>
        </LoadingProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
