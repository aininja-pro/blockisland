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
- **Deploy:** Render — API: `https://blockisland-api.onrender.com` | Admin: `https://blockisland-admin.onrender.com` (custom domain: `listings.theblockislandapp.com`)
- **Repo:** https://github.com/theblockislandapp-bi/listings (client) | https://github.com/aininja-pro/blockisland (dev)

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

**Completed (March 29, 2026) — Listing Analytics + Click Tracking + Admin Settings:**

13. **Listing page view tracking** — 1x1 transparent PNG tracking pixel injected into ALL listing content HTML:
    - Express route: `GET /api/track/view?listing_id={UUID}` — fire-and-forget insert to `listing_events` table, returns 68-byte transparent PNG with no-cache headers
    - Pixel appended at the end of content HTML in `transformToGoodBarber()` (in `src/api/feed.js`)
    - Tracks every listing detail page open in the GoodBarber app (from any path — ads, browsing, favorites)
    - API base URL from `process.env.API_BASE_URL` with fallback to `https://blockisland.onrender.com`

14. **CTA click tracking via redirect** — External `<a href>` links in listing content rewritten to route through tracking:
    - Express route: `GET /api/track/click?listing_id={UUID}&url={encoded}` — fire-and-forget insert, then 302 redirect to destination
    - Regex rewrites `href` values starting with `http://` or `https://` to tracking redirect URLs
    - CTA rewriting applied BEFORE hero image div wrapping (so hero `<a href>` to image URL is never rewritten)
    - Tracking pixel appended AFTER rewriting (so pixel `<img src>` is never caught by regex)
    - Security: validates URL starts with `http(s)://`, rejects open redirect attacks, fallback to `https://m.theblockislandapp.com`
    - DB inserts never block the image response or redirect (fire-and-forget pattern)

15. **Listing Analytics admin UI** — New "Listing Analytics" tab on the Advertising page:
    - Sortable table: Listing, Category, Status (Premium badge / Basic), Views, CTA Clicks
    - Default sort: premium first, then by category, then by name (matches feed sort order)
    - Only shows listings with category assignments (filters out old orphaned listings with no categories)
    - Category dropdown filter + Premium/Basic status filter
    - Time period filter: 7d, 30d, 90d, All time, Custom date range
    - CSV export with filename `listing-analytics-{start}-to-{end}.csv`
    - Summary line: "Showing X listings (Y premium, Z basic) — N views, N clicks"
    - Query in `admin/src/lib/queries/analytics.ts`, resolves parent section name for subcategory-only listings

16. **Admin Settings page** — New `/settings` route in admin sidebar:
    - **Feed URLs table**: read-only list of all sections with their feed URLs, copy-to-clipboard button per row
    - **Rotation Frequency control**: preset buttons (4h, 8h, 12h, 24h) to set premium listing rotation interval
    - Rotation interval stored in new `settings` table (key-value: `rotation_hours`)
    - Rotation service (`src/services/rotation.js`) reads `rotation_hours` from DB instead of hardcoded daily check — now compares elapsed hours vs configured interval

17. **Database additions:**
    - `listing_events` table: `id`, `listing_id` (FK → listings, CASCADE), `event_type` ('view'/'click'), `destination_url` (nullable), `created_at`. Three indexes including composite `(listing_id, event_type, created_at)`. RLS: anon INSERT, authenticated SELECT.
    - `settings` table: `key` (PK), `value`. Seeded with `rotation_hours = 24`. RLS: authenticated SELECT + UPDATE.
    - Migration file: `src/db/migration-listing-analytics.sql`

**Completed (April 1, 2026) — Client Infrastructure Transfer:**

18. **GitHub + Render transfer** — Pushed codebase to client's GitHub (`theblockislandapp-bi/listings`). Both remotes maintained: `origin` (dev) and `client` (production).

19. **Supabase transfer** — Transferred Supabase project from dev org to client org ("The Block Island App"). All data, keys, and URLs preserved — no env var changes needed.

20. **Render deployment** — Two services on client's Render account:
    - **API** (`blockisland-api`): Express, serves GoodBarber feeds + tracking
    - **Admin** (`blockisland-admin`): Next.js, staff dashboard with custom domain `listings.theblockislandapp.com`

21. **Database migration** — Created `full-schema-migration.sql` with all tables, indexes, RLS policies. Events table RLS policies added separately. Import scripts generated for CSV-to-SQL data migration.

22. **Events import** — 3,544 events imported from new GoodBarber JSON export (`docs/agenda/`) using `--reset` flag to replace all existing events.

**Completed (April 1-2, 2026) — Feed & Sorting Fixes:**

23. **Sort whitespace fix** — Listing names with leading spaces (e.g. " Virginica Pizza") sorted incorrectly. Added `.trim()` to all `localeCompare` calls in `feed.js` and `listing.js`.

24. **Subcategory feed filter** — Feed now supports `?section=X&subcategory=Y` to return only listings in a specific subcategory. Used for GoodBarber section filter tabs.

25. **Multi-subcategory support** — Listings can belong to multiple subcategories (e.g. Fine Dining + Seafood + American). Fixed `getListingsForSection()` to track all subcategory assignments per listing instead of only keeping the last one. Feed `categories` array now includes all subcategories.

26. **Settings subcategory URLs** — Settings page now shows expandable sections with subcategory filter URLs. Click chevron to reveal subcategory rows with copy-to-clipboard URLs for GoodBarber filter setup.

27. **Events feed date fix** — `getUpcoming()` was comparing `start_date` against exact current timestamp, excluding events that started earlier today. Changed to compare against date-only (`YYYY-MM-DD`) to include all of today's events.

**Completed (April 2-3, 2026) — Admin Features:**

28. **User management page** — New `/users` route in admin sidebar:
    - User table: Email, Created, Last Sign In, Delete button
    - Add User dialog: email + password, creates via Supabase Auth Admin API (`createAdminClient()`)
    - Change Password dialog: users change their own password
    - Self-deletion prevention
    - Uses `SUPABASE_SERVICE_ROLE_KEY` for admin operations

29. **Reset Stats for ads** — "Reset Stats" option in ad 3-dot menu. Deletes `ad_events` rows for that ad, zeroing out impressions/clicks/CTR. Requires `DELETE` RLS policy on `ad_events` for authenticated role.

30. **Clickable listing rows** — Clicking anywhere on a listing row opens the edit modal. Interactive elements (checkboxes, toggles, date inputs, 3-dot menu) excluded via `closest()` check.

31. **Chamber link fix** — SQL update replaced 348 listings' broken GoodBarber internal link (`/community-places/i/24039402/...`) with `https://www.blockislandchamber.com/`.

32. **Ad widget responsive CSS** — Middle block widget updated with media query: mobile uses `object-fit: cover` at 180px height, PWA (>=768px) constrains to `max-width: 750px` with `height: auto`. Zone height set to 195px in GoodBarber.

**Known Issues:**
- Some listings have empty legacy `category` text column — category resolved from junction table at query time
- GoodBarber strips `<script>` from content field — no JS execution in listing detail view
- GoodBarber Custom Code Widget zone height is fixed per platform — can't set different heights for mobile vs PWA. Current 195px is a compromise.
- Ad widget HTML files must be manually copy-pasted into GoodBarber when updated — not auto-deployed

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
| Mar 29, 2026 | Listing analytics + click tracking + admin settings. Tracking pixel in all listing content. CTA link rewriting via redirect. Admin analytics tab with filters. Settings page with feed URLs + rotation frequency. Deployed to Render. | Verify tracking data populates in GoodBarber app; Phase 3 scoping | CTA rewriting applied before hero div wrapping to avoid rewriting image links; `listing_events` and `settings` tables created; rotation service now reads configurable hours from DB |
| Mar 29, 2026 | Admin UI polish: renamed sidebar title to "The Block Island App" in black pill header, removed Import nav item, added Settings nav item, logo.png in admin/public for future use. | Get higher-res logo PNG for sidebar | Small logo was too low-res to use inline; parked in public/ for when a bigger version is available |
| Apr 1, 2026 | Transferred GitHub, Supabase, and Render to client. Two Render services (API + Admin). Full DB migration. Events import (3,544 events). Gitignore cleanup. | Subcategory filters, events feed fixes | Supabase transfer via project transfer (not data migration). Render doesn't support service transfers. |
| Apr 2, 2026 | Subcategory feed filter (`?subcategory=X`). Multi-subcategory fix. Settings subcategory URLs. Events feed date fix (today's events excluded). Sort whitespace fix. | User management, ad reset stats | Listings with multiple subcategories only kept last one — fixed to track all. `getUpcoming()` compared exact timestamp not date. |
| Apr 3, 2026 | User management page (CRUD via Auth Admin API). Ad reset stats. Clickable listing rows. Chamber link SQL fix (348 listings). Ad widget responsive CSS for PWA. | GoodBarber section filter setup, ad optimization | Zone height 195px is PWA/mobile compromise. Widget HTML manually pasted into GoodBarber. |
| Apr 12, 2026 | Event feed timezone fix: rewrite stored `+00:00` offset to America/New_York (DST-aware) in `events-feed.js:formatEasternWallClock`. 5 PM entered in admin was rendering as 1 PM on EDT phones and 12 PM on CDT phones. Deployed to Render via push to `client`. Then appended `— 5:00 PM – 6:00 PM ET` to event title and prepended as bold line in content (`formatEtTimeRange`) so ET time is always visible regardless of device TZ. | Monitor Austin's confirmation | GoodBarber always converts event `date`/`endDate` to phone's local TZ — can't force ET display from feed side; title/content text is the override. Slug still uses raw title so deep links unaffected. All-day events skip the label. |

*Update this at the end of every session so the next session picks up with full context.*

---

## Architecture Notes

- **Two servers, two Render services:** Express (`/src`) serves GoodBarber feeds at `blockisland-api.onrender.com`. Next.js (`/admin`) serves the admin UI at `blockisland-admin.onrender.com` (custom domain: `listings.theblockislandapp.com`). Both deploy from client's GitHub (`theblockislandapp-bi/listings`). They share the same Supabase instance.
- **Two git remotes:** `origin` = `aininja-pro/blockisland` (dev), `client` = `theblockislandapp-bi/listings` (production). Push to both on every commit.
- **Feed pattern:** GoodBarber pulls from `https://blockisland-api.onrender.com/api/feed/maps?section=X`. Supports `&subcategory=Y` for section filter tabs. Switching a section's source in GoodBarber from internal CMS to the custom URL is non-destructive and reversible.
- **Premium sort:** Listings are returned pre-sorted by the feed endpoint — premium first, then basic. Rotation happens server-side on a schedule.
- **Fragile:** The GoodBarber feed JSON shape is rigid. The `isFeatured` field controls hero image display. Synthetic dates control sort order. Any change to feed output needs to be tested in the app before going live.
- **Auth:** Supabase Auth protects all admin routes via middleware (`admin/src/middleware.ts`).
- **Categories:** Hierarchical — sections (parent_id = null) contain subcategories. Listings link to categories via `listing_categories` junction table. Events use a simple `category` text field (no junction).
- **Ads:** Three independent slots served via `GET /api/ads/serve?slot=X`. Round-robin rotation uses `last_served_at` (oldest served first). Each GoodBarber Custom Code Widget fetches its own slot. Impressions/clicks logged to `ad_events` table via fire-and-forget `sendBeacon`. Widget HTML files live in `/widgets/` and are copy-pasted into GoodBarber. Types shared between server and client components must go in `ad-types.ts` (not `ads.ts`) to avoid pulling `next/headers` into the client bundle.
- **Ad internal links:** Ads have a `link_type` field (`external` or `internal`). Internal links use `linked_listing_id` FK → `listings`. At save time, the server action constructs the PWA URL from the section's `pwa_slug` (stored on `categories` table) + listing UUID + slugified name. The `destination_url` column stores the final URL regardless of link type, so the Express serve endpoint and widget HTML need no changes. If a linked listing is deleted, the FK is SET NULL and the ad table shows a warning.
- **Listing tracking:** Every listing's content HTML includes a 1x1 tracking pixel (`/api/track/view`) and CTA links rewritten through `/api/track/click`. Both use fire-and-forget DB inserts (never block response). Pixel injection and CTA rewriting happen in `transformToGoodBarber()` in `src/api/feed.js`. CTA rewriting runs BEFORE hero div wrapping (critical — prevents hero image `<a>` from being rewritten). Events logged to `listing_events` table.
- **Settings:** Key-value `settings` table stores `rotation_hours`. Rotation service reads this instead of hardcoded daily interval. Admin Settings page at `/settings` shows feed URLs (with expandable subcategory filter URLs) + rotation frequency control.
- **User management:** Admin `/users` page uses `createAdminClient()` (service role key) for Supabase Auth Admin API operations (create/delete users). Users change their own password via regular authenticated session. Self-deletion prevented.
- **Subcategory filtering:** Listings can belong to multiple subcategories. `getListingsForSection()` tracks all subcategory assignments per listing in `subcategory_names` array. Feed `categories` field includes all subcategories. `?subcategory=X` filter checks the array.
- **Events feed:** `getUpcoming()` filters `start_date >= today` (date only, not timestamp) to include all of today's events. `autoDraftPastEventsAction()` sets `is_published = false` for events with `end_date < today` on admin page load.
- **Event timezones:** Events have a three-stage TZ model. Admin `<input type="datetime-local">` emits a naive wall-clock string that Supabase stores in TIMESTAMPTZ with a `+00:00` label (the hour is right, the zone label is wrong). Admin display reads back with `timeZone: 'UTC'` so it looks correct. Feed `formatEasternWallClock()` in `events-feed.js` rewrites the offset to `-04:00`/`-05:00` (DST-aware via `Intl.DateTimeFormat` longOffset) so GoodBarber renders BI wall-clock time. GoodBarber always converts to phone-local TZ — users outside ET see shifted times (expected calendar behavior).