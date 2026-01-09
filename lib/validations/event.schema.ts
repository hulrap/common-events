import { z } from "zod";

// Helper function to sanitize strings (trim, remove extra whitespace, escape HTML)
const sanitizeString = (val: unknown): string => {
  if (typeof val !== "string") return "";
  return val.trim().replace(/\s+/g, " ");
};

// Helper function for optional nullable strings
const optionalString = (val: unknown): string | undefined => {
  if (val === null || val === undefined || val === "") return undefined;
  if (typeof val === "string") return sanitizeString(val);
  return undefined;
};

// Helper function to sanitize URL
const sanitizeUrl = (val: unknown): string => {
  if (typeof val !== "string") return "";
  const trimmed = val.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    return url.toString();
  } catch {
    return trimmed;
  }
};

export const ticketSchema = z.object({
  ticketName: z.preprocess(
    sanitizeString,
    z.string().min(2, "Ticket name must be at least 2 characters").max(100)
  ),
  price: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return null;
      if (typeof val === "number") return val;
      if (typeof val !== "string") return null;
      const num = Number.parseFloat(val);
      return Number.isNaN(num) ? null : num;
    },
    z.number().min(0, "Price must be non-negative").nullable().optional()
  ),
  currency: z.string().default("EUR"),
  ticketLink: z.preprocess(
    sanitizeUrl,
    z.string().url("Invalid URL").optional().or(z.literal(""))
  ),
  description: z.preprocess(
    sanitizeString,
    z.string().optional()
  ),
  quantityAvailable: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return null;
      if (typeof val === "number") return val;
      if (typeof val !== "string") return null;
      const num = Number.parseInt(val, 10);
      return Number.isNaN(num) ? null : num;
    },
    z.number().int().min(0).optional().nullable()
  ),
});

export const recurrenceSchema = z.object({
  recurrenceType: z.enum(["daily", "weekly", "monthly", "yearly", "custom"]),
  interval: z.number().int().min(1),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  recurrenceEndDate: z.date().optional().nullable(),
  maxOccurrences: z.number().int().min(1).optional().nullable(),
  exceptionDates: z.array(z.date()).optional(),
});

export const createEventSchema = z
  .object({
    title: z.preprocess(
      sanitizeString,
      z.string().min(3, "Title must be at least 3 characters").max(200)
    ),
    description: z.preprocess(
      sanitizeString,
      z.string().min(1, "Description is required")
    ),
    bannerUrl: z.preprocess(
      (val) => {
        if (typeof val === "string") return sanitizeUrl(val);
        return "";
      },
      z.string().url("Invalid URL").optional().or(z.literal(""))
    ),
    mobileBannerUrl: z.preprocess(
      (val) => {
        if (typeof val === "string") return sanitizeUrl(val);
        return "";
      },
      z.string().url("Invalid URL").optional().or(z.literal(""))
    ),
    startDate: z.preprocess(
      (val) => {
        // Handle datetime-local format (yyyy-MM-ddThh:mm) from input elements
        if (typeof val === "string") {
          if (!val) return undefined;
          const date = new Date(val);
          return Number.isNaN(date.getTime()) ? undefined : date;
        }
        if (val instanceof Date) {
          return Number.isNaN(val.getTime()) ? undefined : val;
        }
        return val;
      },
      z.date({ required_error: "Start date is required" })
    ),
    endDate: z.preprocess(
      (val) => {
        // Handle datetime-local format (yyyy-MM-ddThh:mm) from input elements
        if (typeof val === "string") {
          if (!val) return undefined;
          const date = new Date(val);
          return Number.isNaN(date.getTime()) ? undefined : date;
        }
        if (val instanceof Date) {
          return Number.isNaN(val.getTime()) ? undefined : val;
        }
        return val;
      },
      z.date({ required_error: "End date is required" })
    ),
    venueId: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.string().uuid("Invalid venue ID").optional()
    ),
    sourceUrl: z.preprocess(
      (val) => {
        if (typeof val === "string") return sanitizeUrl(val);
        return "";
      },
      z.string().url("Invalid URL").optional().or(z.literal(""))
    ),
    externalLink: z.preprocess(
      (val) => {
        if (typeof val === "string") return sanitizeUrl(val);
        return "";
      },
      z.string().url("Invalid URL").optional().or(z.literal(""))
    ),
    externalLinkText: z.preprocess(
      sanitizeString,
      z.string().max(50).optional()
    ),
    customLocation: z.preprocess(sanitizeString, z.string().optional()),
    address: z.preprocess(sanitizeString, z.string().optional()),
    city: z.preprocess(sanitizeString, z.string().optional()),
    country: z.preprocess(sanitizeString, z.string().optional()),
    // Custom venue fields (for non-existent venues)
    customVenueName: z.preprocess(sanitizeString, z.string().optional()),
    customVenueStreet: z.preprocess(sanitizeString, z.string().optional()),
    customVenueNumber: z.preprocess(sanitizeString, z.string().optional()),
    customVenueZip: z.preprocess(sanitizeString, z.string().optional()),
    customVenueCity: z.preprocess(sanitizeString, z.string().optional()),
    latitude: z.preprocess(
      (val) => {
        if (val === "" || val === null || val === undefined) return undefined;
        if (typeof val === "number") return val;
        if (typeof val !== "string") return undefined;
        const num = Number.parseFloat(val);
        return Number.isNaN(num) ? undefined : num;
      },
      z.number().min(-90).max(90).optional()
    ),
    longitude: z.preprocess(
      (val) => {
        if (val === "" || val === null || val === undefined) return undefined;
        if (typeof val === "number") return val;
        if (typeof val !== "string") return undefined;
        const num = Number.parseFloat(val);
        return Number.isNaN(num) ? undefined : num;
      },
      z.number().min(-180).max(180).optional()
    ),
    onlineEvent: z.boolean().default(false),
    eventUrl: z.preprocess(
      (val) => {
        if (typeof val === "string") return sanitizeUrl(val);
        return "";
      },
      z.string().url("Invalid URL").optional().or(z.literal(""))
    ),
    organizerName: z.preprocess(sanitizeString, z.string().optional()),
    organizerContact: z.preprocess(sanitizeString, z.string().optional()),
    categoryId: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.string().optional()
    ),
    tags: z.preprocess(
      (val) => {
        if (!Array.isArray(val)) return [];
        return val.map((item) => {
          if (typeof item === "string") return sanitizeString(item);
          return sanitizeString(String(item));
        });
      },
      z.array(z.string()).optional()
    ),
    maxAttendees: z.preprocess(
      (val) => {
        if (val === "" || val === null || val === undefined) return null;
        if (typeof val === "number") return val;
        if (typeof val !== "string") return null;
        const num = Number.parseInt(val, 10);
        return Number.isNaN(num) ? null : num;
      },
      z.number().int().min(1).optional().nullable()
    ),
    registrationDeadline: z.coerce.date().optional().nullable(),
    ageRestriction: z.preprocess(optionalString, z.string().optional()),
    dressCode: z.preprocess(optionalString, z.string().optional()),
    language: z.preprocess(optionalString, z.string().optional()),
    accessibilityNotes: z.preprocess(optionalString, z.string().optional()),
    parkingInfo: z.preprocess(optionalString, z.string().optional()),
    publicTransportInfo: z.preprocess(optionalString, z.string().optional()),
    tickets: z.array(ticketSchema).optional(),
    recurrence: recurrenceSchema.optional().nullable(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  })
  .refine(
    (data) => {
      if (data.onlineEvent) {
        return !!data.eventUrl;
      }
      return true;
    },
    {
      message: "Event URL is required for online events",
      path: ["eventUrl"],
    }
  )
  .refine(
    (data) => {
      // If venueId is provided, custom venue fields should not be required
      if (data.venueId) {
        return true;
      }
      // If custom venue name is provided, require address and coordinates
      if (data.customVenueName) {
        return !!(
          data.address &&
          data.city &&
          data.latitude !== undefined &&
          data.longitude !== undefined
        );
      }
      return true;
    },
    {
      message:
        "Please select a valid address from the dropdown to get coordinates",
      path: ["customVenueName"],
    }
  );

export const updateEventSchema = z.object({
  title: z.preprocess(
    (val) => (typeof val === "string" ? sanitizeString(val) : val),
    z.string().min(3, "Title must be at least 3 characters").max(200).optional()
  ),
  description: z.preprocess(
    (val) => (typeof val === "string" ? sanitizeString(val) : val),
    z.string().min(1).optional()
  ),
  shortDescription: z.preprocess(
    (val) => (typeof val === "string" ? sanitizeString(val) : val),
    z.string().max(300).optional()
  ),
  bannerUrl: z.preprocess(
    (val) => {
      if (val === undefined) return undefined;
      if (typeof val === "string") return sanitizeUrl(val);
      return "";
    },
    z.string().url("Invalid URL").optional().or(z.literal(""))
  ),
  mobileBannerUrl: z.preprocess(
    (val) => {
      if (val === undefined) return undefined;
      if (typeof val === "string") return sanitizeUrl(val);
      return "";
    },
    z.string().url("Invalid URL").optional().or(z.literal(""))
  ),
  startDate: z.preprocess(
    (val) => {
      // Handle datetime-local format (yyyy-MM-ddThh:mm) from input elements
      if (typeof val === "string") {
        if (!val) return undefined;
        // datetime-local returns format like "2025-12-15T10:30"
        const date = new Date(val);
        return Number.isNaN(date.getTime()) ? undefined : date;
      }
      if (val instanceof Date) {
        return Number.isNaN(val.getTime()) ? undefined : val;
      }
      return undefined;
    },
    z.date().optional()
  ),
  endDate: z.preprocess(
    (val) => {
      // Handle datetime-local format (yyyy-MM-ddThh:mm) from input elements
      if (typeof val === "string") {
        if (!val) return undefined;
        // datetime-local returns format like "2025-12-15T10:30"
        const date = new Date(val);
        return Number.isNaN(date.getTime()) ? undefined : date;
      }
      if (val instanceof Date) {
        return Number.isNaN(val.getTime()) ? undefined : val;
      }
      return undefined;
    },
    z.date().optional()
  ),
  venueId: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().uuid("Invalid venue ID").optional().nullable()
  ),
  sourceUrl: z.preprocess(
    (val) => {
      if (val === undefined) return undefined;
      if (typeof val === "string") return sanitizeUrl(val);
      return "";
    },
    z.string().url("Invalid URL").optional().or(z.literal(""))
  ),
  externalLink: z.preprocess(
    (val) => {
      if (val === undefined) return undefined;
      if (typeof val === "string") return sanitizeUrl(val);
      return "";
    },
    z.string().url("Invalid URL").optional().or(z.literal(""))
  ),
  externalLinkText: z.preprocess(
    sanitizeString,
    z.string().max(50).optional()
  ),
  customLocation: z.preprocess(optionalString, z.string().optional()),
  address: z.preprocess(optionalString, z.string().optional()),
  city: z.preprocess(optionalString, z.string().optional()),
  country: z.preprocess(optionalString, z.string().optional()),
  customVenueName: z.preprocess(optionalString, z.string().optional()),
  customVenueStreet: z.preprocess(optionalString, z.string().optional()),
  customVenueNumber: z.preprocess(optionalString, z.string().optional()),
  customVenueZip: z.preprocess(optionalString, z.string().optional()),
  customVenueCity: z.preprocess(optionalString, z.string().optional()),
  latitude: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      if (typeof val === "number") return val;
      if (typeof val !== "string") return undefined;
      const num = Number.parseFloat(val);
      return Number.isNaN(num) ? undefined : num;
    },
    z.number().min(-90).max(90).optional()
  ),
  longitude: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      if (typeof val === "number") return val;
      if (typeof val !== "string") return undefined;
      const num = Number.parseFloat(val);
      return Number.isNaN(num) ? undefined : num;
    },
    z.number().min(-180).max(180).optional()
  ),
  onlineEvent: z.boolean().optional(),
  eventUrl: z.preprocess(
    (val) => {
      if (val === undefined) return undefined;
      if (typeof val === "string") return sanitizeUrl(val);
      return "";
    },
    z.string().url().optional().or(z.literal(""))
  ),
  organizerName: z.preprocess(optionalString, z.string().optional()),
  organizerContact: z.preprocess(optionalString, z.string().optional()),
  categoryId: z.string().optional(),
  tags: z.preprocess(
    (val) => {
      if (val === null) return [];
      if (Array.isArray(val)) {
        return val.map((item) => (typeof item === "string" ? sanitizeString(item) : item));
      }
      return val;
    },
    z.array(z.string()).optional()
  ),
  maxAttendees: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return null;
      if (typeof val === "number") return val;
      if (typeof val !== "string") return null;
      const num = Number.parseInt(val, 10);
      return Number.isNaN(num) ? null : num;
    },
    z.number().int().min(1).optional().nullable()
  ),
  registrationDeadline: z.coerce.date().optional().nullable(),
  ageRestriction: z.preprocess(optionalString, z.string().optional()),
  dressCode: z.preprocess(optionalString, z.string().optional()),
  language: z.preprocess(optionalString, z.string().optional()),
  accessibilityNotes: z.preprocess(optionalString, z.string().optional()),
  parkingInfo: z.preprocess(optionalString, z.string().optional()),
  publicTransportInfo: z.preprocess(optionalString, z.string().optional()),
  tickets: z.array(ticketSchema).optional(),
  recurrence: recurrenceSchema.optional().nullable(),
  isAutoReminderEnabled: z.boolean().optional(),
});

export const eventQuerySchema = z.object({
  dateRangeStart: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  dateRangeEnd: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  categories: z.string().optional().transform((val) => (val ? val.split(",") : [])),
  tags: z.string().optional().transform((val) => (val ? val.split(",") : [])),
  locationType: z.enum(["city", "standort", "all"]).optional(),
  locationCityId: z.string().optional(),
  locationStandortId: z.string().optional(),
  locationMaxDistanceKm: z.string().optional().transform((val) => (val ? Number.parseFloat(val) : undefined)),
  venues: z.string().optional().transform((val) => (val ? val.split(",") : [])),
  onlineOnly: z.string().optional().transform((val) => val === "true"),
  editorsChoiceOnly: z.string().optional().transform((val) => val === "true"),
  searchTerm: z.string().optional(),
  sortBy: z.enum(["date", "title", "newest"]).optional(),
  limit: z.string().optional().transform((val) => (val ? Number.parseInt(val, 10) : 12)),
  offset: z.string().optional().transform((val) => (val ? Number.parseInt(val, 10) : 0)),
  // Bounding box parameters for viewport-based map loading
  minLat: z.string().optional().transform((val) => (val ? Number.parseFloat(val) : undefined)),
  maxLat: z.string().optional().transform((val) => (val ? Number.parseFloat(val) : undefined)),
  minLng: z.string().optional().transform((val) => (val ? Number.parseFloat(val) : undefined)),
  maxLng: z.string().optional().transform((val) => (val ? Number.parseFloat(val) : undefined)),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type TicketInput = z.infer<typeof ticketSchema>;
export type RecurrenceInput = z.infer<typeof recurrenceSchema>;
export type EventQueryInput = z.infer<typeof eventQuerySchema>;

