import { pgTable, uuid, text, timestamp, boolean, integer, decimal, pgEnum, doublePrecision, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";

export const recurrenceTypeEnum = pgEnum("recurrence_type", [
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "custom",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  organizationName: text("organization_name"),
  isOrganizer: boolean("is_organizer").default(false).notNull(),
  isVenueOwner: boolean("is_venue_owner").default(false).notNull(),
  isEditor: boolean("is_editor").default(false).notNull(),
  emailNotifications: boolean("email_notifications").default(true).notNull(),
  eventReminder24h: boolean("event_reminder_24h").default(false).notNull(),
  mobilePushNotifications24hReminder: boolean("mobile_push_notifications_24h_reminder").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  slug: text("slug").unique(),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  websiteUrl: text("website_url"),
  socialLinks: jsonb("social_links"),
  profileImage: text("profile_image"),
  description: text("description"),
});

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  shortDescription: text("short_description"),
  bannerUrl: text("banner_url"),
  mobileBannerUrl: text("mobile_banner_url"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  venueId: uuid("venue_id").references(() => venues.id, { onDelete: "set null" }),
  customLocation: text("custom_location"),
  address: text("address"),
  city: text("city").default("Vienna").notNull(),
  country: text("country").default("Austria").notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  // Note: 'location' geography column added via migration 0003_add_postgis_spatial_indexes.sql
  // It's auto-updated from latitude/longitude via triggers for fast spatial queries
  onlineEvent: boolean("online_event").default(false).notNull(),
  eventUrl: text("event_url"),
  organizerId: uuid("organizer_id").references(() => users.id).notNull(),
  organizerName: text("organizer_name"),
  organizerContact: text("organizer_contact"),
  categoryId: text("category_id"),
  tags: text("tags").array(),
  maxAttendees: integer("max_attendees"),
  registrationDeadline: timestamp("registration_deadline"),
  ageRestriction: text("age_restriction"),
  dressCode: text("dress_code"),
  language: text("language"),
  accessibilityNotes: text("accessibility_notes"),
  parkingInfo: text("parking_info"),
  publicTransportInfo: text("public_transport_info"),
  isPublished: boolean("is_published").default(true).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isEditorsChoice: boolean("is_editors_choice").default(false).notNull(),
  sourceUrl: text("source_url"),
  externalLink: text("external_link"),
  externalLinkText: text("external_link_text"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  invitationSentAt: timestamp("invitation_sent_at"),
  reminderSentAt: timestamp("reminder_sent_at"),
  isAutoReminderEnabled: boolean("is_auto_reminder_enabled").default(false).notNull(),
}, (table) => ({
  // Indexes for common query patterns
  organizerIdIdx: index("idx_events_organizer_id").on(table.organizerId),
  isPublishedIdx: index("idx_events_is_published").on(table.isPublished),
  startDateIdx: index("idx_events_start_date").on(table.startDate),
  cityIdx: index("idx_events_city").on(table.city),
  venueIdIdx: index("idx_events_venue_id").on(table.venueId),
  isPublishedStartDateIdx: index("idx_events_published_start_date").on(table.isPublished, table.startDate),
  // Index for auto-reminder cron job
  autoReminderIdx: index("idx_events_auto_reminder").on(table.startDate, table.isAutoReminderEnabled, table.reminderSentAt),
  // Composite index for most common query: published events sorted by date
}));

export const eventRecurrence = pgTable("event_recurrence", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }).notNull().unique(),
  recurrenceType: recurrenceTypeEnum("recurrence_type").notNull(),
  interval: integer("interval").notNull(),
  daysOfWeek: integer("days_of_week").array(),
  recurrenceEndDate: timestamp("recurrence_end_date"),
  maxOccurrences: integer("max_occurrences"),
  exceptionDates: timestamp("exception_dates").array(),
});

export const eventTickets = pgTable("event_tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  ticketName: text("ticket_name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }),
  currency: text("currency").default("EUR").notNull(),
  ticketLink: text("ticket_link"),
  description: text("description"),
  quantityAvailable: integer("quantity_available"),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  eventIdIdx: index("idx_event_tickets_event_id").on(table.eventId),
  eventIdIsActiveIdx: index("idx_event_tickets_event_active").on(table.eventId, table.isActive),
}));

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color"),
  description: text("description"),
  parentId: text("parent_id"),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const eventCategories = pgTable("event_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  categoryId: text("category_id").references(() => categories.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  eventIdIdx: index("idx_event_categories_event_id").on(table.eventId),
  categoryIdIdx: index("idx_event_categories_category_id").on(table.categoryId),
}));

export const userLocations = pgTable("user_locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  address: text("address"),
  city: text("city"),
  country: text("country"),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("idx_user_locations_user_id").on(table.userId),
  userIdIsDefaultIdx: index("idx_user_locations_user_default").on(table.userId, table.isDefault),
}));

export const userFilterPreferences = pgTable("user_filter_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  filterConfig: jsonb("filter_config").notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("idx_user_filter_preferences_user_id").on(table.userId),
  userIdIsDefaultIdx: index("idx_user_filter_preferences_user_default").on(table.userId, table.isDefault),
}));

export const venues = pgTable("venues", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  website: text("website"),
  address: text("address"),
  city: text("city"),
  country: text("country"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  bannerUrl: text("banner_url"),
  openingHours: jsonb("opening_hours"),
  ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const venueEventVisibility = pgTable("venue_event_visibility", {
  id: uuid("id").primaryKey().defaultRandom(),
  venueId: uuid("venue_id").references(() => venues.id, { onDelete: "cascade" }).notNull(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  isVisible: boolean("is_visible").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  venueIdIdx: index("idx_venue_event_visibility_venue_id").on(table.venueId),
  eventIdIdx: index("idx_venue_event_visibility_event_id").on(table.eventId),
}));

export const eventLikes = pgTable("event_likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Unique constraint to prevent duplicate likes (creates unique index)
  userEventUniqueIdx: uniqueIndex("idx_event_likes_user_event_unique").on(table.userId, table.eventId),
  // Additional indexes for query performance
  userIdIdx: index("idx_event_likes_user_id").on(table.userId),
  eventIdIdx: index("idx_event_likes_event_id").on(table.eventId),
  userIdCreatedIdx: index("idx_event_likes_user_created").on(table.userId, table.createdAt),
}));

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("idx_push_subscriptions_user_id").on(table.userId),
  endpointIdx: index("idx_push_subscriptions_endpoint").on(table.endpoint), // Ensure unique endpoints per user effectively
}));

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"),
  isRead: boolean("is_read").default(false).notNull(),
  type: text("type").default("info").notNull(), // 'reminder', 'system', etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("idx_notifications_user_id").on(table.userId),
  userIdIsReadIdx: index("idx_notifications_user_read").on(table.userId, table.isRead),
}));

export const organizerFollows = pgTable("organizer_follows", {
  id: uuid("id").primaryKey().defaultRandom(),
  followerId: uuid("follower_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  organizerId: uuid("organizer_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  followerIdIdx: index("idx_organizer_follows_follower_id").on(table.followerId),
  organizerIdIdx: index("idx_organizer_follows_organizer_id").on(table.organizerId),
  uniqueFollow: uniqueIndex("idx_organizer_follows_unique").on(table.followerId, table.organizerId),
}));

export const eventGalleryImages = pgTable("event_gallery_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  url: text("url").notNull(),
  caption: text("caption"),
  copyright: text("copyright"),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  eventIdIdx: index("idx_event_gallery_images_event_id").on(table.eventId),
}));

