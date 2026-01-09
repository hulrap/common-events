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

interface MobileHeaderProps {
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
}

// Add router usage inside MobileHeader to detect page
import { useRouter } from "next/router";

export function MobileHeader({
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
    setIsNotificationsOpen
}: MobileHeaderProps) {
    const router = useRouter();
    const isNotificationsPage = router.pathname === "/notifications";

    return (
        <>


            {/* MOBILE BOTTOM NAVIGATION */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[9999] bg-black/95 backdrop-blur-xl border-t border-white/10 pb-safe">
                <div className="flex items-center justify-around p-2">

                    {/* 1. FEED Tab */}
                    <Link href="/" className={`flex flex-col items-center justify-center p-2 rounded-xl transition-colors ${!isMapPage && !isCalendarPage && !isNotificationsPage ? 'text-brand-oredge' : 'text-slate-500'}`}>
                        <LayoutGrid className="w-6 h-6" />
                    </Link>

                    {/* 2. MAP Tab */}
                    <Link href="/map" className={`flex flex-col items-center justify-center p-2 rounded-xl transition-colors ${isMapPage ? 'text-brand-oredge' : 'text-slate-500'}`}>
                        <Map className="w-6 h-6" />
                    </Link>

                    {/* 3. CALENDAR Tab */}
                    {user ? (
                        <Link href="/calendar" className={`flex flex-col items-center justify-center p-2 rounded-xl transition-colors ${isCalendarPage ? 'text-brand-oredge' : 'text-slate-500'}`}>
                            <Calendar className="w-6 h-6" />
                        </Link>
                    ) : (
                        <Link href="/auth/signin" className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-500">
                            <Calendar className="w-6 h-6 opacity-50" />
                        </Link>
                    )}

                    {/* 4. NOTIFICATIONS Tab */}
                    {user && (
                        <Link href="/notifications" className={`flex flex-col items-center justify-center p-2 rounded-xl transition-colors relative ${isNotificationsPage ? 'text-brand-oredge' : 'text-slate-500'}`}>
                            <Bell className="w-6 h-6" />
                            {notifications.length > 0 && notifications.some((n: any) => !n.isRead) && (
                                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border border-black" />
                            )}
                        </Link>
                    )}

                    {/* 5. PROFILE/MENU Tab */}
                    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                        <DropdownMenuTrigger asChild>
                            <button className={`flex flex-col items-center justify-center p-2 rounded-xl transition-colors ${isOpen ? 'text-brand-oredge' : 'text-slate-500'}`}>
                                {userProfile?.profile_image ? (
                                    <div className={`w-6 h-6 rounded-full overflow-hidden border-2 ${isOpen ? 'border-brand-oredge' : 'border-slate-500'}`}>
                                        <img src={userProfile.profile_image} alt="Profile" className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <User className="w-6 h-6" />
                                )}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="top" align="end" className="w-80 p-0 bg-transparent border-none shadow-none space-y-0 mb-4 z-[100] overflow-visible">
                            {user ? (
                                <div className="flex flex-col w-full isolate">
                                    <div className="relative z-10 bg-white p-6 pb-16 rounded-3xl shadow-xl flex items-center gap-4">
                                        {userProfile?.profile_image && (
                                            <div className="h-12 w-12 shrink-0 rounded-full overflow-hidden bg-slate-100">
                                                <img src={userProfile.profile_image} alt="Profile" className="h-full w-full object-cover" />
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <div className="font-bold text-slate-900 text-lg truncate pr-8">{user.email}</div>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {isOrganizer && <span className="text-xs font-bold px-2 py-1 bg-brand-grellow text-black rounded-md uppercase">Organizer</span>}
                                                {isVenueOwner && <span className="text-xs font-bold px-2 py-1 bg-brand-rosand text-black rounded-md uppercase">Venue Owner</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <MenuCard href="/profile" onClick={() => setIsOpen(false)} className="bg-brand-blurple text-black" zIndex={20}>Profile</MenuCard>
                                    <MenuCard href="/information" onClick={() => setIsOpen(false)} className="bg-slate-800 text-white" zIndex={25}>Information</MenuCard>
                                    {isOrganizer && <MenuCard href="/events/create" onClick={() => setIsOpen(false)} className="bg-brand-grellow text-black" zIndex={30}>Create Event</MenuCard>}
                                    <MenuCard onClick={handleSignOut} className="bg-brand-oredge text-black" zIndex={50}>Sign Out</MenuCard>
                                    <div className="relative z-[60] bg-black p-8 pt-12 pb-12 flex flex-col items-center justify-center rounded-3xl -mt-9 shadow-2xl"><Logo className="h-20 w-auto text-white" /></div>
                                </div>
                            ) : (
                                <div className="flex flex-col w-full isolate">
                                    <DropdownMenuItem asChild className="p-0 focus:outline-none border-none outline-none"><Link href="/" onClick={() => setIsOpen(false)} className="relative z-10 flex items-center justify-start px-6 py-6 pb-16 w-full font-display font-black !text-2xl uppercase tracking-tight transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] rounded-3xl bg-brand-oredge text-black shadow-xl">Home</Link></DropdownMenuItem>
                                    <MenuCard href="/information" onClick={() => setIsOpen(false)} className="bg-slate-800 text-white" zIndex={15}>Information</MenuCard>
                                    <MenuCard href="/manifest" onClick={() => setIsOpen(false)} className="bg-brand-grellow text-black" zIndex={20}>Manifest</MenuCard>
                                    <MenuCard href="/auth/signin" onClick={() => setIsOpen(false)} className="bg-brand-rosand text-black" zIndex={30}>Sign In</MenuCard>
                                    <MenuCard href="/auth/signin" onClick={() => setIsOpen(false)} className="bg-brand-blurple text-white" zIndex={40}>Sign Up</MenuCard>
                                    <div className="relative z-50 bg-black p-8 pt-12 pb-12 flex flex-col items-center justify-center rounded-3xl -mt-9 shadow-2xl"><Logo className="h-20 w-auto text-white" /></div>
                                </div>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                </div>
            </nav >
        </>
    );
}
