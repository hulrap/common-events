import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/db';
import { events as eventsTable, venues, eventLikes } from '@/db/schema';
import { sql, eq } from 'drizzle-orm';
import { eventQuerySchema } from '@/lib/validations/event.schema';
import { z } from 'zod';
import { createApiClient } from "@/lib/supabase/api";

// Extended schema to include zoom and bounds
const mapQuerySchema = eventQuerySchema.extend({
  zoom: z.string().transform((val) => parseInt(val, 10)),
});

export interface MapPoint {
  type: 'point';
  id: string;
  lat: number;
  lng: number;
  event: any;
}

export interface MapCluster {
  type: 'cluster';
  id: string;
  lat: number;
  lng: number;
  count: number;
  events?: any[];
}

export type MapItem = MapPoint | MapCluster;

interface MapResponse {
  items: MapItem[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MapResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const queryParams = mapQuerySchema.parse(req.query);
    const { zoom } = queryParams;

    console.log('[API/Map] Request:', {
      queryParams: req.query,
      parsedParams: {
        ...queryParams,
        dateRangeStart: queryParams.dateRangeStart?.toISOString(),
        dateRangeEnd: queryParams.dateRangeEnd?.toISOString()
      }
    });

    const gridSize = 40 / Math.pow(2, zoom);

    // Build WHERE conditions as raw SQL fragments
    // We'll join them with AND at the end
    const conditions: ReturnType<typeof sql>[] = [];

    // Base condition: published events with coordinates
    conditions.push(sql`events.is_published = true`);
    conditions.push(sql`(
      (events.latitude IS NOT NULL AND events.longitude IS NOT NULL) 
      OR (venues.latitude IS NOT NULL AND venues.longitude IS NOT NULL)
    )`);

    // Date range filter (overlap logic)
    if (queryParams.dateRangeStart && queryParams.dateRangeEnd) {
      conditions.push(sql`(
        events.start_date <= ${queryParams.dateRangeEnd.toISOString()}::timestamp 
        AND events.end_date >= ${queryParams.dateRangeStart.toISOString()}::timestamp
      )`);
    } else if (queryParams.dateRangeStart) {
      conditions.push(sql`events.end_date >= ${queryParams.dateRangeStart.toISOString()}::timestamp`);
    } else if (queryParams.dateRangeEnd) {
      conditions.push(sql`events.start_date <= ${queryParams.dateRangeEnd.toISOString()}::timestamp`);
    } else {
      conditions.push(sql`events.end_date >= NOW()`);
    }

    // Search filter
    if (queryParams.searchTerm) {
      const term = `%${queryParams.searchTerm}%`;
      conditions.push(sql`(events.title ILIKE ${term} OR events.description ILIKE ${term})`);
    }

    // Category filter - use ARRAY constructor for proper PostgreSQL array syntax
    if (queryParams.categories.length > 0) {
      const categoryArray = queryParams.categories.map(c => `'${c}'`).join(',');
      conditions.push(sql.raw(`events.category_id = ANY(ARRAY[${categoryArray}]::text[])`));
    }

    // Online only
    if (queryParams.onlineOnly) {
      conditions.push(sql`events.online_event = true`);
    }

    // Editor's choice only
    if (queryParams.editorsChoiceOnly) {
      conditions.push(sql`events.is_editors_choice = true`);
    }

    // Venue filter - use ARRAY constructor for proper PostgreSQL array syntax
    if (queryParams.venues.length > 0) {
      const venueArray = queryParams.venues.map(v => `'${v}'`).join(',');
      conditions.push(sql.raw(`events.venue_id = ANY(ARRAY[${venueArray}]::uuid[])`));
    }

    // Bounding box filter
    if (queryParams.minLat !== undefined && queryParams.maxLat !== undefined &&
      queryParams.minLng !== undefined && queryParams.maxLng !== undefined) {
      conditions.push(sql`(
        (events.venue_id IS NOT NULL AND 
         venues.latitude BETWEEN ${queryParams.minLat} AND ${queryParams.maxLat} AND 
         venues.longitude BETWEEN ${queryParams.minLng} AND ${queryParams.maxLng})
        OR 
        (events.venue_id IS NULL AND 
         events.latitude BETWEEN ${queryParams.minLat} AND ${queryParams.maxLat} AND
         events.longitude BETWEEN ${queryParams.minLng} AND ${queryParams.maxLng})
      )`);
    }

    // Build the WHERE clause by joining conditions with AND
    const whereClause = sql.join(conditions, sql` AND `);

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    // Construct the full query using ONLY raw SQL
    const querySql = sql`
      WITH filtered_events AS (
        SELECT
          events.id,
          events.title,
          events.start_date,
          events.end_date,
          events.category_id,
          events.is_editors_choice,
          COALESCE(events.banner_url, venues.banner_url) as banner_url,
          events.mobile_banner_url,
          events.short_description,
          CASE WHEN events.venue_id IS NOT NULL THEN venues.latitude ELSE events.latitude END as lat,
          CASE WHEN events.venue_id IS NOT NULL THEN venues.longitude ELSE events.longitude END as lng,
          CASE WHEN events.venue_id IS NOT NULL THEN venues.address ELSE events.address END as address,
          events.city,
          events.country,
          events.venue_id,
          venues.name as venue_name,
          ST_SetSRID(ST_MakePoint(
            CASE WHEN events.venue_id IS NOT NULL THEN venues.longitude ELSE events.longitude END, 
            CASE WHEN events.venue_id IS NOT NULL THEN venues.latitude ELSE events.latitude END
          ), 4326) as geom
        FROM events
        LEFT JOIN venues ON events.venue_id = venues.id
        WHERE ${whereClause}
      ),
      clustered AS (
        SELECT
          ST_SnapToGrid(geom, ${gridSize}) as cluster_geom,
          COUNT(*) as count,
          ST_X(ST_Centroid(ST_Collect(geom))) as true_lng,
          ST_Y(ST_Centroid(ST_Collect(geom))) as true_lat,
          JSON_AGG(
            json_build_object(
              'id', id,
              'title', title,
              'startDate', start_date,
              'endDate', end_date,
              'categoryId', category_id,
              'isEditorsChoice', is_editors_choice,
              'bannerUrl', banner_url,
              'mobileBannerUrl', mobile_banner_url,
              'shortDescription', short_description,
              'address', address,
              'city', city,
              'country', country,
              'venueId', venue_id,
              'venueName', venue_name
            ) ORDER BY id
          ) as event_data
        FROM filtered_events
        GROUP BY cluster_geom
      )
      SELECT
        true_lng as lng,
        true_lat as lat,
        count,
        event_data
      FROM clustered
      ORDER BY count DESC, lat, lng, (event_data->0->>'id')
    `;

    // Log the actual SQL for debugging
    console.log('[API/Map] Executing query with WHERE clause conditions:', conditions.length);

    const result = await db.execute(querySql);

    // Fetch user likes if authenticated
    const supabase = createApiClient(req);
    const { data: { user } } = await supabase.auth.getUser();
    const likedEventIds = new Set<string>();

    if (user) {
      const likes = await db
        .select({ eventId: eventLikes.eventId })
        .from(eventLikes)
        .where(eq(eventLikes.userId, user.id));
      likes.forEach(like => likedEventIds.add(like.eventId));
    }

    const items: MapItem[] = (result as unknown as any[]).map((row: any) => {
      const count = Number(row.count);
      const eventData = Array.isArray(row.event_data) ? row.event_data[0] : row.event_data;

      if (count === 1 && eventData) {
        return {
          type: 'point',
          id: eventData.id,
          lat: row.lat,
          lng: row.lng,
          event: {
            id: eventData.id,
            title: eventData.title,
            startDate: eventData.startDate,
            endDate: eventData.endDate,
            categoryId: eventData.categoryId,
            isEditorsChoice: eventData.isEditorsChoice,
            bannerUrl: eventData.bannerUrl,
            mobileBannerUrl: eventData.mobileBannerUrl,
            shortDescription: eventData.shortDescription,
            address: eventData.address,
            city: eventData.city,
            country: eventData.country,
            venueId: eventData.venueId,
            venueName: eventData.venueName,
            isLiked: likedEventIds.has(eventData.id),
          }
        };
      } else {
        let clusterEvents = undefined;
        if (Array.isArray(row.event_data)) {
          clusterEvents = row.event_data.map((e: any) => ({
            id: e.id,
            title: e.title,
            startDate: e.startDate,
            endDate: e.endDate,
            categoryId: e.categoryId,
            isEditorsChoice: e.isEditorsChoice,
            bannerUrl: e.bannerUrl,
            mobileBannerUrl: e.mobileBannerUrl,
            shortDescription: e.shortDescription,
            address: e.address,
            city: e.city,
            country: e.country,
            venueId: e.venueId,
            venueName: e.venueName,
            isLiked: likedEventIds.has(e.id),
          }));
        }

        return {
          type: 'cluster',
          id: `cluster-${row.lat}-${row.lng}`,
          lat: row.lat,
          lng: row.lng,
          count: count,
          events: clusterEvents
        };
      }
    });

    console.log(`[API/Map] Returning ${items.length} items. Sample dates:`,
      items.slice(0, 3).map(i => {
        const e = i.type === 'point' ? i.event : i.events?.[0];
        return {
          id: i.id,
          start: e?.startDate,
          end: e?.endDate
        };
      })
    );
    res.status(200).json({ items });
  } catch (error) {
    console.error('Map clustering API error:', error);
    res.status(400).json({ error: 'Failed to fetch map items' });
  }
}
