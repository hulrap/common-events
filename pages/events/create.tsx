import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEventSchema, type CreateEventInput } from "@/lib/validations/event.schema";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/Events/RichTextEditor";
import { TicketManager } from "@/components/Events/TicketManager";
import { RecurrenceEditor } from "@/components/Events/RecurrenceEditor";
import { useConfig } from "@/hooks/useConfig";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { BannerUpload } from "@/components/Events/BannerUpload";
import { ArrowLeft, Calendar, Check, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Combobox } from "@/components/ui/combobox";
import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api-client";
import { FieldErrors } from "react-hook-form";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

export default function CreateEventPage() {
  const router = useRouter();
  const { categories } = useConfig();
  const { user, isOrganizer } = useAuth();
  const [venues, setVenues] = useState<Array<{ id: string; name: string }>>([]);
  const [activeTab, setActiveTab] = useState("basic");
  const [description, setDescription] = useState("");
  const [tickets, setTickets] = useState<any[]>([]);
  const [recurrence, setRecurrence] = useState<any>(null);
  const [desktopBannerUrl, setDesktopBannerUrl] = useState<string | null>(null);
  const [mobileBannerUrl, setMobileBannerUrl] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [isExternalEvent, setIsExternalEvent] = useState(false);
  const [sourceUrl, setSourceUrl] = useState<string>("");
  const [venueType, setVenueType] = useState<"existing" | "custom">("existing");
  const [validationErrorOpen, setValidationErrorOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const sections = ["basic", "details", "tickets", "recurrence"];
  const currentSectionIndex = sections.indexOf(activeTab);

  useEffect(() => {
    if (!user) {
      router.push("/auth/signin");
      return;
    }
    if (!isOrganizer) {
      router.push("/");
      return;
    }
  }, [user, isOrganizer, router]);

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const response = await fetch("/api/venues");
        if (response.ok) {
          const data = await response.json();
          setVenues(data);
        } else {
          console.error("Failed to fetch venues:", response.status, response.statusText);
          setVenues([]);
        }
      } catch (error) {
        console.error("Failed to fetch venues:", error);
        setVenues([]);
      }
    };
    fetchVenues();
  }, []);

  const updateBannerUrls = async (desktopUrl: string | null, mobileUrl: string | null) => {
    if (!eventId) return;

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bannerUrl: desktopUrl || undefined,
          mobileBannerUrl: mobileUrl || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update banners");
      }
    } catch (error) {
      console.error("Error updating banners:", error);
    }
  };

  const handleDesktopBannerChange = (url: string | null) => {
    setDesktopBannerUrl(url);
  };

  const handleMobileBannerChange = (url: string | null) => {
    setMobileBannerUrl(url);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      description: "",
      startDate: "" as any,
      endDate: "" as any,
      onlineEvent: false,
      venueType: "existing",
    } as any,
  });

  // Register custom fields that are managed by local state
  useEffect(() => {
    register("description");
    register("tickets");
    register("recurrence");
  }, [register]);

  const categoryId = watch("categoryId");
  const venueId = watch("venueId");
  const title = watch("title");
  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const customVenueName = watch("customVenueName");
  const customVenueStreet = watch("customVenueStreet");
  const customVenueCity = watch("customVenueCity");
  const address = watch("address");
  const latitude = watch("latitude");
  const longitude = watch("longitude");
  const onlineEvent = watch("onlineEvent");
  const eventUrl = watch("eventUrl");

  // Check section completion
  const isBasicComplete = useMemo(() => {
    return !!(title && startDate && endDate);
  }, [title, startDate, endDate]);

  const isDetailsComplete = useMemo(() => {
    if (!description || description.trim() === "") return false;
    if (venueType === "existing") {
      return !!venueId;
    } else {
      return !!(customVenueName && customVenueStreet && customVenueCity && address && latitude !== undefined && longitude !== undefined);
    }
  }, [description, venueType, venueId, customVenueName, customVenueStreet, customVenueCity, address, latitude, longitude]);

  const isFormValid = isBasicComplete && isDetailsComplete;

  const formatDateForInput = (date: string | Date | null | undefined) => {
    if (!date) return "";
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const navigateSection = (direction: "prev" | "next") => {
    const newIndex = direction === "next"
      ? Math.min(currentSectionIndex + 1, sections.length - 1)
      : Math.max(currentSectionIndex - 1, 0);
    setActiveTab(sections[newIndex]);
  };

  const onInvalid = (errors: FieldErrors<CreateEventInput>) => {
    const missingFields: string[] = [];

    // Basic Info
    if (errors.title) missingFields.push("Title (Basic Info)");
    if (errors.startDate) missingFields.push("Start Date (Basic Info)");
    if (errors.endDate) missingFields.push("End Date (Basic Info)");

    // Details
    if (errors.description) missingFields.push("Description (Details)");
    if (venueType === "existing" && errors.venueId) missingFields.push("Venue (Details)");
    if (venueType === "custom") {
      if (errors.customVenueName) missingFields.push("Venue Name (Details)");
      if (errors.customVenueStreet) missingFields.push("Street (Details)");
      if (errors.customVenueCity) missingFields.push("City (Details)");
    }
    if (isExternalEvent && errors.sourceUrl) missingFields.push("Source URL (Details)");


    if (missingFields.length > 0) {
      setValidationErrors(missingFields);
      setValidationErrorOpen(true);
    } else if (Object.keys(errors).length > 0) {
      setValidationErrors(["Please check all tabs for missing required information."]);
      setValidationErrorOpen(true);
    }
  };

  const onSubmit = async (data: CreateEventInput) => {
    try {
      const response = await apiFetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          description,
          tickets,
          recurrence,
          bannerUrl: desktopBannerUrl || undefined,
          mobileBannerUrl: mobileBannerUrl || undefined,
          sourceUrl: isExternalEvent && sourceUrl ? sourceUrl : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        console.error("Submission Error Response:", errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to create event`);
      }

      const createdEvent = await response.json();
      setEventId(createdEvent.id);

      toast.success("Event created successfully!");
      router.push(`/events/${createdEvent.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create event");
    }
  };

  const handleFinish = () => {
    router.push("/");
  };

  if (!user || !isOrganizer) {
    return null;
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-black">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-black/95 p-4 pb-3 backdrop-blur-sm grain-texture header-glass">
        <Link href="/">
          <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white transition-colors hover:bg-black/80">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <h1 className="text-xl font-bold text-white">Create New Event</h1>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Main Content */}
      <main className="flex-1 pb-8">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6 bg-black/50 border border-white/10 rounded-xl p-1">
                <TabsTrigger value="basic" className="data-[state=active]:bg-white/15 data-[state=active]:text-white flex items-center gap-2">
                  {isBasicComplete && <Check className="h-4 w-4 text-brand-green" />}
                  Basic Info
                </TabsTrigger>
                <TabsTrigger value="details" className="data-[state=active]:bg-white/15 data-[state=active]:text-white flex items-center gap-2">
                  {isDetailsComplete && <Check className="h-4 w-4 text-brand-green" />}
                  Details
                </TabsTrigger>
                <TabsTrigger value="tickets" className="data-[state=active]:bg-white/15 data-[state=active]:text-white">Tickets</TabsTrigger>
                <TabsTrigger value="recurrence" className="data-[state=active]:bg-white/15 data-[state=active]:text-white">Recurrence</TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic">
                <div className="rounded-xl border border-white/10 bg-white/15 backdrop-blur-sm grain-texture card-glass p-6 space-y-5">
                  <div>
                    <Label htmlFor="title" className="text-white">Title *</Label>
                    <Input
                      id="title"
                      {...register("title")}
                      placeholder="Event title"
                      className="mt-2 bg-black/40 border-white/10 text-white placeholder:text-white/50"
                    />
                    {errors.title && (
                      <p className="text-sm text-red-400 mt-1">{errors.title.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="category" className="text-white">Category</Label>
                    <Combobox
                      options={categories.map((cat) => ({
                        value: cat.id,
                        label: cat.name,
                      }))}
                      value={categoryId}
                      onValueChange={(value) => setValue("categoryId", value)}
                      placeholder="Select category"
                      searchPlaceholder="Search categories..."
                      className="mt-2"
                    />
                  </div>
                  <div className="flex gap-5">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Label htmlFor="startDate" className="text-white">Start Date *</Label>
                        <Calendar className="h-4 w-4 text-white/50" />
                      </div>
                      <Input
                        id="startDate"
                        type="datetime-local"
                        {...register("startDate")}
                        value={formatDateForInput(startDate)}
                        className="bg-black/40 border-white/10 text-white"
                      />
                      {errors.startDate && (
                        <p className="text-sm text-red-400 mt-1">{errors.startDate.message}</p>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Label htmlFor="endDate" className="text-white">End Date *</Label>
                        <Calendar className="h-4 w-4 text-white/50" />
                      </div>
                      <Input
                        id="endDate"
                        type="datetime-local"
                        {...register("endDate")}
                        value={formatDateForInput(endDate)}
                        className="bg-black/40 border-white/10 text-white"
                      />
                      {errors.endDate && (
                        <p className="text-sm text-red-400 mt-1">{errors.endDate.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Details Tab */}
              <TabsContent value="details">
                <div className="rounded-xl border border-white/10 bg-white/15 backdrop-blur-sm grain-texture card-glass p-6 space-y-5">
                  <div>
                    <Label className="text-white">Description *</Label>
                    <div className="mt-2">
                      <RichTextEditor
                        value={description}
                        onChange={(value) => {
                          setDescription(value);
                          setValue("description", value, { shouldValidate: true, shouldDirty: true });
                        }}
                      />
                    </div>
                  </div>
                  <BannerUpload
                    desktopBannerUrl={desktopBannerUrl}
                    mobileBannerUrl={mobileBannerUrl}
                    onDesktopBannerChange={handleDesktopBannerChange}
                    onMobileBannerChange={handleMobileBannerChange}
                  />
                  <div className="space-y-5">
                    <div>
                      <Label className="text-white mb-3 block">Venue Type</Label>
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant={venueType === "existing" ? "default" : "outline"}
                          onClick={() => {
                            setVenueType("existing");
                            setValue("venueId", "");
                            setValue("customVenueName", "");
                            setValue("customVenueStreet", "");
                            setValue("customVenueNumber", "");
                            setValue("customVenueZip", "");
                            setValue("customVenueCity", "");
                          }}
                          className={
                            venueType === "existing"
                              ? "bg-brand-orange hover:bg-brand-oredge text-white border-0"
                              : "bg-black/40 border-white/20 text-white hover:bg-black/60"
                          }
                        >
                          Select existing venue
                        </Button>
                        <Button
                          type="button"
                          variant={venueType === "custom" ? "default" : "outline"}
                          onClick={() => {
                            setVenueType("custom");
                            setValue("venueId", "");
                          }}
                          className={
                            venueType === "custom"
                              ? "bg-brand-orange hover:bg-brand-oredge text-white border-0"
                              : "bg-black/40 border-white/20 text-white hover:bg-black/60"
                          }
                        >
                          Enter custom venue
                        </Button>
                      </div>
                    </div>
                    {venueType === "existing" ? (
                      <div>
                        <Label htmlFor="venueId" className="text-white">Venue *</Label>
                        <Combobox
                          options={venues.map((venue) => ({
                            value: venue.id,
                            label: venue.name,
                          }))}
                          value={venueId}
                          onValueChange={(value) => setValue("venueId", value)}
                          placeholder="Select venue"
                          searchPlaceholder="Search venues..."
                          className="mt-2"
                        />
                        {errors.venueId && (
                          <p className="text-sm text-red-400 mt-1">{errors.venueId.message}</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <div>
                          <Label htmlFor="customVenueName" className="text-white">Venue Name *</Label>
                          <Input
                            id="customVenueName"
                            {...register("customVenueName")}
                            placeholder="Enter venue name"
                            className="mt-2 bg-black/40 border-white/10 text-white placeholder:text-white/50"
                          />
                          {errors.customVenueName && (
                            <p className="text-sm text-red-400 mt-1">{errors.customVenueName.message}</p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="customVenueStreet" className="text-white">Street *</Label>
                            <Input
                              id="customVenueStreet"
                              {...register("customVenueStreet")}
                              placeholder="Street name"
                              className="mt-2 bg-black/40 border-white/10 text-white placeholder:text-white/50"
                            />
                            {errors.customVenueStreet && (
                              <p className="text-sm text-red-400 mt-1">{errors.customVenueStreet.message}</p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="customVenueNumber" className="text-white">Number</Label>
                            <Input
                              id="customVenueNumber"
                              {...register("customVenueNumber")}
                              placeholder="Street number"
                              className="mt-2 bg-black/40 border-white/10 text-white placeholder:text-white/50"
                            />
                            {errors.customVenueNumber && (
                              <p className="text-sm text-red-400 mt-1">{errors.customVenueNumber.message}</p>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="customVenueZip" className="text-white">ZIP Code</Label>
                            <Input
                              id="customVenueZip"
                              {...register("customVenueZip")}
                              placeholder="ZIP code"
                              className="mt-2 bg-black/40 border-white/10 text-white placeholder:text-white/50"
                            />
                            {errors.customVenueZip && (
                              <p className="text-sm text-red-400 mt-1">{errors.customVenueZip.message}</p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="customVenueCity" className="text-white">City *</Label>
                            <Input
                              id="customVenueCity"
                              {...register("customVenueCity")}
                              placeholder="City"
                              className="mt-2 bg-black/40 border-white/10 text-white placeholder:text-white/50"
                            />
                            {errors.customVenueCity && (
                              <p className="text-sm text-red-400 mt-1">{errors.customVenueCity.message}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="onlineEvent"
                        onCheckedChange={(checked) =>
                          setValue("onlineEvent", checked as boolean)
                        }
                      />
                      <Label htmlFor="onlineEvent" className="text-white cursor-pointer">Online Event</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isExternalEvent"
                        checked={isExternalEvent}
                        onCheckedChange={(checked) => {
                          setIsExternalEvent(checked as boolean);
                          if (!checked) {
                            setSourceUrl("");
                            setValue("sourceUrl", "");
                          }
                        }}
                      />
                      <Label htmlFor="isExternalEvent" className="text-white cursor-pointer">Not your own event?</Label>
                    </div>
                    {isExternalEvent && (
                      <div>
                        <Label htmlFor="sourceUrl" className="text-white">Source URL *</Label>
                        <Input
                          id="sourceUrl"
                          type="url"
                          value={sourceUrl}
                          onChange={(e) => {
                            setSourceUrl(e.target.value);
                            setValue("sourceUrl", e.target.value);
                          }}
                          placeholder="https://example.com/event"
                          required={isExternalEvent}
                          className="mt-2 bg-black/40 border-white/10 text-white placeholder:text-white/50"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-5 border-t border-white/10 pt-5">
                    <h3 className="text-base font-semibold text-white">Additional Information</h3>

                    <div>
                      <Label htmlFor="ageRestriction" className="text-white">Age Restriction</Label>
                      <Input
                        id="ageRestriction"
                        {...register("ageRestriction")}
                        placeholder="e.g., 18+"
                        className="mt-2 bg-black/40 border-white/10 text-white placeholder:text-white/50"
                      />
                    </div>

                    <div>
                      <Label htmlFor="dressCode" className="text-white">Dress Code</Label>
                      <Input
                        id="dressCode"
                        {...register("dressCode")}
                        placeholder="e.g., Formal, Casual, etc."
                        className="mt-2 bg-black/40 border-white/10 text-white placeholder:text-white/50"
                      />
                    </div>

                    <div>
                      <Label htmlFor="language" className="text-white">Language</Label>
                      <Input
                        id="language"
                        {...register("language")}
                        placeholder="e.g., English, German, etc."
                        className="mt-2 bg-black/40 border-white/10 text-white placeholder:text-white/50"
                      />
                    </div>

                    <div>
                      <Label htmlFor="accessibilityNotes" className="text-white">Accessibility Notes</Label>
                      <Input
                        id="accessibilityNotes"
                        {...register("accessibilityNotes")}
                        placeholder="e.g., Wheelchair accessible, Sign language interpretation, etc."
                        className="mt-2 bg-black/40 border-white/10 text-white placeholder:text-white/50"
                      />
                    </div>

                    <div>
                      <Label htmlFor="parkingInfo" className="text-white">Parking Information</Label>
                      <Input
                        id="parkingInfo"
                        {...register("parkingInfo")}
                        placeholder="e.g., Free parking available, Street parking, etc."
                        className="mt-2 bg-black/40 border-white/10 text-white placeholder:text-white/50"
                      />
                    </div>

                    <div>
                      <Label htmlFor="publicTransportInfo" className="text-white">Public Transport Information</Label>
                      <Input
                        id="publicTransportInfo"
                        {...register("publicTransportInfo")}
                        placeholder="e.g., U-Bahn Line 6, Bus 24, etc."
                        className="mt-2 bg-black/40 border-white/10 text-white placeholder:text-white/50"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Tickets Tab */}
              <TabsContent value="tickets">
                <div className="rounded-xl border border-white/10 bg-white/15 backdrop-blur-sm grain-texture card-glass p-6">
                  <TicketManager
                    tickets={tickets}
                    onChange={(value) => {
                      setTickets(value);
                      setValue("tickets", value, { shouldValidate: true, shouldDirty: true });
                    }}
                  />
                </div>
              </TabsContent>

              {/* Recurrence Tab */}
              <TabsContent value="recurrence">
                <div className="rounded-xl border border-white/10 bg-white/15 backdrop-blur-sm grain-texture card-glass p-6">
                  <RecurrenceEditor
                    recurrence={recurrence}
                    onChange={(value) => {
                      setRecurrence(value);
                      setValue("recurrence", value, { shouldValidate: true, shouldDirty: true });
                    }}
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Footer Actions */}
            <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 pb-20 md:pb-0">
              <div className="flex w-full md:w-auto gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigateSection("prev")}
                  disabled={currentSectionIndex === 0}
                  className="flex-1 md:flex-none border-white/10 text-white hover:bg-black/80 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                {currentSectionIndex < sections.length - 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigateSection("next")}
                    className="flex-1 md:flex-none border-white/10 text-white hover:bg-black/80"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
              <div className="flex w-full md:w-auto gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/")}
                  className="flex-1 md:flex-none border-white/10 text-white hover:bg-black/80"
                >
                  Cancel
                </Button>
                {eventId ? (
                  <Button
                    type="button"
                    onClick={handleFinish}
                    className="flex-1 md:flex-none bg-brand-orange hover:bg-brand-oredge text-white border-0"
                  >
                    Done
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="flex-1 md:flex-none bg-brand-orange hover:bg-brand-oredge text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Event
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </main>

      <Dialog open={validationErrorOpen} onOpenChange={setValidationErrorOpen}>
        <DialogContent className="z-[200] bg-zinc-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Missing Information</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Please fill in the following required fields to create your event:
            </DialogDescription>
          </DialogHeader>
          <ul className="list-disc pl-5 space-y-1 text-sm text-red-400">
            {validationErrors.map((field, i) => (
              <li key={i}>{field}</li>
            ))}
          </ul>
          <DialogFooter>
            <Button onClick={() => setValidationErrorOpen(false)} className="bg-white text-black hover:bg-white/90">
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

