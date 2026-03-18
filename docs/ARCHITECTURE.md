# Architecture

## Overview

Block Island is a content management system for a GoodBarber mobile app serving Block Island, RI. It has three main components:

1. **Express API** (`src/`) — Serves JSON feeds consumed by GoodBarber
2. **Next.js Admin** (`admin/`) — Staff dashboard for managing content
3. **Supabase** — PostgreSQL database + auth

## Express API (port 3000)

- `src/index.js` — Entry point, mounts routes
- `src/api/feed.js` — Map listing feeds for GoodBarber (`/api/feed/maps?section=X`)
- `src/api/events-feed.js` — Events feed stub (`/api/feed/events`) — pending GoodBarber schema
- `src/api/ads.js` — Advertising endpoints
- `src/models/listing.js` — Listing CRUD + section/category queries
- `src/models/event.js` — Event CRUD (getAll, getById, getUpcoming, create, update, delete)
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
- `/advertising` — Ad management

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
- `supabase/server.ts` — Server-side Supabase client

## Database (Supabase)

### Tables
- **listings** — Business/place listings with location data, premium tier, rotation
- **events** — Events with dates, location, category (simple text), publish status
- **categories** — Hierarchical categories (sections + subcategories via `parent_id`)
- **listing_categories** — Junction table linking listings to categories

### Key relationships
- Listings link to categories via `listing_categories` junction table
- Categories are hierarchical: sections (parent_id = null) contain subcategories
- Events use a simple `category` text field (no junction table)

## GoodBarber Integration

- Feed endpoint serves JSON in GoodBarber's custom feed format
- 24 map sections, each with its own feed URL
- Events feed endpoint is stubbed (awaiting GoodBarber schema export)
- Key quirks: `isFeatured` field required for hero images, synthetic dates control sort order
