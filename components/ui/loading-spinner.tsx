import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
    className?: string;
    size?: "sm" | "md" | "lg" | "xl";
}

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: "w-8 h-8",
        md: "w-12 h-12",
        lg: "w-24 h-24",
        xl: "w-32 h-32"
    };

    return (
        <div className={cn("relative flex items-center justify-center", sizeClasses[size], className)}>
            {/* Outer C - Spinning Clockwise */}
            <svg
                viewBox="0 0 500 662"
                fill="currentColor"
                className="absolute w-full h-full text-brand-rosand animate-spin duration-[3s] ease-in-out"
                style={{ animationDuration: '3s' }}
            >
                <path d="M0,330.96c0,182.07,150.6,330.96,337.76,330.96,51.91,0,103.8-10.23,148.04-30.63v-184.63c-30.63,33.17-81.68,58.71-144.63,58.71-101.25,0-174.42-74.02-174.42-174.41s73.18-174.41,174.42-174.41c62.95,0,114,25.54,144.63,58.68V30.63C441.56,11.06,389.67,0,337.76,0,150.6,0,0,148.9,0,330.96Z" />
            </svg>

            {/* Inner C - Spinning Counter-Clockwise and smaller */}
            <svg
                viewBox="0 0 500 662"
                fill="currentColor"
                className="absolute w-2/3 h-2/3 text-brand-blurple animate-spin direction-reverse duration-[2s] ease-in-out"
                style={{ animationDirection: 'reverse', animationDuration: '2s' }}
            >
                <path d="M0,330.96c0,182.07,150.6,330.96,337.76,330.96,51.91,0,103.8-10.23,148.04-30.63v-184.63c-30.63,33.17-81.68,58.71-144.63,58.71-101.25,0-174.42-74.02-174.42-174.41s73.18-174.41,174.42-174.41c62.95,0,114,25.54,144.63,58.68V30.63C441.56,11.06,389.67,0,337.76,0,150.6,0,0,148.9,0,330.96Z" />
            </svg>
        </div>
    );
}
