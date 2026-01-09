-- Add columns for manual/auto notification tracking
ALTER TABLE "events" 
ADD COLUMN "invitation_sent_at" timestamp,
ADD COLUMN "reminder_sent_at" timestamp,
ADD COLUMN "is_auto_reminder_enabled" boolean DEFAULT false NOT NULL;

-- Create index for auto-reminder queries (performance optimization for cron job)
CREATE INDEX "idx_events_auto_reminder" ON "events" ("start_date", "is_auto_reminder_enabled", "reminder_sent_at");
