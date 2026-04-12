# Architecture

## Overview

Block Island is a content management system for a GoodBarber mobile app serving Block Island, RI. It has three main components:

1. **Express API** (`src/`) — Serves JSON feeds consumed by GoodBarber
2. **Next.js Admin** (`admin/`) — Staff dashboard for managing content
3. **Supabase** — PostgreSQL database + auth

## Express API (port 3000)

- `src/index.js` — Entry point, mounts routes
- `src/api/feed.js` — Map listing feeds for GoodBarber (`/api/feed/maps?section=X`)
- `src/api/events-feed.js` — Events feed (`/api/feed/events`), rewrites stored UTC offset to America/New_York (DST-aware) so GoodBarber renders Block Island wall-clock time
- `src/api/ads.js` — Advertising endpoints (`/serve?slot=X`, `/active`, `/:id/impression`, `/:id/click`)
- `src/models/listing.js` — Listing CRUD + section/category queries
- `src/models/event.js` — Event CRUD (getAll, getById, getUpcoming, create, update, delete)
- `src/models/ad.js` — Ad queries (getNextActiveAd with slot filter, logEvent)
- `src/services/rotation.js` — Daily premium listing rotation logic
- `src/db/supabase.js` — Supabase client

Deployed to Render at `https://blockisland.onrender.com`.

## Next.js Admin (port 3001)

### Pages (`admin/src/app/(protected)/`)
- `/dashboard` — Overview stats
- `/listings` — Manage business listings (CRUD, bulk delete, premium toggle)
- `/events` — Manage events (CRUD, bulk delete, publish/draft toggle)
- `/premium` — Premium member management
- `/categories` — Hierarchical category management
- `/import` — Data import tools
- `/advertising` — Ad management (grouped by slot: Top Banner, Middle Block, Bottom Block)

### Key patterns
- **Server components** fetch data, pass to client components
- **Server actions** (`actions.ts`) handle mutations with `revalidatePath`
- **React Hook Form + Zod** for form validation
- **BlockEditor** for rich content (text, photos, quotes, embeds)
- **TanStack Table** for data tables with sorting, filtering, pagination

### Data layer (`admin/src/lib/`)
- `queries/listings.ts` — Listing queries
- `queries/events.ts` — Event queries
- `queries/categories.ts` — Hierarchical category queries
- `queries/ads.ts` — Ad queries (server-side, imports Supabase client)
- `queries/ad-types.ts` — Ad types and constants (shared by server + client components)
- `supabase/server.ts` — Server-side Supabase client

## Database (Supabase)

### Tables
- **listings** — Business/place listings with location data, premium tier, rotation
- **events** — Events with dates, location, category (simple text), publish status
- **categories** — Hierarchical categories (sections + subcategories via `parent_id`)
- **listing_categories** — Junction table linking listings to categories
- **ads** — Ad banners with slot (`top_banner`, `middle_block`, `bottom_block`), scheduling, rotation tracking
- **ad_events** — Impression and click tracking for ads

### Key relationships
- Listings link to categories via `listing_categories` junction table
- Categories are hierarchical: sections (parent_id = null) contain subcategories
- Events use a simple `category` text field (no junction table)

## GoodBarber Integration

- Feed endpoint serves JSON in GoodBarber's custom feed format
- 24 map sections, each with its own feed URL
- Events feed at `/api/feed/events` returns upcoming published events, sorted by synthetic `sortDate` (1 minute apart) for display order
- Key quirks: `isFeatured` field required for hero images, synthetic dates control sort order

### Event time / timezone handling

Events have a subtle timezone model worth understanding before touching date code:

- **Admin input** uses `<input type="datetime-local">` which emits a naive wall-clock string (`"2026-04-15T17:00"`). This lands in a Supabase `TIMESTAMPTZ` column and gets labeled `+00:00` — so the wall-clock hour the user typed is preserved, but the timezone label is *wrong* (UTC rather than Eastern).
- **Admin display** (`columns.tsx`, `event-form.tsx:toInputValue`) reads it back using `timeZone: 'UTC'` / `getUTC*` methods, so the original hour round-trips correctly.
- **Feed output** (`events-feed.js:formatEasternWallClock`) rewrites the offset to America/New_York (EDT `-04:00` / EST `-05:00`, DST-aware via `Intl.DateTimeFormat` `longOffset`). The wall-clock hour stays the same; only the offset label changes. This makes GoodBarber render 5 PM as 5 PM for Block Island users.
- **GoodBarber always converts to the phone's local timezone** for event `date`/`endDate`. Users outside ET will see shifted times — that's standard calendar-app behavior and cannot be overridden from the feed side. If a "display as ET regardless of device TZ" requirement comes up, it has to be done as literal text in the title/description.

## Advertising System

- Three ad slots on the GoodBarber home page, each an independent Custom Code Widget
- `GET /api/ads/serve?slot=X` returns one ad per slot via round-robin (`last_served_at` ascending)
- Widget HTML files in `/widgets/` — each fetches its slot, renders image, fires impression/click beacons
- GoodBarber zone heights: Top Banner 60-70px, Middle Block 180px, Bottom Block 180px
- Admin page groups ads by slot in three Card sections
- Auto-deactivation on page load for ads past their end date
- RLS: `ads` table requires public UPDATE policy for the Express anon key to update `last_served_at`
