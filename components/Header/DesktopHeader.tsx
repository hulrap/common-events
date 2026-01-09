import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Menu, Map, LayoutGrid, Bell, Calendar, User } from "lucide-react";
import { Logo } from "@/components/Logo";
import { MenuCard } from "./MenuCard";

interface DesktopHeaderProps {
    user: any;
    userProfile: any;
    notifications: any[];
    isOrganizer: boolean;
    isVenueOwner: boolean;
    isMapPage: boolean;
    isCalendarPage: boolean;
    handleSignOut: () => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    isNotificationsOpen: boolean;
    handleNotificationOpen: (open: boolean) => void;
    setIsNotificationsOpen: (open: boolean) => void;
    markAsRead: (id?: string) => void;
    handleMarkAllRead: (e: React.MouseEvent) => void;
}

export function DesktopHeader({
    user,
    userProfile,
    notifications,
    isOrganizer,
    isVenueOwner,
    isMapPage,
    isCalendarPage,
    handleSignOut,
    isOpen,
    setIsOpen,
    isNotificationsOpen,
    handleNotificationOpen,
    setIsNotificationsOpen // Used inside popover links
}: DesktopHeaderProps) {
    return (
        <header className="hidden md:flex sticky top-0 z-50 items-center justify-between p-5 pb-4 bg-black border-b border-white/10">
            <div className="flex shrink-0 items-center">
                <Link href="/" className="flex flex-col items-start">
                    <Logo className="h-10 w-auto text-slate-900 dark:text-white" />
                </Link>
            </div>

            <div className="flex items-center gap-2">
                {/* Map/Feed button */}
                {isMapPage ? (
                    <Link href="/" className="flex items-center justify-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 p-1.5 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 [&_svg]:size-full rounded-3xl"
                            aria-label="Feed"
                            title="Feed"
                        >
                            <LayoutGrid className="h-full w-full" />
                        </Button>
                    </Link>
                ) : isCalendarPage ? (
                    <Link href="/" className="flex items-center justify-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 p-1.5 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 [&_svg]:size-full rounded-3xl"
                            aria-label="Feed"
                            title="Feed"
                        >
                            <LayoutGrid className="h-full w-full" />
                        </Button>
                    </Link>
                ) : (
                    <Link href="/map" className="flex items-center justify-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 p-1.5 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 [&_svg]:size-full rounded-3xl"
                            aria-label="Map"
                            title="Map"
                        >
                            <Map className="h-full w-full" />
                        </Button>
                    </Link>
                )}

                {/* Calendar Button (Hide if on Calendar Page) */}
                {user && !isCalendarPage && (
                    <Link href="/calendar" className="flex items-center justify-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 p-1.5 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 [&_svg]:size-full rounded-3xl"
                            aria-label="Calendar"
                            title="My Calendar"
                        >
                            <Calendar className="h-full w-full" />
                        </Button>
                    </Link>
                )}

                {/* Notification Bell */}
                {user && (
                    <Popover open={isNotificationsOpen} onOpenChange={handleNotificationOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 p-2 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 [&_svg]:size-full rounded-3xl relative"
                                aria-label="Notifications"
                            >
                                <Bell className="h-full w-full" />
                                {notifications.length > 0 && notifications.some((n: any) => !n.isRead) && (
                                    <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-black" />
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0 bg-black/90 backdrop-blur-xl border-white/10 text-white rounded-3xl overflow-hidden shadow-2xl mr-4">
                            <div className="p-4 border-b border-white/10">
                                <h3 className="font-bold text-lg">Notifications</h3>
                            </div>
                            <div className="max-h-[60vh] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 text-sm">
                                        No new notifications
                                    </div>
                                ) : (
                                    <div className="flex flex-col">
                                        {notifications.map((notif: any) => (
                                            <Link
                                                key={notif.id}
                                                href={notif.link || '#'}
                                                className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors block ${!notif.isRead ? 'bg-white/5' : ''}`}
                                                onClick={() => setIsNotificationsOpen(false)}
                                            >
                                                <div className="font-semibold text-sm mb-1">{notif.title}</div>
                                                <div className="text-xs text-slate-300">{notif.message}</div>
                                                <div className="text-[10px] text-slate-500 mt-2">
                                                    {new Date(notif.createdAt).toLocaleDateString()}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                )}

                <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 p-0.5 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 [&_svg]:size-full rounded-3xl"
                            aria-label="Menu"
                        >
                            {userProfile?.profile_image ? (
                                <img
                                    src={userProfile.profile_image}
                                    alt="Profile"
                                    className="h-full w-full rounded-full object-cover"
                                />
                            ) : (
                                <Menu className="h-full w-full" />
                            )}
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        align="end"
                        className="w-80 p-0 bg-transparent border-none shadow-none space-y-0 mt-2 z-[100] overflow-visible"
                        sideOffset={0}
                    >
                        {user ? (
                            // Logged In State
                            <div className="flex flex-col w-full isolate">
                                <div className="relative z-10 bg-white p-6 pb-16 rounded-3xl shadow-xl flex items-center gap-4">
                                    {userProfile?.profile_image && (
                                        <div className="h-12 w-12 shrink-0 rounded-full overflow-hidden bg-slate-100">
                                            <img
                                                src={userProfile.profile_image}
                                                alt="Profile"
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <div className="font-bold text-slate-900 text-lg truncate pr-8">
                                            {user.email}
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {isOrganizer && (
                                                <span className="text-xs font-bold px-2 py-1 bg-brand-grellow text-black rounded-md uppercase">
                                                    Organizer
                                                </span>
                                            )}
                                            {isVenueOwner && (
                                                <span className="text-xs font-bold px-2 py-1 bg-brand-rosand text-black rounded-md uppercase">
                                                    Venue Owner
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <MenuCard
                                    href="/profile"
                                    onClick={() => setIsOpen(false)}
                                    className="bg-brand-blurple text-black"
                                    zIndex={20}
                                >
                                    Profile
                                </MenuCard>

                                {isOrganizer && (
                                    <MenuCard
                                        href="/events/create"
                                        onClick={() => setIsOpen(false)}
                                        className="bg-brand-grellow text-black"
                                        zIndex={30}
                                    >
                                        Create Event
                                    </MenuCard>
                                )}

                                <MenuCard
                                    onClick={handleSignOut}
                                    className="bg-brand-oredge text-black"
                                    zIndex={50}
                                >
                                    Sign Out
                                </MenuCard>

                                <div className="relative z-[60] bg-black p-8 pt-12 pb-12 flex flex-col items-center justify-center rounded-3xl -mt-9 shadow-2xl">
                                    <Logo className="h-20 w-auto text-white" />
                                </div>
                            </div>
                        ) : (
                            // Logged Out State
                            <div className="flex flex-col w-full isolate">
                                <DropdownMenuItem asChild className="p-0 focus:outline-none border-none outline-none">
                                    <Link
                                        href="/"
                                        onClick={() => setIsOpen(false)}
                                        className="relative z-10 flex items-center justify-start px-6 py-6 pb-16 w-full font-display font-black !text-2xl uppercase tracking-tight transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] rounded-3xl bg-brand-oredge text-black shadow-xl"
                                    >
                                        Home
                                    </Link>
                                </DropdownMenuItem>

                                <MenuCard
                                    href="/manifest"
                                    onClick={() => setIsOpen(false)}
                                    className="bg-brand-grellow text-black"
                                    zIndex={20}
                                >
                                    Manifest
                                </MenuCard>

                                <MenuCard
                                    href="/auth/signin"
                                    onClick={() => setIsOpen(false)}
                                    className="bg-brand-rosand text-black"
                                    zIndex={30}
                                >
                                    Sign In
                                </MenuCard>

                                <MenuCard
                                    href="/auth/signin"
                                    onClick={() => setIsOpen(false)}
                                    className="bg-brand-blurple text-white"
                                    zIndex={40}
                                >
                                    Sign Up
                                </MenuCard>

                                <div className="relative z-50 bg-black p-8 pt-12 pb-12 flex flex-col items-center justify-center rounded-3xl -mt-9 shadow-2xl">
                                    <Logo className="h-20 w-auto text-white" />
                                </div>
                            </div>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
