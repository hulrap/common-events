import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createApiClient } from "@/lib/supabase/api";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createApiClient(req);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    try {
      // Use Supabase Client for RLS enforcement
      const { data: userData, error: fetchError } = await supabase
        .from("users")
        .select("email, full_name, organization_name, email_notifications, event_reminder_24h, mobile_push_notifications_24h_reminder, is_organizer, slug, contact_email, contact_phone, website_url, social_links, profile_image, description")
        .eq("id", user.id)
        .single();

      if (fetchError) throw fetchError;

      if (!userData) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.status(200).json({
        email: userData.email,
        fullName: userData.full_name || null,
        organizationName: userData.organization_name || null,
        emailNotifications: userData.email_notifications ?? true,
        eventReminder24h: userData.event_reminder_24h ?? false,
        mobilePushNotifications24hReminder: userData.mobile_push_notifications_24h_reminder ?? false,
        isOrganizer: userData.is_organizer ?? false,
        slug: userData.slug || null,
        contactEmail: userData.contact_email || null,
        contactPhone: userData.contact_phone || null,
        websiteUrl: userData.website_url || null,
        socialLinks: userData.social_links || null,
        profileImage: userData.profile_image || null,
        description: userData.description || null,
      });
    } catch (error) {
      console.error("Error fetching user settings:", error);
      return res.status(500).json({
        error: "Failed to fetch settings",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  if (req.method === "PUT") {
    try {
      const {
        emailNotifications,
        eventReminder24h,
        mobilePushNotifications24hReminder,
        fullName,
        organizationName,
        slug,
        contactEmail,
        contactPhone,
        websiteUrl,
        socialLinks,
        profileImage,
        description
      } = req.body;

      const updateData: {
        email_notifications?: boolean;
        event_reminder_24h?: boolean;
        mobile_push_notifications_24h_reminder?: boolean;
        full_name?: string | null;
        organization_name?: string | null;
        slug?: string | null;
        contact_email?: string | null;
        contact_phone?: string | null;
        website_url?: string | null;
        social_links?: any;
        profile_image?: string | null;
        description?: string | null;
      } = {};

      if (emailNotifications !== undefined) {
        updateData.email_notifications = emailNotifications;
      }
      if (eventReminder24h !== undefined) {
        updateData.event_reminder_24h = eventReminder24h;
      }
      if (mobilePushNotifications24hReminder !== undefined) {
        updateData.mobile_push_notifications_24h_reminder = mobilePushNotifications24hReminder;
      }
      if (fullName !== undefined) {
        updateData.full_name = fullName || null;
      }
      if (organizationName !== undefined) {
        updateData.organization_name = organizationName || null;
      }
      if (slug !== undefined) updateData.slug = slug || null;
      if (contactEmail !== undefined) updateData.contact_email = contactEmail || null;
      if (contactPhone !== undefined) updateData.contact_phone = contactPhone || null;
      if (websiteUrl !== undefined) updateData.website_url = websiteUrl || null;
      if (socialLinks !== undefined) updateData.social_links = socialLinks || null;
      if (profileImage !== undefined) updateData.profile_image = profileImage || null;
      if (description !== undefined) updateData.description = description || null;

      // Use Supabase Client for RLS enforcement
      const { data: updated, error: updateError } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return res.status(200).json({
        email: updated.email,
        fullName: updated.full_name,
        organizationName: updated.organization_name,
        emailNotifications: updated.email_notifications,
        eventReminder24h: updated.event_reminder_24h,
        mobilePushNotifications24hReminder: updated.mobile_push_notifications_24h_reminder,
        slug: updated.slug,
        contactEmail: updated.contact_email,
        contactPhone: updated.contact_phone,
        websiteUrl: updated.website_url,
        socialLinks: updated.social_links,
        profileImage: updated.profile_image,
        description: updated.description,
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      return res.status(500).json({ error: "Failed to update settings" });
    }
  }

  if (req.method === "POST") {
    const { action, currentPassword, newPassword, newEmail } = req.body;

    if (action === "changePassword") {
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current and new password are required" });
      }

      try {
        // Verify current password by signing in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email!,
          password: currentPassword,
        });

        if (signInError) {
          return res.status(400).json({ error: "Current password is incorrect" });
        }

        // Update password
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (updateError) {
          return res.status(400).json({ error: updateError.message });
        }

        return res.status(200).json({ message: "Password updated successfully" });
      } catch (error) {
        console.error("Error changing password:", error);
        return res.status(500).json({ error: "Failed to change password" });
      }
    }

    if (action === "changeEmail") {
      if (!newEmail) {
        return res.status(400).json({ error: "New email is required" });
      }

      try {
        // Update email in Supabase Auth
        const { error: updateError } = await supabase.auth.updateUser({
          email: newEmail,
        });

        if (updateError) {
          return res.status(400).json({ error: updateError.message });
        }

        // Update email in database
        await db
          .update(users)
          .set({ email: newEmail })
          .where(eq(users.id, user.id));

        return res.status(200).json({ message: "Email update initiated. Please check your new email." });
      } catch (error) {
        console.error("Error changing email:", error);
        return res.status(500).json({ error: "Failed to change email" });
      }
    }

    if (action === "deleteAccount") {
      try {
        // Use Service Role Client for admin deletion
        const supabaseAdmin = createServiceRoleClient();
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

        if (deleteError) {
          return res.status(400).json({ error: deleteError.message });
        }

        return res.status(200).json({ message: "Account deleted successfully" });
      } catch (error) {
        console.error("Error deleting account:", error);
        return res.status(500).json({ error: "Failed to delete account" });
      }
    }

    return res.status(400).json({ error: "Invalid action" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

