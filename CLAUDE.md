# CLAUDE.md
# Block Island Community Directory App

A GoodBarber-powered community directory for Block Island, RI — managed through a custom admin dashboard that controls listings, events, premium tiers, and advertising.

**Client:** Rob Lucier | **Phase:** Foundry (active build) | **Started:** January 2026

---

## Tool Ladder Check

This project runs at **Level 3 — VS Code + Claude Code**

Full workspace access required. Next.js admin + Express API + Supabase schema all need to be touched.

---

## Tech Stack

- **Admin Frontend:** Next.js 15 + React 18 + TypeScript + Tailwind CSS + shadcn/ui
- **Feed API:** Node.js + Express (serves JSON feeds to GoodBarber)
- **Database:** PostgreSQL via Supabase
- **Auth:** Supabase Auth
- **Deploy:** Render (`https://blockisland.onrender.com`)
- **Repo:** https://github.com/aininja-pro/blockisland

---

## Repo Structure
```
/admin          → Next.js admin dashboard (staff-facing UI)
  /src/app      → Pages and server actions
  /src/components → UI components by domain
  /src/lib      → Queries, Supabase client, utilities
/src            → Express API (GoodBarber feed endpoints)
  /api          → Route handlers (feed, events-feed, ads)
  /models       → DB queries (listings, events, ads)
  /services     → Business logic (rotation)
  /db           → Supabase client
/widgets        → GoodBarber Custom Code Widget HTML files (3 ad slots)
/docs           → Architecture, setup guides, GoodBarber integration notes
/scripts        → One-off utility scripts
```

**Template mapping note:** `/docs` = template's `/planning` intent for architecture.
No `/ops` folder yet — deploy runbooks live in `/docs` for now.

---

## Routing (What to read before touching what)

| Task | Go to | Read first |
|------|-------|------------|
| Admin UI changes | `/admin/src/` | `docs/ARCHITECTURE.md` |
| Feed/API changes | `/src/api/` | `docs/ARCHITECTURE.md` + `docs/GOODBARBER-SETUP.md` |
| DB schema changes | Supabase dashboard + queries | `docs/ARCHITECTURE.md` |
| GoodBarber integration | `/docs/GOODBARBER-FEED-URLS.md` | `docs/GOODBARBER-SETUP.md` |
| Architecture decisions | `/docs/` | `docs/SYSTEM-OVERVIEW.md` |

---

## Commands

| Action | Command |
|--------|---------|
| Admin dev server | `cd admin && npm run dev` |
| Feed API dev server | `node src/index.js` |
| Install admin deps | `cd admin && npm install` |
| Install root deps | `npm install` |

---

## Working Mode

**Current mode: Directed**

Ray tells Claude Code exactly what to build, file by file. Follow instructions precisely. Do not add features, refactor patterns, or make "improvements" not specified in the blueprint. Ask before deviating.

---

## Conventions

- Functional React components only. No class components.
- Server components fetch data and pass to client components via props.
- Mutations go through Next.js server actions (`actions.ts`) with `revalidatePath`.
- No raw SQL in route handlers. Queries go through `/lib/queries/` (admin) or `/models/` (Express).
- Forms use React Hook Form + Zod validation.
- Tables use TanStack Table with sorting, filtering, pagination.
- GoodBarber feeds must return valid JSON in GoodBarber's custom feed format — see `docs/GOODBARBER-SETUP.md` before touching feed endpoints.
- Commits: conventional commits (`feat:`, `fix:`, `docs:`, `chore:`)

---

## Avoid

- Do not speculate about code you haven't opened. Read the file first.
- Do not hardcode environment variables. Use `.env.local` (admin) or `process.env` (Express).
- Do not modify the GoodBarber feed JSON shape without checking `docs/GOODBARBER-SETUP.md` — breaking the feed breaks the live app.
- Do not add npm dependencies without checking if an existing one covers the need.
- Do not write code not specified in the blueprint without asking first.
- Do not make large, sweeping changes. Every change should touch as little code as possible.

---

## Current State

**Working:**
- Admin dashboard fully functional: listings, events, categories, premium toggle, subscription date, renewal warnings
- GoodBarber custom feed integration tested and live (switchable per section)
- Premium tier system: premium listings sort above basic, auto-rotation on configurable schedule
- Ferries section fully integrated
- Advertising system fully functional: 3-slot ad management, GoodBarber widget integration live
- **Stable UUIDs in feed** — GoodBarber item IDs are now Supabase row UUIDs (not synthetic integers), enabling deep linking. Confirmed GoodBarber sorts by `date` field, not `id`.

**Completed (March 26, 2026) — 5 polish fixes from Rob call:**
1. Clone/duplicate for events and listings — 3-dot menu "Duplicate" option, clones all fields + category assignments, strips `goodbarber_id` to avoid unique constraint violations, both listings and events use `"Name (Copy)"` suffix to sort adjacent to original
2. Hide subscription date on non-premium listings — cell returns null when `is_premium` is false
3. Auto-draft past events — `autoDraftPastEventsAction()` runs server-side on every events page load, sets `is_published = false` for events with `end_date < today`
4. Category filter bug fixed — `DataTable` now reads `?category=` URL param via `useSearchParams` + lazy `useState` initializer to seed filter on mount (required `Suspense` boundary in listings page)
5. Sections page compact table — replaced card grid with HTML `<table>` layout

**Completed (March 26, 2026) — Admin UI polish:**

6. **Sections/Categories page redesign** — Full category management with shadcn Table in Card:
   - Expandable rows: click chevron to show subcategories with per-subcategory listing/premium counts
   - Inline rename: double-click any section or subcategory name to edit in-place
   - Full CRUD: add/rename/delete sections and subcategories via 3-dot menu
   - Sortable columns (Section, Listings, Premium), footer totals
   - All category mutations use `createAdminClient()` (service role key) to bypass Supabase RLS
   - Deleting a section/subcategory cleans up `listing_categories` junction rows first

7. **Premium Members page redesign** — Replaced bubbly card grid with compact sortable table:
   - Single flat table: Category, Listing, Position (yellow badge for #1), Subscription Date, Toggle
   - Sortable by any column, "Add Premium Member" select dropdown to pick category then listing
   - Fixed timezone bug: dates parsed with `T00:00:00` suffix to prevent UTC→local day shift
   - Resolves category from `listing_categories` junction table when legacy `category` column is empty
   - `togglePremiumAction` now auto-sets `subscription_date` when adding to premium

**Completed (March 26, 2026) — Phase 2: Ad Management System:**

8. **Ad slot system** — Three independent ad slots for GoodBarber home page:
   - Slots: `top_banner` (60px, 750x120), `middle_block` (180px, 750x360), `bottom_block` (180px, 750x360)
   - DB: `ads` table with `slot` column, `ad_events` table for impression/click tracking
   - Express API: `GET /api/ads/serve?slot=X` with per-slot round-robin rotation via `last_served_at`
   - Legacy `GET /api/ads/active` preserved for backward compatibility
   - Admin: Advertising page grouped by slot (three Card sections), each with its own table and "Add Ad" button
   - Full CRUD: create, edit, duplicate ("Title (Copy)" suffix, inactive by default), delete
   - Image upload via existing `/api/upload` → Supabase Storage
   - Dynamic image size helper text based on selected slot
   - Schedule toggle: "Run Always" or custom start/end date range
   - Auto-deactivation: `deactivateExpiredAdsAction()` runs on page load, flips `is_active = false` for ads past `end_date`
   - Last Served column with relative time display ("Just now", "2m ago", etc.)
   - Impressions, clicks, CTR columns with live stats from `ad_events`
   - Sorting: active ads first, then by newest
   - Widget HTML files in `/widgets/` — three standalone files pasted into GoodBarber Custom Code Widgets
   - RLS: required `UPDATE` policy on `ads` table for anon role (Express API uses anon key)
   - Client components import types from `ad-types.ts` (not `ads.ts`) to avoid server-only `next/headers` in client bundle

**Completed (March 29, 2026) — Feed & Admin Improvements:**

9. **Subscription renewal warning badges** — Subscription column in admin listings table now shows:
   - Red "Expired" badge when renewal date (subscription_date + 1 year) has passed
   - Orange "Xd" badge when within 30 days of renewal
   - "Due Soon" filter dropdown in toolbar to show only flagged listings

10. **Stable feed IDs** — Switched GoodBarber feed `id` from synthetic descending integers (90000000, 89999999...) to stable Supabase UUIDs. Confirmed GoodBarber now sorts by `date` field (after GoodBarber Support fix). Enables future deep linking from ad widgets into specific listings.

11. **JS test in content field** — Tested whether GoodBarber executes JavaScript in listing `content` HTML. Result: **No** — `<script>` tags are stripped. Click tracking for CTA buttons will need redirect-based approach (not JS).

**Completed (March 29, 2026) — Ad Internal/External Link Types:**

12. **Internal ad links** — Ads can now link to internal listings within the GoodBarber PWA:
   - DB: `link_type` (text, default 'external') and `linked_listing_id` (FK → listings) columns on `ads` table
   - DB: `pwa_slug` column on `categories` table — stores the actual GoodBarber PWA section slug (e.g., `ferries-1`, `inns`, `page-bbs`). Slugs are arbitrary and set by GoodBarber, NOT derivable from section names.
   - Admin form: radio toggle for External URL / Internal Listing
   - Internal flow: pick a category (section) → searchable listing picker with type-to-filter → URL preview
   - Selected listing shows as a compact chip with "Change" button to re-pick
   - URL construction at save time: `https://m.theblockislandapp.com/{pwa_slug}/i/{uuid}/{slugified-name}`
   - Listing slug is cosmetic — GoodBarber routes by UUID only (verified: wrong slugs still resolve)
   - Ad table shows external link icon, blue link icon for internal, amber "Deleted" warning if linked listing removed
   - Duplicate copies `link_type` and `linked_listing_id`
   - Switching from Internal → External clears the destination URL field
   - Widget HTML and Express API unchanged — `destination_url` works the same regardless of link type
   - New queries: `getSectionsWithSlug()`, `getPublishedListingsBySection()`, `getListingsBySectionAction()`

**Known Issues:**
- Events feed endpoint is stubbed — awaiting GoodBarber schema export
- Some listings have empty legacy `category` text column — category resolved from junction table at query time
- GoodBarber strips `<script>` from content field — no JS execution in listing detail view

---

## Session Log

| Date | What was built | What's next | Notes |
|------|---------------|-------------|-------|
| Jan 26, 2026 | Project kicked off. SOW signed. | Stand up repo + admin scaffold | Phase 1: $2,500 |
| Feb 7, 2026 | Demo to Rob. Feed integration confirmed working. Ferries live. | 5 polish fixes + Phase 2 scoping | Rob happy with progress |
| Mar 2026 | Architecture review. CLAUDE.md created. | Blueprint for 5 fixes → Claude Code | Process formalized |
| Mar 26, 2026 | 5 polish fixes: clone, hide sub date, auto-draft, category filter, compact sections | Sections table UI polish + Phase 2 scoping | `goodbarber_id` unique constraint caught during testing; `useSearchParams` required Suspense boundary |
| Mar 26, 2026 | Sections page: full category management with expandable subcategories, inline edit, CRUD. Premium page: compact sortable table replacing card grid. | Phase 2 scoping | RLS bypass needed for category mutations; timezone bug on date display; legacy `category` column empty for some listings |
| Mar 26, 2026 | Phase 2: Ad slot system — 3 independent slots, serve endpoint, admin grouped by slot, widget HTML files, auto-deactivation, duplicate, impressions/clicks/CTR tracking. Deployed and live in GoodBarber. | Polish / Phase 3 scoping | RLS UPDATE policy needed for anon key; `ad-types.ts` split to avoid server import in client bundle; zone height 60-70px for top banner |
| Mar 29, 2026 | Subscription renewal badges (red/orange) + "Due Soon" filter. Stable UUIDs in feed (replaced synthetic IDs). Confirmed GoodBarber sorts by date. Tested JS in content field — stripped, no execution. | Deep linking from ad widgets; CTA click tracking via redirect | GoodBarber Support fixed sort behavior; `<script>` tags stripped from content field |
| Mar 29, 2026 | Ad internal/external link types — ads can link to internal PWA listings. Searchable listing picker, URL auto-construction from pwa_slug + UUID. Added pwa_slug column to categories (25 sections populated). | Polish / Phase 3 scoping | Section slugs in GoodBarber PWA are arbitrary (not derivable from names); listing slug is cosmetic (UUID does routing); Popover/Command had scroll issues inside Dialog — switched to inline search + radio list |

*Update this at the end of every session so the next session picks up with full context.*

---

## Architecture Notes

- **Two servers:** Express (`/src`) serves GoodBarber feeds. Next.js (`/admin`) serves the admin UI. They share the same Supabase instance.
- **Feed pattern:** GoodBarber pulls from `https://blockisland.onrender.com/api/feed/maps?section=X`. Switching a section's source in GoodBarber from internal CMS to the custom URL is non-destructive and reversible.
- **Premium sort:** Listings are returned pre-sorted by the feed endpoint — premium first, then basic. Rotation happens server-side on a schedule.
- **Fragile:** The GoodBarber feed JSON shape is rigid. The `isFeatured` field controls hero image display. Synthetic dates control sort order. Any change to feed output needs to be tested in the app before going live.
- **Auth:** Supabase Auth protects all admin routes via middleware (`admin/src/middleware.ts`).
- **Categories:** Hierarchical — sections (parent_id = null) contain subcategories. Listings link to categories via `listing_categories` junction table. Events use a simple `category` text field (no junction).
- **Ads:** Three independent slots served via `GET /api/ads/serve?slot=X`. Round-robin rotation uses `last_served_at` (oldest served first). Each GoodBarber Custom Code Widget fetches its own slot. Impressions/clicks logged to `ad_events` table via fire-and-forget `sendBeacon`. Widget HTML files live in `/widgets/` and are copy-pasted into GoodBarber. Types shared between server and client components must go in `ad-types.ts` (not `ads.ts`) to avoid pulling `next/headers` into the client bundle.
- **Ad internal links:** Ads have a `link_type` field (`external` or `internal`). Internal links use `linked_listing_id` FK → `listings`. At save time, the server action constructs the PWA URL from the section's `pwa_slug` (stored on `categories` table) + listing UUID + slugified name. The `destination_url` column stores the final URL regardless of link type, so the Express serve endpoint and widget HTML need no changes. If a linked listing is deleted, the FK is SET NULL and the ad table shows a warning.