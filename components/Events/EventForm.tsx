import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RichTextEditor } from "./RichTextEditor";
import { TicketManager } from "./TicketManager";
import { RecurrenceEditor } from "./RecurrenceEditor";
import { useConfig } from "@/hooks/useConfig";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Checkbox } from "@/components/ui/checkbox";
import { BannerUpload } from "./BannerUpload";
import { AddressAutocomplete, type AddressAutocompleteValue } from "./AddressAutocomplete";
import { apiFetch } from '@/lib/api-client';
import { ZodSchema } from "zod";
import { toast } from "sonner";
import { Check } from "lucide-react";

interface EventFormProps {
    defaultValues?: any;
    schema: ZodSchema;
    onSubmit: (data: any) => Promise<void>;
    isSubmitting: boolean;
    onCancel: () => void;
    submitLabel: string;
    showCancelButton?: boolean;
}

export function EventForm({
    defaultValues,
    schema,
    onSubmit,
    isSubmitting,
    onCancel,
    submitLabel,
    showCancelButton = true,
}: EventFormProps) {
    const { categories } = useConfig();
    const [venues, setVenues] = useState<Array<{ id: string; name: string }>>([]);
    const [activeTab, setActiveTab] = useState("basic");
    const [description, setDescription] = useState(defaultValues?.description || "");
    const [tickets, setTickets] = useState<any[]>(defaultValues?.tickets || []);
    const [recurrence, setRecurrence] = useState<any>(defaultValues?.recurrence || null);
    const [desktopBannerUrl, setDesktopBannerUrl] = useState<string | null>(defaultValues?.bannerUrl || null);
    const [mobileBannerUrl, setMobileBannerUrl] = useState<string | null>(defaultValues?.mobileBannerUrl || null);
    const [isExternalEvent, setIsExternalEvent] = useState(!!defaultValues?.sourceUrl);
    const [sourceUrl, setSourceUrl] = useState<string>(defaultValues?.sourceUrl || "");
    const [venueType, setVenueType] = useState<"existing" | "custom">(defaultValues?.venueId ? "existing" : "custom");
    const [customAddressData, setCustomAddressData] = useState<Partial<AddressAutocompleteValue>>({
        address: defaultValues?.address,
        city: defaultValues?.city,
        country: defaultValues?.country,
        latitude: defaultValues?.latitude,
        longitude: defaultValues?.longitude,
    });

    const {
        register,
        handleSubmit,
        formState,
        formState: { errors },
        setValue,
        watch,
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues,
    });

    useEffect(() => {
        const fetchVenues = async () => {
            try {
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

    const handleFormSubmit = (data: any) => {
        onSubmit({
            ...data,
            description,
            tickets,
            recurrence,
            bannerUrl: desktopBannerUrl || undefined,
            mobileBannerUrl: mobileBannerUrl || undefined,
            sourceUrl: isExternalEvent && sourceUrl ? sourceUrl : undefined,
        });
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)}>
            <Tabs value={activeTab} onValueChange={(value) => {
                if (formState.isDirty) {
                    toast.warning("You have unsaved changes. Please update or cancel before switching tabs.");
                    return;
                }
                setActiveTab(value);
            }}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic" className="flex items-center gap-2">
                        Basic Info
                        {activeTab === "basic" && formState.isDirty && <span className="ml-2 h-2 w-2 rounded-full bg-brand-orange animate-pulse" />}
                    </TabsTrigger>
                    <TabsTrigger value="details" className="flex items-center gap-2">
                        Details
                        {activeTab === "details" && formState.isDirty && <span className="ml-2 h-2 w-2 rounded-full bg-brand-orange animate-pulse" />}
                    </TabsTrigger>
                    <TabsTrigger value="tickets" className="flex items-center gap-2">
                        Tickets
                        {activeTab === "tickets" && formState.isDirty && <span className="ml-2 h-2 w-2 rounded-full bg-brand-orange animate-pulse" />}
                    </TabsTrigger>
                    <TabsTrigger value="recurrence" className="flex items-center gap-2">
                        Recurrence
                        {activeTab === "recurrence" && formState.isDirty && <span className="ml-2 h-2 w-2 rounded-full bg-brand-orange animate-pulse" />}
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="basic" className="space-y-4">
                    <div>
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            {...register("title")}
                            placeholder="Event title"
                        />
                        {errors.title && (
                            <p className="text-sm text-destructive">{errors.title.message as string}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="category">Category</Label>
                        <Combobox
                            options={categories.map((cat) => ({ value: cat.id, label: cat.name }))}
                            value={watch("categoryId")}
                            onValueChange={(value) => setValue("categoryId", value, { shouldDirty: true })}
                            placeholder="Select category"
                            searchPlaceholder="Search categories..."
                        />
                    </div>
                    <div>
                        <Label htmlFor="startDate">Start Date *</Label>
                        <Input
                            id="startDate"
                            type="datetime-local"
                            {...register("startDate", { valueAsDate: true })}
                        />
                    </div>
                    <div>
                        <Label htmlFor="endDate">End Date *</Label>
                        <Input
                            id="endDate"
                            type="datetime-local"
                            {...register("endDate", { valueAsDate: true })}
                        />
                    </div>
                </TabsContent>
                <TabsContent value="details" className="space-y-4">
                    <div>
                        <Label>Description *</Label>
                        <RichTextEditor
                            value={description}
                            onChange={setDescription}
                        />
                    </div>
                    <BannerUpload
                        desktopBannerUrl={desktopBannerUrl}
                        mobileBannerUrl={mobileBannerUrl}
                        onDesktopBannerChange={setDesktopBannerUrl}
                        onMobileBannerChange={setMobileBannerUrl}
                        oldDesktopBannerUrl={defaultValues?.bannerUrl}
                        oldMobileBannerUrl={defaultValues?.mobileBannerUrl}
                    />
                    <div className="space-y-4">
                        <div>
                            <Label>Venue Type</Label>
                            <div className="flex gap-4 mt-2">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        id="venueExisting"
                                        name="venueType"
                                        value="existing"
                                        checked={venueType === "existing"}
                                        onChange={() => {
                                            setVenueType("existing");
                                            setValue("venueId", "");
                                            setValue("customVenueName", "");
                                            setValue("customVenueStreet", "");
                                            setValue("customVenueNumber", "");
                                            setValue("customVenueZip", "");
                                            setValue("customVenueCity", "");
                                        }}
                                        className="h-4 w-4"
                                    />
                                    <Label htmlFor="venueExisting" className="font-normal cursor-pointer">
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
                                        onChange={() => {
                                            setVenueType("custom");
                                            setValue("venueId", "");
                                        }}
                                        className="h-4 w-4"
                                    />
                                    <Label htmlFor="venueCustom" className="font-normal cursor-pointer">
                                        Enter custom venue
                                    </Label>
                                </div>
                            </div>
                        </div>
                        {venueType === "existing" ? (
                            <div>
                                <Label htmlFor="venueId">Venue *</Label>
                                <Select
                                    onValueChange={(value) => setValue("venueId", value)}
                                    defaultValue={defaultValues?.venueId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select venue" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[...venues].sort((a, b) => a.name.localeCompare(b.name)).map((venue) => (
                                            <SelectItem key={venue.id} value={venue.id}>
                                                {venue.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.venueId && (
                                    <p className="text-sm text-destructive mt-1">{errors.venueId.message as string}</p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="customVenueName">Venue Name *</Label>
                                    <Input
                                        id="customVenueName"
                                        {...register("customVenueName")}
                                        placeholder="Enter venue name"
                                    />
                                    {errors.customVenueName && (
                                        <p className="text-sm text-destructive mt-1">
                                            {errors.customVenueName.message as string}
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
                                        (errors.customVenueName?.message as string) ||
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
                        <Label htmlFor="onlineEvent">Online Event</Label>
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
                        <Label htmlFor="isExternalEvent">Not your own event?</Label>
                    </div>
                    {isExternalEvent && (
                        <div>
                            <Label htmlFor="sourceUrl">Source URL *</Label>
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
                            />
                        </div>
                    )}

                    <div className="space-y-4 border-t pt-4">
                        <h3 className="font-semibold">External Link</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="externalLink">Link URL</Label>
                                <Input
                                    id="externalLink"
                                    {...register("externalLink")}
                                    placeholder="https://example.com/tickets"
                                />
                                {errors.externalLink && (
                                    <p className="text-sm text-destructive">{errors.externalLink.message as string}</p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="externalLinkText">Button Text</Label>
                                <Input
                                    id="externalLinkText"
                                    {...register("externalLinkText")}
                                    placeholder="e.g. Buy Tickets, Register"
                                />
                                {errors.externalLinkText && (
                                    <p className="text-sm text-destructive">{errors.externalLinkText.message as string}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 border-t border-white/10 pt-4">
                        <h3 className="text-sm font-semibold text-white">Additional Information</h3>
                        <div>
                            <Label htmlFor="ageRestriction">Age Restriction</Label>
                            <Input
                                id="ageRestriction"
                                {...register("ageRestriction")}
                                placeholder="e.g., 18+"
                            />
                        </div>
                        <div>
                            <Label htmlFor="dressCode">Dress Code</Label>
                            <Input
                                id="dressCode"
                                {...register("dressCode")}
                                placeholder="e.g., Formal, Casual, etc."
                            />
                        </div>
                        <div>
                            <Label htmlFor="language">Language</Label>
                            <Input
                                id="language"
                                {...register("language")}
                                placeholder="e.g., English, German, etc."
                            />
                        </div>
                        <div>
                            <Label htmlFor="accessibilityNotes">Accessibility Notes</Label>
                            <Input
                                id="accessibilityNotes"
                                {...register("accessibilityNotes")}
                                placeholder="e.g., Wheelchair accessible, Sign language interpretation, etc."
                            />
                        </div>
                        <div>
                            <Label htmlFor="parkingInfo">Parking Information</Label>
                            <Input
                                id="parkingInfo"
                                {...register("parkingInfo")}
                                placeholder="e.g., Free parking available, Street parking, etc."
                            />
                        </div>
                        <div>
                            <Label htmlFor="publicTransportInfo">Public Transport Information</Label>
                            <Input
                                id="publicTransportInfo"
                                {...register("publicTransportInfo")}
                                placeholder="e.g., U-Bahn Line 6, Bus 24, etc."
                            />
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="tickets">
                    <TicketManager tickets={tickets} onChange={setTickets} />
                </TabsContent>
                <TabsContent value="recurrence">
                    <RecurrenceEditor
                        recurrence={recurrence}
                        onChange={setRecurrence}
                    />
                </TabsContent>
            </Tabs>
            <div className="flex justify-end gap-2 mt-6">
                {showCancelButton && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                )}
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : submitLabel}
                </Button>
            </div>
        </form>
    );
}
