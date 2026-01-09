import { useState } from "react";
import { Button } from "@/components/ui/button";
import { User, Mail, Globe, Phone, Facebook, Instagram, Twitter, Linkedin, Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/router";

interface OrganizerHeaderProps {
    organizer: {
        id: string;
        fullName?: string | null;
        organizationName?: string | null;
        slug?: string | null;
        contactEmail?: string | null;
        contactPhone?: string | null;
        websiteUrl?: string | null;
        socialLinks?: any;
        profileImage?: string | null;
    };
    isFollowing: boolean;
    followersCount: number;
}

export function OrganizerHeader({ organizer, isFollowing: initialIsFollowing, followersCount: initialFollowersCount }: OrganizerHeaderProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [followersCount, setFollowersCount] = useState(initialFollowersCount);
    const [isLoading, setIsLoading] = useState(false);

    const handleFollow = async () => {
        if (!user) {
            router.push("/auth/signin");
            return;
        }

        setIsLoading(true);
        const previousState = isFollowing;
        const previousCount = followersCount;

        // Optimistic update
        setIsFollowing(!isFollowing);
        setFollowersCount(isFollowing ? followersCount - 1 : followersCount + 1);

        try {
            const { apiFetch } = await import('@/lib/api-client');
            const response = await apiFetch("/api/organizers/follow", {
                method: isFollowing ? "DELETE" : "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ organizerId: organizer.id }),
            });

            if (!response.ok) {
                throw new Error("Failed to update follow status");
            }

            toast.success(isFollowing ? "Unfollowed organizer" : "Following organizer");
        } catch (error) {
            // Revert on error
            setIsFollowing(previousState);
            setFollowersCount(previousCount);
            toast.error("Failed to update follow status");
        } finally {
            setIsLoading(false);
        }
    };

    const displayName = organizer.organizationName || organizer.fullName || "Organizer";

    return (
        <div className="w-full bg-black border-b border-white/10 pb-8 pt-20 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="h-20 w-20 rounded-full bg-brand-grellow flex items-center justify-center text-3xl font-bold text-black border-2 border-white overflow-hidden relative">
                            {organizer.profileImage ? (
                                <img
                                    src={organizer.profileImage}
                                    alt={displayName}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                displayName.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-1">{displayName}</h1>
                            <div className="flex items-center gap-4 text-sm text-white/60">
                                <span>{followersCount} Followers</span>
                                {organizer.websiteUrl && (
                                    <a href={organizer.websiteUrl} target="_blank" rel="noopener noreferrer" className="hover:text-brand-orange transition-colors flex items-center gap-1">
                                        <Globe className="h-3 w-3" />
                                        Website
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={handleFollow}
                        disabled={isLoading}
                        className={`rounded-full px-6 h-10 font-semibold transition-all ${isFollowing
                            ? "bg-transparent border border-white/20 text-white hover:bg-white/10"
                            : "bg-brand-orange text-white hover:bg-brand-oredge border-0"
                            }`}
                    >
                        {isFollowing ? (
                            <>
                                <Check className="mr-2 h-4 w-4" />
                                Following
                            </>
                        ) : (
                            <>
                                <Plus className="mr-2 h-4 w-4" />
                                Follow
                            </>
                        )}
                    </Button>
                </div>

                {/* Contact & Socials */}
                <div className="mt-6 flex flex-wrap gap-4 text-sm text-white/70">
                    {organizer.contactEmail && (
                        <a href={`mailto:${organizer.contactEmail}`} className="flex items-center gap-2 hover:text-white transition-colors">
                            <Mail className="h-4 w-4" />
                            {organizer.contactEmail}
                        </a>
                    )}
                    {organizer.contactPhone && (
                        <a href={`tel:${organizer.contactPhone}`} className="flex items-center gap-2 hover:text-white transition-colors">
                            <Phone className="h-4 w-4" />
                            {organizer.contactPhone}
                        </a>
                    )}

                    {/* Social Links - assuming socialLinks is an object like { facebook: 'url', ... } */}
                    {organizer.socialLinks && typeof organizer.socialLinks === 'object' && (
                        <div className="flex items-center gap-3 ml-auto">
                            {organizer.socialLinks.facebook && (
                                <a href={organizer.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-brand-blue transition-colors">
                                    <Facebook className="h-5 w-5" />
                                </a>
                            )}
                            {organizer.socialLinks.instagram && (
                                <a href={organizer.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-brand-pink transition-colors">
                                    <Instagram className="h-5 w-5" />
                                </a>
                            )}
                            {organizer.socialLinks.twitter && (
                                <a href={organizer.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-brand-cyan transition-colors">
                                    <Twitter className="h-5 w-5" />
                                </a>
                            )}
                            {organizer.socialLinks.linkedin && (
                                <a href={organizer.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-brand-blue transition-colors">
                                    <Linkedin className="h-5 w-5" />
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
