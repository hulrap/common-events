import React, { Component, type ReactNode, type ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch React errors and prevent full page crashes
 *
 * Features:
 * - Catches component errors and displays fallback UI
 * - Provides reload functionality
 * - Logs errors to console (can be extended to send to monitoring service)
 * - Prevents error propagation to parent components
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary fallback={<CustomFallback />}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so next render shows fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console
    console.error('Error Boundary caught error:', error, errorInfo);

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Future: Integrate with Axiom error monitoring
    // When Axiom is set up, send errors here for tracking:
    // axiom.log('error-boundary', {
    //   error: error.message,
    //   stack: error.stack,
    //   componentStack: errorInfo.componentStack,
    // });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  handleReload = (): void => {
    if (typeof globalThis.window !== 'undefined') {
      globalThis.window.location.reload();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-black text-white">
          <div className="max-w-md w-full text-center space-y-6">
            <h1 className="text-3xl font-bold text-brand-orange">
              Something went wrong
            </h1>

            <div className="space-y-2">
              <p className="text-slate-400">
                We encountered an unexpected error. Don&apos;t worry, your data is safe.
              </p>

              {this.state.error && process.env.NODE_ENV === 'development' && (
                <details className="mt-4 p-4 bg-slate-900 rounded-lg text-left">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-300 mb-2">
                    Error details (development only)
                  </summary>
                  <pre className="text-xs text-red-400 overflow-auto whitespace-pre-wrap">
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-brand-purple hover:bg-brand-blurple text-white font-semibold rounded-lg transition-colors"
              >
                Try again
              </button>

              <button
                onClick={this.handleReload}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors"
              >
                Reload page
              </button>
            </div>

            <p className="text-sm text-slate-500">
              If this problem persists,{' '}
              <a
                href="https://github.com/anthropics/claude-code/issues"
                className="text-brand-purple hover:text-brand-blurple underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                please report it
              </a>.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Specialized error boundary for map components
 */
export function MapErrorBoundary({ children }: { readonly children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center h-screen p-4 bg-black text-white">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-brand-orange">Map Error</h2>
            <p className="text-slate-400">
              Unable to load the map. Please try refreshing the page.
            </p>
            <button
              onClick={() => globalThis.window.location.reload()}
              className="px-6 py-3 bg-brand-purple hover:bg-brand-blurple text-white font-semibold rounded-lg transition-colors"
            >
              Reload Map
            </button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Specialized error boundary for event list components
 */
export function EventListErrorBoundary({ children }: { readonly children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-bold text-brand-orange">Unable to Load Events</h2>
            <p className="text-slate-400">
              There was an error loading the events. Please try again.
            </p>
            <button
              onClick={() => globalThis.window.location.reload()}
              className="px-6 py-3 bg-brand-purple hover:bg-brand-blurple text-white font-semibold rounded-lg transition-colors"
            >
              Reload Events
            </button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
