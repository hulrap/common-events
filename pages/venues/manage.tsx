import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from '@/lib/api-client';
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface Venue {
  id: string;
  name: string;
  description?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  bannerUrl?: string | null;
  openingHours?: Record<string, unknown> | null;
  ownerId?: string | null;
}

interface VenueEvent {
  event: {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    isPublished: boolean;
  };
  visibility?: {
    id: string;
    isVisible: boolean;
  } | null;
}

export default function VenueManagementPage() {
  const router = useRouter();
  const { user, isVenueOwner, loading: authLoading } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [venueEvents, setVenueEvents] = useState<VenueEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    website: "",
    address: "",
    city: "",
    country: "",
    latitude: "",
    longitude: "",
    bannerUrl: "",
  });

  const loadVenueData = useCallback(async (venue: Venue) => {
    setSelectedVenue(venue);
    setFormData({
      name: venue.name || "",
      description: venue.description || "",
      website: venue.website || "",
      address: venue.address || "",
      city: venue.city || "",
      country: venue.country || "",
      latitude: venue.latitude?.toString() || "",
      longitude: venue.longitude?.toString() || "",
      bannerUrl: venue.bannerUrl || "",
    });

    try {
      const response = await apiFetch(`/api/venues/${venue.id}/events`);
      if (response.ok) {
        const data = await response.json();
        setVenueEvents(data);
      }
    } catch (error) {
      console.error("Failed to fetch venue events:", error);
    }
  }, []);

  const fetchVenues = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/venues?ownerId=${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setVenues(data);
        if (data.length > 0 && !selectedVenue) {
          setSelectedVenue(data[0]);
          loadVenueData(data[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch venues:", error);
      toast.error("Failed to load venues");
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedVenue, loadVenueData]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || !isVenueOwner) {
        router.push("/");
        return;
      }
      fetchVenues();
    }
  }, [user, isVenueOwner, authLoading, router, fetchVenues]);

  const handleSave = async () => {
    if (!selectedVenue) return;

    setSaving(true);
    try {
      const response = await apiFetch(`/api/venues/${selectedVenue.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          website: formData.website || null,
          address: formData.address || null,
          city: formData.city || null,
          country: formData.country || null,
          latitude: formData.latitude ? Number.parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? Number.parseFloat(formData.longitude) : null,
          bannerUrl: formData.bannerUrl || null,
        }),
      });

      if (response.ok) {
        toast.success("Venue updated successfully!");
        fetchVenues();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update venue");
      }
    } catch (error) {
      console.error("Failed to update venue:", error);
      toast.error("Failed to update venue");
    } finally {
      setSaving(false);
    }
  };

  const handleEventVisibility = async (eventId: string, isVisible: boolean) => {
    if (!selectedVenue) return;

    try {
      const response = await apiFetch(`/api/venues/${selectedVenue.id}/events`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          isVisible,
        }),
      });

      if (response.ok) {
        toast.success("Event visibility updated");
        loadVenueData(selectedVenue);
      } else {
        toast.error("Failed to update event visibility");
      }
    } catch (error) {
      console.error("Failed to update event visibility:", error);
      toast.error("Failed to update event visibility");
    }
  };



  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user || !isVenueOwner) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Venue Management</h1>
        <p className="text-muted-foreground">Manage your venues and event visibility</p>
      </div>

      {venues.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No venues assigned to your account.</p>
            <p className="text-sm text-muted-foreground mt-2">Contact an administrator to claim a venue.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Your Venues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {venues.map((venue) => (
                    <button
                      key={venue.id}
                      onClick={() => loadVenueData(venue)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedVenue?.id === venue.id
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                    >
                      <div className="font-semibold">{venue.name}</div>
                      {venue.city && (
                        <div className="text-sm text-muted-foreground">{venue.city}</div>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {selectedVenue && (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedVenue.name}</CardTitle>
                  <CardDescription>Edit venue information and manage events</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                      <TabsTrigger value="info">Venue Info</TabsTrigger>
                      <TabsTrigger value="events">Events</TabsTrigger>
                    </TabsList>

                    <TabsContent value="info" className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full min-h-[100px] px-3 py-2 border rounded-md"
                        />
                      </div>
                      <div>
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          type="url"
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          placeholder="https://example.com"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="country">Country</Label>
                          <Input
                            id="country"
                            value={formData.country}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="latitude">Latitude</Label>
                          <Input
                            id="latitude"
                            type="number"
                            step="any"
                            value={formData.latitude}
                            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="longitude">Longitude</Label>
                          <Input
                            id="longitude"
                            type="number"
                            step="any"
                            value={formData.longitude}
                            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="bannerUrl">Banner URL</Label>
                        <Input
                          id="bannerUrl"
                          type="url"
                          value={formData.bannerUrl}
                          onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                          placeholder="https://example.com/banner.jpg"
                        />
                      </div>
                      <Button onClick={handleSave} disabled={saving} className="w-full">
                        {saving ? "Saving..." : "Save Changes"}
                      </Button>
                    </TabsContent>

                    <TabsContent value="events" className="mt-4">
                      <div className="space-y-3">
                        {venueEvents.length === 0 ? (
                          <p className="text-muted-foreground text-center py-8">No events at this venue</p>
                        ) : (
                          venueEvents.map((item) => (
                            <div
                              key={item.event.id}
                              className="flex items-center justify-between p-4 border rounded-lg"
                            >
                              <div className="flex-1">
                                <div className="font-semibold">{item.event.title}</div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(item.event.startDate).toLocaleDateString()}
                                </div>
                                {!item.event.isPublished && (
                                  <span className="text-xs text-orange-500">Unpublished</span>
                                )}
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={item.visibility?.isVisible !== false}
                                    onCheckedChange={(checked) =>
                                      handleEventVisibility(item.event.id, checked as boolean)
                                    }
                                  />
                                  <Label className="text-sm">Visible</Label>
                                </div>
                                <Link href={`/events/${item.event.id}`}>
                                  <Button variant="ghost" size="sm">
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

