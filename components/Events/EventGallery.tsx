import { useState } from "react";
import Image from "next/image";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, X, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { uploadGalleryImage, deleteGalleryImage } from "@/lib/storage/upload";
import { createClient } from "@/lib/supabase/client";

interface GalleryImage {
    id: string;
    url: string;
    caption?: string | null;
    copyright?: string | null;
}

interface EventGalleryProps {
    eventId: string;
    images: GalleryImage[];
    isOrganizer: boolean;
    onImagesUpdate: () => void;
}

export function EventGallery({ eventId, images, isOrganizer, onImagesUpdate }: EventGalleryProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const supabase = createClient();

        try {
            // Process uploads sequentially or parallel
            const uploadPromises = Array.from(files).map(async (file) => {
                const publicUrl = await uploadGalleryImage(file, eventId);

                // Save to DB
                const { error } = await supabase
                    .from("event_gallery_images")
                    .insert({
                        event_id: eventId,
                        url: publicUrl,
                        sort_order: 0,
                        copyright: isOrganizer ? "© All Rights Reserved" : null // Default copyright
                    });

                if (error) throw error;
            });

            await Promise.all(uploadPromises);
            toast.success("Images uploaded successfully");
            onImagesUpdate();
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Failed to upload images");
        } finally {
            setIsUploading(false);
            // Reset input
            e.target.value = "";
        }
    };

    const handleDelete = async (image: GalleryImage) => {
        // Direct delete without confirmation as requested
        // if (!confirm("Are you sure you want to delete this image?")) return;

        setDeletingId(image.id);
        const supabase = createClient();

        try {
            // Delete from storage
            await deleteGalleryImage(image.url);

            // Delete from DB
            const { error } = await supabase
                .from("event_gallery_images")
                .delete()
                .eq("id", image.id);

            if (error) throw error;

            toast.success("Image deleted");
            onImagesUpdate();
            if (selectedImage?.id === image.id) setSelectedImage(null);
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Failed to delete image");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Gallery</h2>
                {isOrganizer && (
                    <div>
                        <input
                            type="file"
                            id="gallery-upload"
                            multiple
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                        />
                        <label
                            htmlFor="gallery-upload"
                            className={cn(
                                buttonVariants({ variant: "outline", size: "sm" }),
                                "cursor-pointer border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/40 transition-all duration-300",
                                isUploading && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <span className="flex items-center gap-2">
                                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                Add Photos
                            </span>
                        </label>
                    </div>
                )}
            </div>

            {images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {images.map((image) => (
                        <div
                            key={image.id}
                            className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer bg-white/5 border border-white/10"
                            onClick={() => setSelectedImage(image)}
                        >
                            <Image
                                src={image.url}
                                alt={image.caption || "Gallery image"}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            {isOrganizer && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(image);
                                    }}
                                    disabled={deletingId === image.id}
                                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                                >
                                    {deletingId === image.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 border-2 border-dashed border-white/10 rounded-xl bg-white/5">
                    <p className="text-white/40 text-sm">No images in gallery yet</p>
                </div>
            )}

            {/* Lightbox Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X className="h-8 w-8" />
                    </button>
                    <div className="relative w-full max-w-5xl aspect-video max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
                        <Image
                            src={selectedImage.url}
                            alt={selectedImage.caption || "Gallery image"}
                            fill
                            className="object-contain"
                        />
                        {selectedImage.copyright && (
                            <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded text-white text-sm">
                                {selectedImage.copyright}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
