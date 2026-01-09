import { GetServerSideProps } from "next";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { OrganizerHeader } from "@/components/Organizers/OrganizerHeader";
import { OrganizerTabs } from "@/components/Organizers/OrganizerTabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface OrganizerPageProps {
    slug: string;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { slug } = context.params as { slug: string };
    return {
        props: {
            slug,
        },
    };
};

export default function OrganizerPage({ slug }: OrganizerPageProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchOrganizerData();
    }, [slug]);

    const fetchOrganizerData = async () => {
        try {
            const { apiFetch } = await import('@/lib/api-client');
            const response = await apiFetch(`/api/organizers/${slug}`);

            if (response.ok) {
                const result = await response.json();
                setData(result);
            } else {
                toast.error("Organizer not found");
                router.push("/");
            }
        } catch (error) {
            console.error("Failed to fetch organizer:", error);
            toast.error("Failed to load organizer profile");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-black">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="min-h-screen bg-black text-white pb-20">
            {/* Back Button */}
            <div className="fixed top-4 left-4 z-50">
                <Link href="/">
                    <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white transition-colors hover:bg-black/80 backdrop-blur-sm">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                </Link>
            </div>

            <OrganizerHeader
                organizer={data.organizer}
                isFollowing={data.isFollowing}
                followersCount={data.followersCount}
            />

            <OrganizerTabs
                events={data.events}
                galleryImages={data.galleryImages}
                organizer={data.organizer}
            />
        </div>
    );
}
