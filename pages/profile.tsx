import { useState, useEffect } from "react";
import { GetServerSideProps } from "next";

import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from '@/lib/api-client';
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Mail, Bell, Key, User, Building2 } from "lucide-react";
import { toast } from "sonner";
import type { FilterState } from "@/components/Calendar/EventFilters";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

interface Event {
  id: string;
  title: string;
  shortDescription?: string | null;
  bannerUrl?: string | null;
  mobileBannerUrl?: string | null;
  startDate: Date | string;
  endDate: Date | string;
  city: string;
  country: string;
  venueId?: string | null;
  customLocation?: string | null;
  categoryId?: string | null;
  tags?: string[] | null;
  organizerId: string;
  sourceUrl?: string | null;
  isEditorsChoice?: boolean;
  tickets?: Array<{
    price?: string | null;
    currency: string;
  }>;
}

interface FilterPreference {
  id: string;
  name: string;
  filterConfig: FilterState;
  isDefault: boolean;
  createdAt: string;
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [filterPreferences, setFilterPreferences] = useState<FilterPreference[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [settings, setSettings] = useState({
    email: "",
    fullName: "",
    organizationName: "",
    emailNotifications: true,
    eventReminder24h: false,
    mobilePushNotifications24hReminder: false,
    isOrganizer: false,
    slug: "",
    contactEmail: "",
    contactPhone: "",
    websiteUrl: "",
    socialLinks: { facebook: "", instagram: "", twitter: "", linkedin: "" },
    profileImage: "",
    description: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [newEmail, setNewEmail] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin");
    }
  }, [user, loading, router]);

  // Fetch all profile data in parallel on mount
  useEffect(() => {
    if (!user) return;

    // Fetch all endpoints in parallel for maximum performance
    const fetchAllData = async () => {
      setLoadingFilters(true);

      try {
        const [filtersRes, settingsRes] = await Promise.all([
          apiFetch("/api/user/filter-preferences"),
          apiFetch("/api/user/settings"),
        ]);

        if (filtersRes.ok) {
          const filtersData = await filtersRes.json();
          setFilterPreferences(filtersData);
        }

        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setSettings(settingsData);
        }
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
      } finally {
        setLoadingFilters(false);
      }
    };

    fetchAllData();
  }, [user]);



  const handleSetDefaultFilter = async (filterId: string) => {
    try {
      const response = await apiFetch(`/api/user/filter-preferences/${filterId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });

      if (response.ok) {
        toast.success("Default filter updated");
        // Refetch only filter preferences when needed
        const refetchFilters = async () => {
          try {
            const response = await apiFetch("/api/user/filter-preferences");
            if (response.ok) {
              const data = await response.json();
              setFilterPreferences(data);
            }
          } catch (error) {
            console.error("Failed to fetch filter preferences:", error);
          }
        };
        refetchFilters();
      } else {
        const errorData = await response.json().catch(() => ({ error: "Failed to update default filter" }));
        toast.error(errorData.error || "Failed to update default filter");
      }
    } catch (error) {
      console.error("Error setting default filter:", error);
      toast.error("Failed to update default filter");
    }
  };

  const handleUpdateSettings = async () => {
    try {
      const { apiFetch } = await import('@/lib/api-client');
      const response = await apiFetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailNotifications: settings.emailNotifications,
          eventReminder24h: settings.eventReminder24h,
          mobilePushNotifications24hReminder: settings.mobilePushNotifications24hReminder,
          fullName: settings.fullName,
          organizationName: settings.organizationName,
          slug: settings.slug,
          contactEmail: settings.contactEmail,
          contactPhone: settings.contactPhone,
          websiteUrl: settings.websiteUrl,
          socialLinks: settings.socialLinks,
          profileImage: settings.profileImage,
          description: settings.description,
        }),
      });

      if (response.ok) {
        toast.success("Settings updated");
      } else {
        const errorData = await response.json().catch(() => ({ error: "Failed to update settings" }));
        toast.error(errorData.error || "Failed to update settings");
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings");
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsChangingPassword(true);
    try {
      const { apiFetch } = await import('@/lib/api-client');
      const response = await apiFetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "changePassword",
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        toast.success("Password changed successfully");
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const errorData = await response.json().catch(() => ({ error: "Failed to change password" }));
        toast.error(errorData.error || "Failed to change password");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail?.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsChangingEmail(true);
    try {
      const { apiFetch } = await import('@/lib/api-client');
      const response = await apiFetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "changeEmail",
          newEmail,
        }),
      });

      if (response.ok) {
        toast.success("Email update initiated. Please check your new email.");
        setNewEmail("");
      } else {
        const errorData = await response.json().catch(() => ({ error: "Failed to change email" }));
        toast.error(errorData.error || "Failed to change email");
      }
    } catch (error) {
      console.error("Error changing email:", error);
      toast.error("Failed to change email");
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }

    if (!confirm("This will permanently delete all your data. Type 'DELETE' to confirm:")) {
      return;
    }

    setIsDeletingAccount(true);
    try {
      const { apiFetch } = await import('@/lib/api-client');
      const response = await apiFetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deleteAccount",
        }),
      });

      if (response.ok) {
        toast.success("Account deleted successfully");
        router.push("/");
      } else {
        const errorData = await response.json().catch(() => ({ error: "Failed to delete account" }));
        toast.error(errorData.error || "Failed to delete account");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
    } finally {
      setIsDeletingAccount(false);
    }
  };



  if (loading || !user) {
    return (
      <div className="flex items-center justify-center py-12 min-h-[50vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Profile</h1>

      <Tabs defaultValue="filters" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="filters">Filters</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Filters Tab */}
        <TabsContent value="filters" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Default Filter</CardTitle>
              <CardDescription>
                Select a filter to automatically apply when you visit the main page. You can toggle it off on the main page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingFilters && (
                <div className="text-center py-8 text-muted-foreground">Loading filters...</div>
              )}
              {!loadingFilters && filterPreferences.length === 0 && (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <p>No saved filters yet</p>
                  <p className="text-sm mt-2">Create and save filters on the main page to set one as default.</p>
                </div>
              )}
              {!loadingFilters && filterPreferences.length > 0 && (
                <div className="space-y-3">
                  {filterPreferences.map((pref) => (
                    <div
                      key={pref.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${pref.isDefault
                        ? "bg-primary/10 border-primary"
                        : "bg-slate-800/50 border-slate-700"
                        }`}
                    >
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {pref.name}
                          {pref.isDefault && (
                            <span className="ml-2 text-xs text-primary">(Default)</span>
                          )}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          Created {new Date(pref.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      {!pref.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefaultFilter(pref.id)}
                        >
                          Set as Default
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6 space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={settings.email} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  autoComplete="name"
                  value={settings.fullName || ""}
                  onChange={(e) => setSettings({ ...settings, fullName: e.target.value })}
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organizationName">Organization Name</Label>
                <Input
                  id="organizationName"
                  value={settings.organizationName || ""}
                  onChange={(e) => setSettings({ ...settings, organizationName: e.target.value })}
                  placeholder="Your organization name"
                />
              </div>
              <Button onClick={handleUpdateSettings}>Save Changes</Button>
            </CardContent>
          </Card>

          {/* Organizer Profile Settings */}
          {settings.isOrganizer && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Organizer Profile
                </CardTitle>
                <CardDescription>
                  Manage your public organizer profile information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Profile Image</Label>
                  <div className="flex items-center gap-4">
                    {settings.profileImage && (
                      <div className="relative h-20 w-20 rounded-full overflow-hidden border border-white/10">
                        <img src={settings.profileImage} alt="Profile" className="h-full w-full object-cover" />
                      </div>
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        try {
                          const { uploadGalleryImage } = await import("@/lib/storage/upload");
                          // We can reuse the gallery upload or create a specific profile upload
                          // For now, let's use a generic path or the gallery one but maybe with a specific prefix if possible
                          // The uploadGalleryImage takes eventId, but we can pass 'profile' or user ID if modified
                          // Or we can just use a separate upload function. 
                          // Let's assume we can use a helper or just upload directly here.
                          // Actually, uploadGalleryImage puts it in 'event-gallery'. We might want 'avatars'.
                          // But for speed, let's use the existing one and just pass user.id as eventId (it's a UUID so it works for folder structure)

                          const publicUrl = await uploadGalleryImage(file, user.id);
                          setSettings({ ...settings, profileImage: publicUrl });
                          toast.success("Image uploaded");
                        } catch (error) {
                          console.error("Upload failed", error);
                          toast.error("Failed to upload image");
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={settings.description || ""}
                    onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                    placeholder="Tell us about your organization..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Profile Slug (URL)</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">/organizers/</span>
                    <Input
                      id="slug"
                      value={settings.slug || ""}
                      onChange={(e) => setSettings({ ...settings, slug: e.target.value })}
                      placeholder="my-organization"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Unique identifier for your organizer page.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={settings.contactEmail || ""}
                      onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                      placeholder="contact@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      value={settings.contactPhone || ""}
                      onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                      placeholder="+1234567890"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">Website URL</Label>
                  <Input
                    id="websiteUrl"
                    type="url"
                    value={settings.websiteUrl || ""}
                    onChange={(e) => setSettings({ ...settings, websiteUrl: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Social Links</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Facebook URL"
                      value={settings.socialLinks?.facebook || ""}
                      onChange={(e) => setSettings({
                        ...settings,
                        socialLinks: { ...settings.socialLinks, facebook: e.target.value }
                      })}
                    />
                    <Input
                      placeholder="Instagram URL"
                      value={settings.socialLinks?.instagram || ""}
                      onChange={(e) => setSettings({
                        ...settings,
                        socialLinks: { ...settings.socialLinks, instagram: e.target.value }
                      })}
                    />
                    <Input
                      placeholder="Twitter/X URL"
                      value={settings.socialLinks?.twitter || ""}
                      onChange={(e) => setSettings({
                        ...settings,
                        socialLinks: { ...settings.socialLinks, twitter: e.target.value }
                      })}
                    />
                    <Input
                      placeholder="LinkedIn URL"
                      value={settings.socialLinks?.linkedin || ""}
                      onChange={(e) => setSettings({
                        ...settings,
                        socialLinks: { ...settings.socialLinks, linkedin: e.target.value }
                      })}
                    />
                  </div>
                </div>

                <Button onClick={handleUpdateSettings}>Save Profile</Button>
              </CardContent>
            </Card>
          )}

          {/* Email & Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Email & Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Receive email notifications from the platform
                  </p>
                </div>
                <Checkbox
                  id="emailNotifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, emailNotifications: checked === true })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="eventReminder24h">24h Event Reminders (Email)</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Receive email reminders 24 hours before liked events
                  </p>
                </div>
                <Checkbox
                  id="eventReminder24h"
                  checked={settings.eventReminder24h}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, eventReminder24h: checked === true })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="mobilePushNotifications24hReminder">Mobile Push Notifications - 24h Reminder</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Receive push notifications on this device 24 hours before liked events
                  </p>
                </div>
                <Checkbox
                  id="mobilePushNotifications24hReminder"
                  checked={settings.mobilePushNotifications24hReminder}
                  disabled={typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'denied'}
                  onCheckedChange={async (checked) => {
                    const isEnabled = checked === true;
                    setSettings({ ...settings, mobilePushNotifications24hReminder: isEnabled });

                    if (isEnabled) {
                      // Request permission and subscribe
                      if ('serviceWorker' in navigator && 'PushManager' in window) {
                        try {
                          const permission = await Notification.requestPermission();
                          if (permission === 'granted') {
                            const registration = await navigator.serviceWorker.ready;
                            const subscription = await registration.pushManager.subscribe({
                              userVisibleOnly: true,
                              applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
                            });

                            // Send subscription to backend
                            const { apiFetch } = await import('@/lib/api-client');
                            await apiFetch('/api/notifications/subscribe', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ subscription })
                            });

                            toast.success("Push notifications enabled on this device");
                          } else {
                            toast.error("Notification permission denied. Please enable them in your browser/device settings.");
                            setSettings({ ...settings, mobilePushNotifications24hReminder: false });
                          }
                        } catch (error) {
                          console.error("Error subscribing to push:", error);
                          toast.error("Failed to enable push notifications");
                          setSettings({ ...settings, mobilePushNotifications24hReminder: false });
                        }
                      } else {
                        toast.error("Push notifications not supported on this browser");
                        setSettings({ ...settings, mobilePushNotifications24hReminder: false });
                      }
                    }
                  }}
                />
                {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'denied' && (
                  <p className="text-xs text-destructive mt-1">
                    Notifications are blocked by your browser/device settings. Please enable them there first.
                  </p>
                )}
              </div>
              <Button onClick={handleUpdateSettings}>Save Notification Settings</Button>
            </CardContent>
          </Card>

          {/* Change Email */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Change Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newEmail">New Email</Label>
                <Input
                  id="newEmail"
                  type="email"
                  autoComplete="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="new@example.com"
                />
              </div>
              <Button
                onClick={handleChangeEmail}
                disabled={isChangingEmail || !newEmail}
              >
                {isChangingEmail ? "Updating..." : "Update Email"}
              </Button>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleChangePassword();
                }}
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      autoComplete="current-password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, currentPassword: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      autoComplete="new-password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, newPassword: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                      }
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? "Changing..." : "Change Password"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Delete Account */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Delete Account
              </CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data. This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
              >
                {isDeletingAccount ? "Deleting..." : "Delete Account"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
