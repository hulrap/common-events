import { relations } from "drizzle-orm";
import { users, events, eventRecurrence, eventTickets, categories, eventCategories, userLocations, userFilterPreferences, venues, venueEventVisibility, eventLikes, pushSubscriptions, notifications, organizerFollows, eventGalleryImages } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  events: many(events),
  pushSubscriptions: many(pushSubscriptions),
  notifications: many(notifications),
  followers: many(organizerFollows, { relationName: "organizer" }),
  following: many(organizerFollows, { relationName: "follower" }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  organizer: one(users, {
    fields: [events.organizerId],
    references: [users.id],
  }),
  venue: one(venues, {
    fields: [events.venueId],
    references: [venues.id],
  }),
  recurrence: one(eventRecurrence, {
    fields: [events.id],
    references: [eventRecurrence.eventId],
  }),
  tickets: many(eventTickets),
  venueVisibility: many(venueEventVisibility),
  galleryImages: many(eventGalleryImages),
}));

export const eventRecurrenceRelations = relations(eventRecurrence, ({ one }) => ({
  event: one(events, {
    fields: [eventRecurrence.eventId],
    references: [events.id],
  }),
}));

export const eventTicketsRelations = relations(eventTickets, ({ one }) => ({
  event: one(events, {
    fields: [eventTickets.eventId],
    references: [events.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "parent",
  }),
  children: many(categories, {
    relationName: "parent",
  }),
  eventCategories: many(eventCategories),
}));

export const eventCategoriesRelations = relations(eventCategories, ({ one }) => ({
  event: one(events, {
    fields: [eventCategories.eventId],
    references: [events.id],
  }),
  category: one(categories, {
    fields: [eventCategories.categoryId],
    references: [categories.id],
  }),
}));

export const eventsCategoriesRelations = relations(events, ({ many }) => ({
  categories: many(eventCategories),
}));

export const usersLocationsRelations = relations(users, ({ many }) => ({
  locations: many(userLocations),
}));

export const userLocationsRelations = relations(userLocations, ({ one }) => ({
  user: one(users, {
    fields: [userLocations.userId],
    references: [users.id],
  }),
}));

export const usersFilterPreferencesRelations = relations(users, ({ many }) => ({
  filterPreferences: many(userFilterPreferences),
}));

export const userFilterPreferencesRelations = relations(userFilterPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userFilterPreferences.userId],
    references: [users.id],
  }),
}));

export const venuesRelations = relations(venues, ({ one, many }) => ({
  owner: one(users, {
    fields: [venues.ownerId],
    references: [users.id],
  }),
  events: many(events),
  eventVisibility: many(venueEventVisibility),
}));

export const usersVenuesRelations = relations(users, ({ many }) => ({
  ownedVenues: many(venues),
}));

export const venueEventVisibilityRelations = relations(venueEventVisibility, ({ one }) => ({
  venue: one(venues, {
    fields: [venueEventVisibility.venueId],
    references: [venues.id],
  }),
  event: one(events, {
    fields: [venueEventVisibility.eventId],
    references: [events.id],
  }),
}));

export const eventLikesRelations = relations(eventLikes, ({ one }) => ({
  user: one(users, {
    fields: [eventLikes.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [eventLikes.eventId],
    references: [events.id],
  }),
}));

export const usersLikesRelations = relations(users, ({ many }) => ({
  likedEvents: many(eventLikes),
}));

export const eventsLikesRelations = relations(events, ({ many }) => ({
  likes: many(eventLikes),
}));

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [pushSubscriptions.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const organizerFollowsRelations = relations(organizerFollows, ({ one }) => ({
  follower: one(users, {
    fields: [organizerFollows.followerId],
    references: [users.id],
    relationName: "follower",
  }),
  organizer: one(users, {
    fields: [organizerFollows.organizerId],
    references: [users.id],
    relationName: "organizer",
  }),
}));

export const eventGalleryImagesRelations = relations(eventGalleryImages, ({ one }) => ({
  event: one(events, {
    fields: [eventGalleryImages.eventId],
    references: [events.id],
  }),
}));
