import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventCard } from "@/components/Calendar/EventCard";
import { Calendar, Image as ImageIcon, Info, ArrowLeft, ImageOff } from "lucide-react";
import Image from "next/image";
import { supabaseLoader } from "@/lib/image-optimization";

interface OrganizerTabsProps {
    events: any[];
    galleryImages: any[];
    organizer: any;
}

export function OrganizerTabs({ events, galleryImages, organizer }: OrganizerTabsProps) {
    const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);

    // Group images by event
    const albums = galleryImages.reduce((acc: any, item: any) => {
        if (!acc[item.eventId]) {
            acc[item.eventId] = {
                eventId: item.eventId,
                eventTitle: item.eventTitle,
                images: []
            };
        }
        acc[item.eventId].images.push(item);
        return acc;
    }, {});

    const albumList = Object.values(albums);

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <Tabs defaultValue="events" className="w-full">
                <TabsList className="w-full justify-start bg-transparent border-b border-white/10 rounded-none h-auto p-0 mb-8">
                    <TabsTrigger
                        value="events"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-orange data-[state=active]:bg-transparent data-[state=active]:text-white text-white/60 pb-3 px-6 text-base font-medium"
                    >
                        <Calendar className="mr-2 h-4 w-4" />
                        Events
                    </TabsTrigger>
                    <TabsTrigger
                        value="photos"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-orange data-[state=active]:bg-transparent data-[state=active]:text-white text-white/60 pb-3 px-6 text-base font-medium"
                    >
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Photos
                    </TabsTrigger>
                    <TabsTrigger
                        value="about"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-orange data-[state=active]:bg-transparent data-[state=active]:text-white text-white/60 pb-3 px-6 text-base font-medium"
                    >
                        <Info className="mr-2 h-4 w-4" />
                        About
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="events" className="mt-0">
                    {events.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {events.map((event) => (
                                <EventCard key={event.id} event={event} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-white/40">
                            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No upcoming events</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="photos" className="mt-0">
                    {selectedAlbumId ? (
                        // Album Detail View
                        <div className="space-y-6">
                            <button
                                onClick={() => setSelectedAlbumId(null)}
                                className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Albums
                            </button>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {albums[selectedAlbumId].images.map((item: any) => (
                                    <div key={item.image.id} className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer bg-white/5">
                                        <Image
                                            loader={supabaseLoader}
                                            src={item.image.url}
                                            alt={item.image.caption || `Gallery image from ${item.eventTitle}`}
                                            fill
                                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                        {item.image.caption && (
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                                <p className="text-white/90 text-sm truncate">{item.image.caption}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        // Albums Grid View
                        galleryImages.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {albumList.map((album: any) => (
                                    <div
                                        key={album.eventId}
                                        onClick={() => setSelectedAlbumId(album.eventId)}
                                        className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden grain-texture card-glass cursor-pointer group"
                                    >
                                        {/* Cover Image */}
                                        <div className="relative w-full aspect-square md:aspect-video overflow-hidden bg-black rounded-t-xl">
                                            {album.images[0]?.image.url ? (
                                                <Image
                                                    loader={supabaseLoader}
                                                    src={album.images[0].image.url}
                                                    alt={album.eventTitle}
                                                    fill
                                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                    sizes="(max-width: 768px) 100vw, 50vw"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ImageOff className="h-12 w-12 text-white/30" />
                                                </div>
                                            )}

                                            {/* Photo count badge */}
                                            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-xs font-medium text-white border border-white/10 flex items-center gap-1.5">
                                                <ImageIcon className="h-3 w-3" />
                                                {album.images.length}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-5 rounded-b-xl bg-black/85 backdrop-blur-sm h-[80px] flex flex-col justify-center border-t border-white/5">
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-brand-orange transition-colors">
                                                {album.eventTitle}
                                            </h3>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 text-white/40">
                                <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No photos available</p>
                            </div>
                        )
                    )}
                </TabsContent>

                <TabsContent value="about" className="mt-0">
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h3 className="text-xl font-bold text-white mb-4">About {organizer.organizationName || organizer.fullName}</h3>
                        {/* Since we don't have a dedicated 'bio' field in the schema yet, we might want to add one or use description if available. 
                For now, we'll display contact info and basic details. */}
                        <div className="space-y-4 text-white/80">
                            <p>
                                {organizer.organizationName
                                    ? `${organizer.organizationName} is an event organizer on our platform.`
                                    : "This user is an event organizer on our platform."}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                <div>
                                    <h4 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-2">Contact</h4>
                                    <div className="space-y-2">
                                        {organizer.contactEmail && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-white">{organizer.contactEmail}</span>
                                            </div>
                                        )}
                                        {organizer.contactPhone && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-white">{organizer.contactPhone}</span>
                                            </div>
                                        )}
                                        {!organizer.contactEmail && !organizer.contactPhone && (
                                            <span className="text-white/40 italic">No contact information provided</span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-2">Links</h4>
                                    <div className="space-y-2">
                                        {organizer.websiteUrl ? (
                                            <a
                                                href={organizer.websiteUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-brand-orange hover:underline block"
                                            >
                                                Visit Website
                                            </a>
                                        ) : (
                                            <span className="text-white/40 italic">No website provided</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
