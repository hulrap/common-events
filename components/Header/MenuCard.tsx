import Link from "next/link";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export interface MenuCardProps {
    href?: string;
    onClick?: () => void;
    children: React.ReactNode;
    className?: string;
    zIndex?: number;
}

export function MenuCard({ href, onClick, children, className, zIndex = 0 }: MenuCardProps) {
    // Base styles: rounded-3xl for the card look, negative margin for stacking
    // pt-8 pb-6 to ensure content is centered but accounts for the overlap at the top
    const baseClasses = `
    relative flex items-center justify-start px-6 pt-6 pb-16 w-full 
    font-display font-black !text-2xl uppercase tracking-tight 
    transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:brightness-110
    rounded-3xl -mt-9 border-t border-white/10 shadow-xl !opacity-100
  `;

    const style = { zIndex };

    if (href) {
        return (
            <DropdownMenuItem asChild className="p-0 focus:outline-none border-none outline-none">
                <Link
                    href={href}
                    onClick={onClick}
                    className={`${baseClasses} ${className}`}
                    style={style}
                >
                    {children}
                </Link>
            </DropdownMenuItem>
        );
    }

    return (
        <DropdownMenuItem
            onClick={onClick}
            className={`p-0 focus:outline-none border-none outline-none cursor-pointer ${baseClasses} ${className}`}
            style={style}
        >
            {children}
        </DropdownMenuItem>
    );
}
