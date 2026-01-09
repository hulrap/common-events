import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

// ICS file generator helper
const generateICS = (events: any[]) => {
    let icsContent = "BEGIN:VCALENDAR\r\n";
    icsContent += "VERSION:2.0\r\n";
    icsContent += "PRODID:-//CommonEvents//Calendar//EN\r\n";
    icsContent += "CALSCALE:GREGORIAN\r\n";
    icsContent += "METHOD:PUBLISH\r\n";
    icsContent += "X-WR-CALNAME:My Liked Events\r\n";
    icsContent += "X-WR-TIMEZONE:UTC\r\n";

    events.forEach((event: any) => {
        // Format date to YYYYMMDDTHHMMSSZ
        const formatDate = (dateString: string) => {
            const date = new Date(dateString);
            return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
        };

        icsContent += "BEGIN:VEVENT\r\n";
        icsContent += `UID:${event.id}@events.commoncause.cc\r\n`;
        icsContent += `DTSTAMP:${formatDate(new Date().toISOString())}\r\n`;
        icsContent += `DTSTART:${formatDate(event.start_date)}\r\n`;
        icsContent += `DTEND:${formatDate(event.end_date)}\r\n`;
        icsContent += `SUMMARY:${event.title}\r\n`;

        // Description - escape newlines
        let description = event.description || "";
        description = description.replace(/\n/g, "\\n");
        // Truncate if too long (optional, but good for some clients)
        if (description.length > 7500) description = description.substring(0, 7500) + "...";
        icsContent += `DESCRIPTION:${description}\r\n`;

        if (event.city) {
            icsContent += `LOCATION:${event.city}\r\n`;
        }

        icsContent += "END:VEVENT\r\n";
    });

    icsContent += "END:VCALENDAR\r\n";
    return icsContent;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { userId } = req.query;

    if (!userId || typeof userId !== "string") {
        return res.status(400).json({ error: "Invalid user ID" });
    }

    // Determine if using service role (if internal) or just anon if properly secured RLS
    // For calendar feed, we usually want it public if the link is known, OR check a token.
    // The user asked for "without api keys", implying a public-link style feed.
    // We'll use the service role client here to fetch events for that specific user ID,
    // assuming the userId.ics link is a "secret link" capability.

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Must verify this env var exists
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method !== "GET") {
        res.setHeader("Allow", ["GET"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        // Check if user exists (optional security check)
        // Fetch liked events for this user
        const { data: likedEvents, error } = await supabase
            .from("event_likes")
            .select(`
        event_id,
        events (
          id,
          title,
          description,
          start_date,
          end_date,
          city,
          venue_id
        )
      `)
            .eq("user_id", userId.replace('.ics', '')); // Handle .ics extension if passed

        if (error) {
            console.error("Error fetching events:", error);
            return res.status(500).json({ error: "Failed to fetch events" });
        }

        // Flatten the data
        const events = likedEvents
            .map((like: any) => like.events)
            .filter((e: any) => e !== null);

        const icsData = generateICS(events);

        res.setHeader("Content-Type", "text/calendar; charset=utf-8");
        // Don't use "attachment" - let calendar apps treat this as a subscription feed
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.status(200).send(icsData);

    } catch (error) {
        console.error("Calendar export error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}
