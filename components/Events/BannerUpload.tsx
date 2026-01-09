import { useState, useRef, useCallback, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Session } from "@supabase/supabase-js";
import { supabaseLoader } from "@/lib/image-optimization";

interface BannerUploadProps {
  readonly desktopBannerUrl?: string | null;
  readonly mobileBannerUrl?: string | null;
  readonly onDesktopBannerChange: (url: string | null) => void;
  readonly onMobileBannerChange: (url: string | null) => void;
  readonly disabled?: boolean;
  readonly oldDesktopBannerUrl?: string | null;
  readonly oldMobileBannerUrl?: string | null;
}

export function BannerUpload({
  desktopBannerUrl,
  mobileBannerUrl,
  onDesktopBannerChange,
  onMobileBannerChange,
  disabled = false,
  oldDesktopBannerUrl,
  oldMobileBannerUrl,
}: BannerUploadProps) {
  const { user } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [dragActiveDesktop, setDragActiveDesktop] = useState(false);
  const [dragActiveMobile, setDragActiveMobile] = useState(false);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const getSession = async () => {
      const supabase = createClient();
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      setSession(currentSession);
    };

    if (user) {
      getSession();
    }
  }, [user]);

  const validateFile = useCallback((file: File): boolean => {
    const imageTypeRegex = /^image\/(jpeg|png|webp)$/;
    if (!imageTypeRegex.exec(file.type)) {
      toast.error("Invalid file type. Only JPEG, PNG, and WebP are allowed.");
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit.");
      return false;
    }

    return true;
  }, []);

  const handleFileUpload = useCallback(async (file: File, type: "desktop" | "mobile") => {
    if (!validateFile(file)) return;

    const isMobile = type === "mobile";
    if (isMobile) {
      setUploadingMobile(true);
    } else {
      setUploadingDesktop(true);
    }

    try {
      const randomId = Math.random().toString(36).substring(2, 15);
      const timestamp = Date.now();
      const fileExt = file.name.split(".").pop();
      const fileName = `temp-${timestamp}-${randomId}-${type}.${fileExt}`;
      const filePath = `temp-banners/${fileName}`;

      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const base64Data = base64.split(",")[1];

          const { apiFetch } = await import('@/lib/api-client');
          const response = await apiFetch("/api/upload/temp-media", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({
              file: base64Data,
              type,
              fileName,
              filePath,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error("Upload failed:", errorData);
            throw new Error(errorData.error || "Failed to upload banner");
          }

          const { url } = await response.json();
          if (isMobile) {
            onMobileBannerChange(url);
          } else {
            onDesktopBannerChange(url);
          }
          toast.success(`${type === "mobile" ? "Mobile" : "Desktop"} banner uploaded successfully`);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to upload banner");
        } finally {
          if (isMobile) {
            setUploadingMobile(false);
          } else {
            setUploadingDesktop(false);
          }
        }
      };

      reader.onerror = () => {
        throw new Error("Failed to read file");
      };
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload banner");
      if (isMobile) {
        setUploadingMobile(false);
      } else {
        setUploadingDesktop(false);
      }
    }
  }, [validateFile, session?.access_token, onDesktopBannerChange, onMobileBannerChange]);

  const handleDrag = useCallback((e: React.DragEvent, type: "desktop" | "mobile") => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      if (type === "mobile") {
        setDragActiveMobile(true);
      } else {
        setDragActiveDesktop(true);
      }
    } else if (e.type === "dragleave") {
      if (type === "mobile") {
        setDragActiveMobile(false);
      } else {
        setDragActiveDesktop(false);
      }
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, type: "desktop" | "mobile") => {
    e.preventDefault();
    e.stopPropagation();

    if (type === "mobile") {
      setDragActiveMobile(false);
    } else {
      setDragActiveDesktop(false);
    }

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find((f) => f.type.startsWith("image/"));

    if (imageFile) {
      handleFileUpload(imageFile, type);
    } else if (files.length > 0) {
      toast.error("Please drop an image file");
    }
  }, [disabled, handleFileUpload]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "desktop" | "mobile") => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, type);
    }
    // Reset input so same file can be selected again
    if (e.target) {
      e.target.value = "";
    }
  };

  const deleteOldBanner = async (url: string | null | undefined) => {
    if (!url) return;

    try {
      const supabase = createClient();
      const path = url.split("/").slice(-2).join("/");
      await supabase.storage.from("event-banners").remove([path]);
    } catch (error) {
      // Silently fail - old image deletion is not critical
    }
  };

  const handleRemove = (type: "desktop" | "mobile") => {
    if (type === "mobile") {
      deleteOldBanner(mobileBannerUrl);
      onMobileBannerChange(null);
    } else {
      deleteOldBanner(desktopBannerUrl);
      onDesktopBannerChange(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Desktop Banner */}
      <div className="space-y-2">
        <Label className="text-white">Desktop Banner (16:9 ratio recommended)</Label>
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <div
          role={disabled ? undefined : "button"}
          tabIndex={disabled ? undefined : 0}
          aria-label={disabled ? undefined : "Upload desktop banner"}
          className={(() => {
            let baseClasses = "relative w-full max-w-md aspect-video rounded-lg overflow-hidden border-2 border-dashed transition-colors ";
            if (dragActiveDesktop) {
              baseClasses += "border-brand-orange bg-brand-orange/10 ";
            } else if (desktopBannerUrl) {
              baseClasses += "border-white/20 ";
            } else {
              baseClasses += "border-white/10 bg-black/20 ";
            }
            baseClasses += disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";
            return baseClasses;
          })()}
          onDragEnter={(e) => handleDrag(e, "desktop")}
          onDragLeave={(e) => handleDrag(e, "desktop")}
          onDragOver={(e) => handleDrag(e, "desktop")}
          onDrop={(e) => handleDrop(e, "desktop")}
          onClick={() => !disabled && !desktopBannerUrl && desktopInputRef.current?.click()}
          onKeyDown={(e) => {
            if (!disabled && !desktopBannerUrl && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              desktopInputRef.current?.click();
            }
          }}
        >
          {desktopBannerUrl ? (
            <>
              <Image
                loader={supabaseLoader}
                src={desktopBannerUrl}
                alt="Desktop banner preview"
                fill
                className="object-cover"
                priority
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove("desktop");
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full transition-colors z-10"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {!disabled && (
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      desktopInputRef.current?.click();
                    }}
                    className="opacity-0 hover:opacity-100 bg-black/60 text-white px-4 py-2 rounded-lg transition-opacity"
                  >
                    Change Image
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4">
              <ImageIcon className="h-12 w-12 text-white/50" />
              <div className="text-sm text-white/70 text-center">
                {(() => {
                  if (uploadingDesktop) return "Uploading...";
                  if (dragActiveDesktop) return "Drop image here";
                  return (
                    <>
                      Drag & drop or click to upload
                      <br />
                      <span className="text-xs text-white/50">JPEG, PNG, or WebP (max 5MB)</span>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
          <input
            ref={desktopInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleFileSelect(e, "desktop")}
            disabled={disabled || uploadingDesktop}
          />
        </div>
      </div>

      {/* Mobile Banner */}
      <div className="space-y-2">
        <Label className="text-white">Mobile Banner (1:1 ratio recommended)</Label>
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <div
          role={disabled ? undefined : "button"}
          tabIndex={disabled ? undefined : 0}
          aria-label={disabled ? undefined : "Upload mobile banner"}
          className={(() => {
            let baseClasses = "relative w-full max-w-md aspect-square rounded-lg overflow-hidden border-2 border-dashed transition-colors ";
            if (dragActiveMobile) {
              baseClasses += "border-brand-orange bg-brand-orange/10 ";
            } else if (mobileBannerUrl) {
              baseClasses += "border-white/20 ";
            } else {
              baseClasses += "border-white/10 bg-black/20 ";
            }
            baseClasses += disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";
            return baseClasses;
          })()}
          onDragEnter={(e) => handleDrag(e, "mobile")}
          onDragLeave={(e) => handleDrag(e, "mobile")}
          onDragOver={(e) => handleDrag(e, "mobile")}
          onDrop={(e) => handleDrop(e, "mobile")}
          onClick={() => !disabled && !mobileBannerUrl && mobileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (!disabled && !mobileBannerUrl && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              mobileInputRef.current?.click();
            }
          }}
        >
          {mobileBannerUrl ? (
            <>
              <Image
                loader={supabaseLoader}
                src={mobileBannerUrl}
                alt="Mobile banner preview"
                fill
                className="object-cover"
                priority
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove("mobile");
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full transition-colors z-10"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {!disabled && (
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      mobileInputRef.current?.click();
                    }}
                    className="opacity-0 hover:opacity-100 bg-black/60 text-white px-4 py-2 rounded-lg transition-opacity"
                  >
                    Change Image
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4">
              <ImageIcon className="h-12 w-12 text-white/50" />
              <div className="text-sm text-white/70 text-center">
                {(() => {
                  if (uploadingMobile) return "Uploading...";
                  if (dragActiveMobile) return "Drop image here";
                  return (
                    <>
                      Drag & drop or click to upload
                      <br />
                      <span className="text-xs text-white/50">JPEG, PNG, or WebP (max 5MB)</span>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
          <input
            ref={mobileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleFileSelect(e, "mobile")}
            disabled={disabled || uploadingMobile}
          />
        </div>
      </div>
    </div>
  );
}
