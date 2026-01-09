import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export function Footer() {
  // Use auth but don't block - always render immediately, check isOrganizer in background
  const { isOrganizer } = useAuth();

  return (
    <footer className="hidden md:block fixed bottom-0 left-0 right-0 z-10 border-t border-white/10 backdrop-blur-sm grain-texture header-glass">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-6">
          {/* Main Footer Content */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            {/* Legal Links */}
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <Link
                href="/imprint"
                className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
              >
                Imprint
              </Link>
              <Link
                href="/privacy-policy"
                className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/cookie-policy"
                className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
              >
                Cookie Policy
              </Link>
              <Link
                href="/terms"
                className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
              >
                Terms
              </Link>
            </div>

            {/* Contact Info - Only show if user is not an organizer */}
            {!isOrganizer && (
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Want to publish events?{" "}
                <a
                  href="mailto:events@commoncause.cc"
                  className="text-primary hover:underline"
                >
                  Contact: events@commoncause.cc
                </a>
              </div>
            )}
          </div>

          {/* Common World Section */}
          <div className="pt-4 border-t border-slate-800/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-500">
              <div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Common Cause</h3>
                <a
                  href="https://commoncause.cc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  commoncause.cc
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

