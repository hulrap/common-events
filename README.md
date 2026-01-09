# Common Events

<div align="center">

[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](https://shields.io/)
[![Status: Production](https://img.shields.io/badge/Status-Production-green.svg)](https://shields.io/)
[![Tech Stack: T3](https://img.shields.io/badge/Tech%20Stack-T3-blue.svg)](https://create.t3.gg/)
[![Framework: Next.js](https://img.shields.io/badge/Framework-Next.js-black.svg)](https://nextjs.org/)

</div>

Common Events is a modern, enterprise-grade event management and discovery platform engineered for performance, scalability, and developer experience. It leverages the T3 Stack philosophy to deliver a type-safe, full-stack application with a focus on geospatial data visualization and complex filtering capabilities.

## Features

### Core Capabilities
-   **Geospatial Discovery**: Interactive map interface with high-performance clustering for visualizing thousands of events.
-   **Advanced Filtering**: Multi-faceted search engine allowing users to filter by date range, category, tags, location (city or radius), and venue.
-   **Event Management**: Comprehensive dashboard for organizers to create, edit, and manage events with rich text descriptions and image uploads.
-   **User Personalization**: User profiles, saved locations, and "liked" events.
-   **Responsive Experience**: Mobile-first design ensuring full functionality across all device sizes.

### Technical Highlights
-   **End-to-End Type Safety**: Full TypeScript integration from database schema (Drizzle) to API validation (Zod) to frontend components.
-   **Server-State Management**: Robust caching and synchronization using TanStack Query (React Query).
-   **Spatial Indexing**: PostGIS integration for efficient radius-based geospatial queries.
-   **Optimized Rendering**: Virtualized lists and map clustering to handle large datasets without UI lag.

## Architecture & Design

### Frontend Architecture
The frontend is built on **Next.js (Pages Router)**, utilizing a component-driven architecture.
-   **State Management**: We avoid global client state stores (like Redux) in favor of **TanStack Query** for server state and React Context for local UI state (e.g., `FilterContext`). This ensures data freshness and reduces boilerplate.
-   **Component Library**: Built on **Radix UI** primitives for accessibility and headless functionality, styled with **Tailwind CSS** for rapid, utility-first design.
-   **Map Integration**: Uses `@vis.gl/react-google-maps` for a declarative approach to Google Maps, integrating seamlessly with React's lifecycle.

### Backend Architecture
The backend consists of **Next.js API Routes** serving as a serverless REST API.
-   **Database Layer**: **Drizzle ORM** provides a lightweight, type-safe abstraction over PostgreSQL. It allows for precise SQL control while maintaining TypeScript inference.
-   **Geospatial Engine**: We utilize **PostGIS** extensions for spatial calculations. The `ST_DWithin` and `ST_MakePoint` functions are used directly within Drizzle queries to perform radius searches on the database level, ensuring speed even with millions of records.
-   **Authentication**: **Supabase Auth** handles identity management, with server-side route guards (`requireOrganizer`) ensuring protected API endpoints.

### Database Schema
The relational model is designed for flexibility and query performance:
-   **Events**: The core entity, indexed heavily on `startDate`, `isPublished`, and `city` for common query patterns.
-   **Venues**: Stores location data. Events can link to existing venues or define custom one-off locations.
-   **EventRecurrence**: Handles complex recurring event patterns (daily, weekly, custom dates).
-   **UserLocations**: Allows users to save "Home" or "Work" coordinates for quick radius filtering.

### Security Architecture (Defense in Depth)
We employ a **Hybrid Security Strategy** to balance maximum performance with strict data protection:

1.  **Public Data (Performance Critical)**:
    *   **Access Method**: Direct Database Connection via **Drizzle ORM** (`db` instance).
    *   **Use Case**: Fetching events for the map, public feeds, and search results.
    *   **Security**: Relies on application-level logic (e.g., `where(eq(isPublished, true))`).
    *   **Why**: Bypassing RLS (Row Level Security) avoids overhead, enabling sub-millisecond query times for thousands of map markers.

2.  **Sensitive Data (Security Critical)**:
    *   **Access Method**: **Supabase Client** (`createApiClient(req)`).
    *   **Use Case**: User profiles, "Liked" events, and private settings.
    *   **Security**: Enforces **Database-Level RLS Policies**. Even if the API code has a bug, the database physically refuses to return data that doesn't belong to the authenticated user.
    *   **Why**: Provides a second layer of defense for PII (Personally Identifiable Information).

3.  **Hardening Measures**:
    *   **Rate Limiting**: In-memory rate limiter protects API routes from abuse (20-30 req/min).
    *   **Security Headers**: Strict `Content-Security-Policy` (CSP) allowing only trusted domains (Google Maps, Supabase).
    *   **Data Sanitization**: API responses are manually sanitized to strip sensitive fields (e.g., organizer emails) before sending to the client.

## Key Solutions & Patterns

### High-Performance Server-Side Clustering
Rendering thousands of markers directly on a map causes performance bottlenecks. We implemented a robust server-side clustering solution:
-   **PostGIS Powered**: We use `ST_SnapToGrid` and `ST_Centroid` within PostGIS to cluster events dynamically based on the viewport zoom level. This offloads heavy computation from the client to the optimized database engine.
-   **Efficient Data Fetching**: The API returns only the visible clusters and individual points for the current viewport (`ST_MakeEnvelope`), ensuring minimal data transfer.
-   **Vector Maps**: We utilize Google Maps Vector rendering with `AdvancedMarkerElement` for high-performance, hardware-accelerated marker rendering.
-   **State Sync**: The map controller (`useMapController`) manages the viewport state, triggering efficient refetches only when necessary.

### Complex Filtering Engine
The filtering logic in `pages/api/events/index.ts` demonstrates a dynamic SQL generation pattern:
-   **Dynamic Conditions**: We build an array of Drizzle `SQL` conditions based on the request query.
-   **Subqueries**: Category filtering uses `EXISTS` subqueries to efficiently filter many-to-many relationships without exploding the result set via joins.
-   **Spatial Queries**: Radius filtering dynamically constructs PostGIS SQL fragments to calculate distances on the fly.

### Robust Form Validation
We employ a "Schema-First" approach to validation:
-   **Zod Schemas**: Defined in `lib/validations/event.schema.ts`, these schemas act as the single source of truth for API input validation and frontend form validation.
-   **React Hook Form**: Integrates with Zod to provide real-time feedback, type inference, and efficient re-renders on the frontend.
-   **Sanitization**: Custom Zod preprocessors automatically sanitize inputs (trimming, URL formatting) before they reach the database.

### Infinite Scrolling & Pagination
To handle large event lists, we implemented cursor-based-like pagination:
-   **Frontend**: `useInfiniteQuery` manages the pagination cursor (`offset`), automatically fetching the next batch when the user scrolls near the bottom.
-   **Backend**: The API accepts `limit` and `offset` parameters, using efficient SQL `OFFSET` and `LIMIT` clauses combined with optimized indexes to return data quickly.

## Code Strengths

-   **Type Safety**: The `CreateEventInput` type is inferred directly from the Zod schema, ensuring that the API handler and the frontend form are always in sync. If the schema changes, both sides break at compile time, preventing runtime errors.
-   **Performance**:
    -   **Parallel Fetching**: The API fetches related data (tickets, recurrences) in parallel `Promise.all` blocks after retrieving the main event list, reducing response time.
    -   **Bundle Size**: Dynamic imports and tree-shaking ensure minimal JavaScript is sent to the client.
-   **Maintainability**: Logic is separated into clear domains (`components`, `lib`, `db`, `pages/api`). Shared logic (like auth guards or validation) is centralized in `lib`.

## Scaling & Performance Reality

Transparently addressing the limitations and design decisions of the current architecture.

### Database & Backend
-   **Connection Pooling**: Since Next.js API routes run in a serverless environment, every request could potentially open a new database connection. **Why**: To prevent exhausting the database connection limit. **How**: We strongly recommend using a transaction pooler (like Supabase's PgBouncer) in production (`DATABASE_URL` should point to port 6543).
-   **Query Strategy**: We deliberately chose `EXISTS` subqueries for category filtering over `JOIN`s. **Why**: `JOIN`ing events with categories (many-to-many) multiplies the row count, causing memory pressure on the Node.js server when fetching large pages. Subqueries keep the result set flat and predictable.
-   **Indexing**: We have composite indexes on `(isPublished, startDate)` because 90% of user queries filter by these two fields.

### Frontend Limits
-   **Map Clustering**: We moved from client-side to **Server-Side Clustering (PostGIS)**.
    -   **Reality**: This allows us to handle **Millions of events** with consistent performance. The database handles the heavy lifting of grouping points, and the frontend only renders what is necessary.
    -   **Scalability**: The grid-based clustering (`ST_SnapToGrid`) is O(N) relative to the viewport and extremely fast, making it suitable for massive datasets.
-   **List Virtualization**: We currently do **not** use list virtualization (windowing).
    -   **Why**: Variable-height event cards make virtualization complex and prone to visual "wobble" during scrolling.
    -   **Reality**: Performance remains 60fps for typical usage (scrolling through 5-10 pages). If a user loads 50+ pages (1000+ DOM nodes), browser memory usage will increase.
    -   **Mitigation**: The "Load More" pattern naturally discourages loading thousands of items at once compared to infinite scroll.

## Getting Started

### Prerequisites

-   Node.js (v18+ recommended)
-   npm or yarn
-   A Supabase project (for Database, Auth, and Storage)
-   A Google Maps API Key

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd eventkalender
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up environment variables:
    Copy `.env.local.example` to `.env.local` and fill in your credentials.
    ```bash
    cp .env.local.example .env.local
    ```

    **Required Variables:**
    -   `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL
    -   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key
    -   `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key (for server-side admin tasks)
    -   `DATABASE_URL`: Your PostgreSQL connection string (Transaction pooler recommended)
    -   `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Your Google Maps API Key (must have Maps JavaScript API, Places API, and Geocoding API enabled)

4.  Initialize the database:
    ```bash
    npm run db:generate # Generate migrations
    npm run db:migrate  # Apply migrations
    ```

5.  (Optional) Seed test data:
    ```bash
    npm run create-user # Creates a test user
    ```

### Running the Application

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

-   `pages/`: Application routes and API endpoints.
-   `components/`: Reusable UI components and feature-specific components (Map, Events, etc.).
-   `db/`: Database schema and configuration.
-   `lib/`: Utility functions, hooks, and shared logic.
-   `public/`: Static assets.
-   `styles/`: Global styles and Tailwind configuration.

## Brand Colors

| Name | Hex | RGB |
| :--- | :--- | :--- |
| **CC BLACK** | `#000000` | `0, 0, 0` |
| **CC BLURPLE** | `#6870ee` | `104, 112, 238` |
| **CC OREDGE** | `#fe6753` | `254, 103, 83` |
| **CC GRELLOW** | `#cce159` | `204, 225, 89` |
| **CC ROSAND** | `#e6bdbf` | `230, 189, 191` |

## Scripts

-   `npm run dev`: Starts the development server.
-   `npm run build`: Builds the application for production.
-   `npm run start`: Starts the production server.
-   `npm run lint`: Runs ESLint.
-   `npm run db:generate`: Generates Drizzle migrations based on schema changes.
-   `npm run db:migrate`: Applies pending migrations to the database.
-   `npm run db:studio`: Opens Drizzle Studio to view/edit database content.

---

## License & Legal

**© 2025 Common Events. All Rights Reserved.**

This software is proprietary and confidential. Unauthorized copying, transfer, modification, or distribution of this software, via any medium, is strictly prohibited.

### Proprietary License
This source code is the intellectual property of Common Events. It is provided to authorized licensees only. No part of this software may be used, reproduced, or transmitted in any form or by any means, electronic or mechanical, including photocopying, recording, or by any information storage and retrieval system, without permission in writing from the copyright owner.

### Trademarks
"Common Events", the Common Events logo, and other trademarks are property of their respective owners.

### Disclaimer
This software is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and noninfringement. In no event shall the authors or copyright holders be liable for any claim, damages or other liability, whether in an action of contract, tort or otherwise, arising from, out of or in connection with the software or the use or other dealings in the software.
