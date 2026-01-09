import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateEventSchema, type UpdateEventInput } from "@/lib/validations/event.schema";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { RichTextEditor } from "@/components/Events/RichTextEditor";
import { TicketManager } from "@/components/Events/TicketManager";
import { RecurrenceEditor } from "@/components/Events/RecurrenceEditor";
import { useConfig } from "@/hooks/useConfig";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Checkbox } from "@/components/ui/checkbox";
import { BannerUpload } from "@/components/Events/BannerUpload";
import { AddressAutocomplete, type AddressAutocompleteValue } from "@/components/Events/AddressAutocomplete";
import { ArrowLeft, Check, Bell, Send } from "lucide-react";
import Link from "next/link";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

export default function EditEventPage() {
  const router = useRouter();
  const { id } = router.query;
  const { categories } = useConfig();
  const { user } = useAuth();
  const [venues, setVenues] = useState<Array<{ id: string; name: string }>>([]);
  const [activeTab, setActiveTab] = useState("basic");
  const [description, setDescription] = useState("");
  const [tickets, setTickets] = useState<any[]>([]);
  const [recurrence, setRecurrence] = useState<any>(null);
  const [desktopBannerUrl, setDesktopBannerUrl] = useState<string | null>(null);
  const [mobileBannerUrl, setMobileBannerUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isExternalEvent, setIsExternalEvent] = useState(false);
  const [sourceUrl, setSourceUrl] = useState<string>("");
  const [venueType, setVenueType] = useState<"existing" | "custom">("existing");
  const [customAddressData, setCustomAddressData] = useState<
    Partial<AddressAutocompleteValue>
  >({});
  const [event, setEvent] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const handleDesktopBannerChange = (url: string | null) => {
    setDesktopBannerUrl(url);
  };

  const handleMobileBannerChange = (url: string | null) => {
    setMobileBannerUrl(url);
  };

  const {
    register,
    handleSubmit,
    formState,
    formState: { errors },
    setValue,
    reset,
    watch,
    getValues,
  } = useForm<UpdateEventInput>({
    resolver: zodResolver(updateEventSchema),
    mode: "onBlur",
  });

  // Debug: Log validation errors
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const errorMessages = Object.entries(errors).reduce((acc: Record<string, string>, [key, error]: any) => {
        acc[key] = error?.message || "Unknown error";
        return acc;
      }, {});
      toast.error(`Validation Error: ${JSON.stringify(errorMessages)}`);
    }
  }, [errors]);


  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const { apiFetch } = await import('@/lib/api-client');
        const response = await apiFetch("/api/venues");
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

  useEffect(() => {
    if (id && user) {
      const loadEvent = async () => {
        try {
          setLoading(true);
          const { apiFetch } = await import('@/lib/api-client');
          const response = await apiFetch(`/api/events/${id}`);
          if (!response.ok) {
            throw new Error("Failed to fetch event");
          }

          const eventData = await response.json();
          setEvent(eventData);

          // Check if user is the organizer
          if (eventData.organizerId !== user.id) {
            toast.error("You don't have permission to edit this event");
            router.push(`/events/${id}`);
            return;
          }

          setIsAuthorized(true);

          // Determine venue type based on whether venueId exists
          const hasVenueId = !!eventData.venueId;
          setVenueType(hasVenueId ? "existing" : "custom");

          const formatDateForInput = (date: string | Date | null | undefined) => {
            if (!date) return "";
            const d = typeof date === 'string' ? new Date(date) : date;
            if (isNaN(d.getTime())) return "";
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            const formatted = `${year}-${month}-${day}T${hours}:${minutes}`;
            return formatted;
          };

          const resetData: any = {
            title: eventData.title,

            startDate: formatDateForInput(eventData.startDate),
            endDate: formatDateForInput(eventData.endDate),
            venueId: eventData.venueId || "",
            customLocation: eventData.customLocation || "",
            customVenueName: eventData.customLocation || "",
            address: eventData.address || "",
            city: eventData.city || "",
            country: eventData.country || "",
            latitude: eventData.latitude,
            longitude: eventData.longitude,
            onlineEvent: eventData.onlineEvent,
            eventUrl: eventData.eventUrl || "",
            organizerName: eventData.organizerName || "",
            organizerContact: eventData.organizerContact || "",
            sourceUrl: eventData.sourceUrl || "",
            externalLink: eventData.externalLink || "",
            externalLinkText: eventData.externalLinkText || "",
            categoryId: eventData.categoryId,
            tags: eventData.tags,
            maxAttendees: eventData.maxAttendees,
            registrationDeadline: eventData.registrationDeadline ? formatDateForInput(eventData.registrationDeadline) : null,
            ageRestriction: eventData.ageRestriction || "",
            dressCode: eventData.dressCode || "",
            language: eventData.language || "",
            accessibilityNotes: eventData.accessibilityNotes || "",
            parkingInfo: eventData.parkingInfo || "",
            publicTransportInfo: eventData.publicTransportInfo || "",
            isAutoReminderEnabled: eventData.isAutoReminderEnabled || false,
          };
          reset(resetData);

          setDescription(eventData.description || "");
          setTickets(eventData.tickets || []);
          setRecurrence(eventData.recurrence || null);
          setDesktopBannerUrl(eventData.bannerUrl || null);
          setMobileBannerUrl(eventData.mobileBannerUrl || null);
          setCustomAddressData({
            address: eventData.address,
            city: eventData.city,
            country: eventData.country,
            latitude: eventData.latitude,
            longitude: eventData.longitude,
          });
          setIsExternalEvent(!!eventData.sourceUrl);
          setSourceUrl(eventData.sourceUrl || "");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to load event");
          router.push(`/events/${id}`);
        } finally {
          setLoading(false);
        }
      };
      loadEvent();
    } else if (!user) {
      router.push("/auth/signin");
    }
  }, [id, user, router, reset]);

  const onSubmit = async (formData: UpdateEventInput) => {
    try {
      setSubmitting(true);

      // Only include fields that have actually changed from original event
      const payload: Partial<UpdateEventInput> = {};

      if (formData.title !== event?.title) payload.title = formData.title;

      if (formData.startDate !== undefined) payload.startDate = formData.startDate;
      if (formData.endDate !== undefined) payload.endDate = formData.endDate;
      if (formData.categoryId !== event?.categoryId) payload.categoryId = formData.categoryId;
      if (formData.venueId !== event?.venueId) payload.venueId = formData.venueId;
      if (formData.customVenueName !== event?.customLocation) payload.customVenueName = formData.customVenueName;
      if (formData.address !== event?.address) payload.address = formData.address;
      if (formData.city !== event?.city) payload.city = formData.city;
      if (formData.country !== event?.country) payload.country = formData.country;
      if (formData.latitude !== event?.latitude) payload.latitude = formData.latitude;
      if (formData.longitude !== event?.longitude) payload.longitude = formData.longitude;
      if (formData.onlineEvent !== event?.onlineEvent) payload.onlineEvent = formData.onlineEvent;
      if (formData.eventUrl !== event?.eventUrl) payload.eventUrl = formData.eventUrl;
      if (formData.organizerName !== event?.organizerName) payload.organizerName = formData.organizerName;
      if (formData.organizerContact !== event?.organizerContact) payload.organizerContact = formData.organizerContact;
      if (formData.tags !== undefined && JSON.stringify(formData.tags) !== JSON.stringify(event?.tags)) payload.tags = formData.tags;
      if (formData.maxAttendees !== event?.maxAttendees) payload.maxAttendees = formData.maxAttendees;
      if (formData.registrationDeadline !== undefined) payload.registrationDeadline = formData.registrationDeadline;

      if (formData.externalLink !== event?.externalLink) payload.externalLink = formData.externalLink;
      if (formData.externalLinkText !== event?.externalLinkText) payload.externalLinkText = formData.externalLinkText;

      if (description !== event?.description) payload.description = description;
      if (JSON.stringify(tickets) !== JSON.stringify(event?.tickets)) payload.tickets = tickets;
      if (JSON.stringify(recurrence) !== JSON.stringify(event?.recurrence)) payload.recurrence = recurrence;

      // Handle banners: if either changed, include both in payload to prevent losing one
      const desktopChanged = desktopBannerUrl !== event?.bannerUrl;
      const mobileChanged = mobileBannerUrl !== event?.mobileBannerUrl;
      if (desktopChanged || mobileChanged) {
        payload.bannerUrl = desktopBannerUrl ?? "";
        payload.mobileBannerUrl = mobileBannerUrl ?? "";
      }

      if (isExternalEvent && sourceUrl !== event?.sourceUrl) payload.sourceUrl = sourceUrl;
      if (formData.ageRestriction !== event?.ageRestriction) payload.ageRestriction = formData.ageRestriction;
      if (formData.dressCode !== event?.dressCode) payload.dressCode = formData.dressCode;
      if (formData.language !== event?.language) payload.language = formData.language;
      if (formData.accessibilityNotes !== event?.accessibilityNotes) payload.accessibilityNotes = formData.accessibilityNotes;
      if (formData.parkingInfo !== event?.parkingInfo) payload.parkingInfo = formData.parkingInfo;
      if (formData.publicTransportInfo !== event?.publicTransportInfo) payload.publicTransportInfo = formData.publicTransportInfo;
      if (formData.isAutoReminderEnabled !== event?.isAutoReminderEnabled) payload.isAutoReminderEnabled = formData.isAutoReminderEnabled;

      if (Object.keys(payload).length === 0) {
        toast.info("No changes to save");
        setSubmitting(false);
        return;
      }

      const { apiFetch } = await import('@/lib/api-client');
      const response = await apiFetch(`/api/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to update event`);
      }

      const result = await response.json();
      toast.success("Event updated successfully!");
      await router.push(`/events/${id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update event";
      toast.error(errorMessage);
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthorized || !event) {
    return null;
  }

  const isBasicComplete = !!(watch("title") && watch("startDate") && watch("endDate"));
  const isDetailsComplete = !!(description && (watch("venueId") || (watch("customVenueName" as any) && customAddressData.address)));

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-black">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-black/95 p-4 pb-3 backdrop-blur-sm grain-texture header-glass">
        <Link href={`/events/${id}`}>
          <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white transition-colors hover:bg-black/80">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <h1 className="text-xl font-bold text-white">Edit Event</h1>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Main Content */}
      <main className="flex-1 pb-8">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <form onSubmit={handleSubmit(onSubmit, () => {
            toast.error("Form validation failed. Please check all required fields.");
          })}>
            <Tabs value={activeTab} onValueChange={(value) => {
              if (Object.keys(errors).length > 0) {
                // Allow switching if there are errors so user can find them, 
                // but maybe we want to block if dirty? 
                // User asked: "users have to click update on each section... or they cant navigate away"
                // So if dirty, block.
              }

              if (formState.isDirty) {
                toast.warning("You have unsaved changes. Please update or cancel before switching tabs.");
                return;
              }
              setActiveTab(value);
            }} className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-6 bg-black/50 border border-white/10 rounded-xl p-1">
                <TabsTrigger value="basic" className="data-[state=active]:bg-white/15 data-[state=active]:text-white flex items-center gap-2">
                  {isBasicComplete && <Check className="h-4 w-4 text-brand-green" />}
                  Basic Info
                  {activeTab === "basic" && formState.isDirty && <span className="ml-2 h-2 w-2 rounded-full bg-brand-orange animate-pulse" />}
                </TabsTrigger>
                <TabsTrigger value="details" className="data-[state=active]:bg-white/15 data-[state=active]:text-white flex items-center gap-2">
                  {isDetailsComplete && <Check className="h-4 w-4 text-brand-green" />}
                  Details
                  {activeTab === "details" && formState.isDirty && <span className="ml-2 h-2 w-2 rounded-full bg-brand-orange animate-pulse" />}
                </TabsTrigger>
                <TabsTrigger value="tickets" className="data-[state=active]:bg-white/15 data-[state=active]:text-white flex items-center gap-2">
                  Tickets
                  {activeTab === "tickets" && formState.isDirty && <span className="ml-2 h-2 w-2 rounded-full bg-brand-orange animate-pulse" />}
                </TabsTrigger>
                <TabsTrigger value="recurrence" className="data-[state=active]:bg-white/15 data-[state=active]:text-white flex items-center gap-2">
                  Recurrence
                  {activeTab === "recurrence" && formState.isDirty && <span className="ml-2 h-2 w-2 rounded-full bg-brand-orange animate-pulse" />}
                </TabsTrigger>
                <TabsTrigger value="notifications" className="data-[state=active]:bg-white/15 data-[state=active]:text-white flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notifications
                </TabsTrigger>
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
                      options={categories.map((cat) => ({ value: cat.id, label: cat.name }))}
                      value={watch("categoryId") || ""}
                      onValueChange={(value) => setValue("categoryId", value, { shouldDirty: true })}
                      placeholder="Select category"
                      searchPlaceholder="Search categories..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate" className="text-white">Start Date *</Label>
                      <Input
                        id="startDate"
                        type="datetime-local"
                        {...register("startDate")}
                        placeholder="Select start date"
                        className="mt-2 bg-black/40 border-white/10 text-white"
                      />
                      {errors.startDate && (
                        <p className="text-sm text-red-400 mt-1">{errors.startDate.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="endDate" className="text-white">End Date *</Label>
                      <Input
                        id="endDate"
                        type="datetime-local"
                        {...register("endDate")}
                        placeholder="Select end date"
                        className="mt-2 bg-black/40 border-white/10 text-white"
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
                    <RichTextEditor
                      value={description}
                      onChange={setDescription}
                    />
                  </div>
                  <BannerUpload
                    desktopBannerUrl={desktopBannerUrl}
                    mobileBannerUrl={mobileBannerUrl}
                    onDesktopBannerChange={handleDesktopBannerChange}
                    onMobileBannerChange={handleMobileBannerChange}
                    oldDesktopBannerUrl={event?.bannerUrl}
                    oldMobileBannerUrl={event?.mobileBannerUrl}
                  />
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white">Venue Type</Label>
                      <div className="flex gap-4 mt-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="venueExisting"
                            name="venueType"
                            value="existing"
                            checked={venueType === "existing"}
                            onChange={(e) => {
                              setVenueType("existing");
                              setValue("venueId" as any, watch("venueId") || "");
                              setValue("customVenueName" as any, "");
                              setValue("customVenueStreet" as any, "");
                              setValue("customVenueNumber" as any, "");
                              setValue("customVenueZip" as any, "");
                              setValue("customVenueCity" as any, "");
                            }}
                            className="h-4 w-4"
                          />
                          <Label htmlFor="venueExisting" className="font-normal cursor-pointer text-white">
                            Select existing venue
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="venueCustom"
                            name="venueType"
                            value="custom"
                            checked={venueType === "custom"}
                            onChange={(e) => {
                              setVenueType("custom");
                              setValue("venueId" as any, "");
                            }}
                            className="h-4 w-4"
                          />
                          <Label htmlFor="venueCustom" className="font-normal cursor-pointer text-white">
                            Enter custom venue
                          </Label>
                        </div>
                      </div>
                    </div>
                    {venueType === "existing" ? (
                      <div>
                        <Label htmlFor="venueId" className="text-white">Venue *</Label>
                        <Select
                          onValueChange={(value) => setValue("venueId" as any, value)}
                          value={watch("venueId") || ""}
                        >
                          <SelectTrigger className="mt-2 bg-black/40 border-white/10 text-white">
                            <SelectValue placeholder="Select venue" />
                          </SelectTrigger>
                          <SelectContent>
                            {venues.map((venue) => (
                              <SelectItem key={venue.id} value={venue.id}>
                                {venue.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.venueId && (
                          <p className="text-sm text-red-400 mt-1">{errors.venueId.message}</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="customVenueName" className="text-white">Venue Name *</Label>
                          <Input
                            id="customVenueName"
                            {...register("customVenueName" as any)}
                            placeholder="Enter venue name"
                            className="mt-2 bg-black/40 border-white/10 text-white placeholder:text-white/50"
                          />
                          {(errors as any).customVenueName && (
                            <p className="text-sm text-red-400 mt-1">
                              {(errors as any).customVenueName.message}
                            </p>
                          )}
                        </div>
                        <AddressAutocomplete
                          value={customAddressData}
                          onChange={(data) => {
                            setCustomAddressData(data);
                            setValue("address", data.address);
                            setValue("city", data.city);
                            setValue("country", data.country);
                            setValue("latitude", data.latitude);
                            setValue("longitude", data.longitude);
                          }}
                          error={
                            (errors as any).customVenueName?.message ||
                            (customAddressData.address ? undefined : "")
                          }
                          placeholder="Search for the venue address..."
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="onlineEvent"
                      checked={watch("onlineEvent")}
                      onCheckedChange={(checked) =>
                        setValue("onlineEvent", checked as boolean)
                      }
                    />
                    <Label htmlFor="onlineEvent" className="text-white">Online Event</Label>
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
                    <Label htmlFor="isExternalEvent" className="text-white">Not your own event?</Label>
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

                  <div className="space-y-4 border-t border-white/10 pt-4">
                    <h3 className="font-semibold text-white">External Link</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="externalLink" className="text-white">Link URL</Label>
                        <Input
                          id="externalLink"
                          {...register("externalLink")}
                          placeholder="https://example.com/tickets"
                          className="mt-2 bg-black/40 border-white/10 text-white"
                        />
                        {errors.externalLink && (
                          <p className="text-sm text-red-400 mt-1">{errors.externalLink.message as string}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="externalLinkText" className="text-white">Button Text</Label>
                        <Input
                          id="externalLinkText"
                          {...register("externalLinkText")}
                          placeholder="e.g. Buy Tickets, Register"
                          className="mt-2 bg-black/40 border-white/10 text-white"
                        />
                        {errors.externalLinkText && (
                          <p className="text-sm text-red-400 mt-1">{errors.externalLinkText.message as string}</p>
                        )}
                      </div>
                    </div>
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
                  <TicketManager tickets={tickets} onChange={setTickets} />
                </div>
              </TabsContent>

              {/* Recurrence Tab */}
              <TabsContent value="recurrence">
                <div className="rounded-xl border border-white/10 bg-white/15 backdrop-blur-sm grain-texture card-glass p-6">
                  <RecurrenceEditor
                    recurrence={recurrence}
                    onChange={setRecurrence}
                  />
                </div>
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications">
                <div className="rounded-xl border border-white/10 bg-white/15 backdrop-blur-sm grain-texture card-glass p-6 space-y-8">

                  {/* Invitation Section */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <Send className="h-5 w-5 text-brand-orange" />
                          Send Invitation
                        </h3>
                        <p className="text-white/60 text-sm mt-1">
                          Notify your followers about this event. This sends a push notification to all users following your organization.
                        </p>
                      </div>
                      {event?.invitationSentAt && (
                        <span className="text-xs font-mono bg-white/10 text-white/60 px-2 py-1 rounded">
                          Sent: {new Date(event.invitationSentAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <Button
                      type="button"
                      disabled={!!event?.invitationSentAt || submitting}
                      onClick={async () => {
                        if (!confirm("Are you sure you want to send invitations to all followers?")) return;
                        try {
                          setSubmitting(true);
                          const { apiFetch } = await import('@/lib/api-client');
                          const res = await apiFetch(`/api/events/${id}/notify`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ type: "invitation" })
                          });
                          if (!res.ok) throw new Error((await res.json()).error);
                          toast.success("Invitations sent successfully!");
                          // Update local state instead of reloading
                          setEvent((prev: any) => ({ ...prev, invitationSentAt: new Date().toISOString() }));
                        } catch (e: any) {
                          toast.error(e.message);
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                      className="bg-brand-orange hover:bg-brand-oredge text-white"
                    >
                      {event?.invitationSentAt ? "Invitation Sent" : "Send Invitations Now"}
                    </Button>
                  </div>

                  <div className="h-px bg-white/10" />

                  {/* Reminder Section */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <Bell className="h-5 w-5 text-brand-orange" />
                          Event Reminder
                        </h3>
                        <p className="text-white/60 text-sm mt-1">
                          Remind users who liked your event. Can be sent manually or scheduled automatically.
                        </p>
                      </div>
                      {event?.reminderSentAt && (
                        <span className="text-xs font-mono bg-white/10 text-white/60 px-2 py-1 rounded">
                          Sent: {new Date(event.reminderSentAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Auto-Reminder Toggle */}
                    <div className="flex items-center space-x-2 bg-black/20 p-4 rounded-lg border border-white/5">
                      <Checkbox
                        id="isAutoReminderEnabled"
                        checked={watch("isAutoReminderEnabled")}
                        onCheckedChange={(checked) => setValue("isAutoReminderEnabled", checked as boolean, { shouldDirty: true })}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor="isAutoReminderEnabled"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white"
                        >
                          Enable Auto-Reminder (10 hours before start)
                        </Label>
                        <p className="text-sm text-white/50">
                          System will automatically send reminders if you haven&apos;t sent one manually.
                        </p>
                      </div>
                    </div>

                    {/* Manual Reminder Button */}
                    <Button
                      type="button"
                      disabled={!!event?.reminderSentAt || submitting}
                      onClick={async () => {
                        if (!confirm("Send reminder to all interested users now?")) return;
                        try {
                          setSubmitting(true);
                          const { apiFetch } = await import('@/lib/api-client');
                          const res = await apiFetch(`/api/events/${id}/notify`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ type: "reminder" })
                          });
                          if (!res.ok) throw new Error((await res.json()).error);
                          toast.success("Reminders sent successfully!");
                          // Update local state instead of reloading
                          setEvent((prev: any) => ({ ...prev, reminderSentAt: new Date().toISOString() }));
                        } catch (e: any) {
                          toast.error(e.message);
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                      variant="secondary"
                      className="bg-white/10 hover:bg-white/20 text-white border-0"
                    >
                      {event?.reminderSentAt ? "Reminder Sent" : "Send Reminder Now"}
                    </Button>
                  </div>

                </div>
              </TabsContent>
            </Tabs>

            {/* Footer Actions */}
            <div className="flex justify-end gap-4 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/events/${id}`)}
                disabled={submitting}
                className="bg-black/40 border-white/10 text-white hover:bg-black/60 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-brand-orange hover:bg-brand-oredge text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Updating..." : "Update Event"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

