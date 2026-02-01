# Block Island Premium Listing System - Technical Overview

This document provides technical documentation for developers maintaining the system.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         GoodBarber App                              │
│                    (Block Island Directory)                         │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  │ Custom Map Feed (JSON)
                                  │ GET /api/feed/maps
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Express API Server                           │
│                         (Port 3000)                                 │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  src/                                                       │    │
│  │  ├── index.js          # Express app entry                  │    │
│  │  ├── api/              # API routes                         │    │
│  │  │   └── feed.js       # /api/feed/maps endpoint           │    │
│  │  ├── models/           # Data access layer                  │    │
│  │  │   └── listing.js    # Listing CRUD + rotation queries   │    │
│  │  ├── services/         # Business logic                     │    │
│  │  │   └── rotation.js   # Daily rotation algorithm          │    │
│  │  └── db/               # Database connection                │    │
│  │       └── supabase.js  # Supabase client                   │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  │ Supabase Client
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Supabase (PostgreSQL)                          │
│                                                                     │
│  Table: listings                                                    │
│  ├── id (uuid, PK)                                                  │
│  ├── name, category, address, phone, email, website                │
│  ├── latitude, longitude (for map pins)                            │
│  ├── description, image_url                                        │
│  ├── is_premium (boolean)                                          │
│  ├── rotation_position (int) - position within category            │
│  ├── last_rotated_at (timestamp)                                   │
│  ├── goodbarber_id (for import mapping)                            │
│  └── created_at, updated_at                                        │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  │ Supabase SSR Auth
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Next.js Admin Interface                        │
│                         (Port 3001)                                 │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  admin/src/                                                 │    │
│  │  ├── app/                  # Next.js App Router            │    │
│  │  │   ├── login/            # Auth page                     │    │
│  │  │   └── (protected)/      # Auth-required routes          │    │
│  │  │       ├── dashboard/    # Stats overview                │    │
│  │  │       ├── listings/     # CRUD for listings             │    │
│  │  │       ├── premium/      # Premium management            │    │
│  │  │       └── categories/   # Category overview             │    │
│  │  ├── components/           # React components              │    │
│  │  ├── lib/                  # Utilities                     │    │
│  │  │   ├── supabase/         # Client/server/middleware      │    │
│  │  │   ├── actions/          # Server Actions                │    │
│  │  │   └── queries/          # Data fetching                 │    │
│  │  └── middleware.ts         # Auth middleware               │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

## Two Applications

### 1. Express API Server

**Purpose:** Serve JSON feed to GoodBarber

**Stack:**
- Node.js + Express 5
- Supabase JS client
- CORS enabled

**Key Endpoint:**
```
GET /api/feed/maps
GET /api/feed/maps?category=Restaurants
```

### 2. Next.js Admin Interface

**Purpose:** Web UI for Chamber staff to manage listings

**Stack:**
- Next.js 16 (App Router)
- React 19
- Supabase SSR for auth
- TanStack Table for data tables
- shadcn/ui components
- Tailwind CSS 4

**Key Patterns:**
- Server Components for data fetching
- Server Actions for mutations
- Supabase SSR client (client/server/middleware pattern)

---

## API Endpoint Documentation

### GET /api/feed/maps

Returns listings in GoodBarber Custom Map Feed format.

**Query Parameters:**
- `category` (optional) - Filter by category name

**Response Format:**
```json
{
  "items": [
    {
      "id": 12345,
      "title": "Business Name",
      "content": "Full description",
      "summary": "Truncated description...",
      "address": "123 Main St, Block Island, RI",
      "latitude": "41.1873",
      "longitude": "-71.5773",
      "phoneNumber": "401-555-1234",
      "email": "contact@example.com",
      "website": "https://example.com",
      "date": "2026-01-15T12:00:00Z",
      "type": "map",
      "subtype": "Restaurants",
      "thumbnail": "https://example.com/image.jpg",
      "images": [
        { "url": "https://example.com/image.jpg" }
      ]
    }
  ],
  "next_page": null,
  "stat": "ok"
}
```

**Sorting Order:**
1. Premium listings first (by `rotation_position` ascending)
2. Non-premium listings second (alphabetically by name)
3. When no category specified: grouped by category (alphabetically)

**Automatic Rotation:**
- On each request, checks if rotation is needed (once per day)
- If needed, rotates all categories before returning data

---

## Rotation Algorithm

### How It Works

1. **Check if needed:** Compare `last_rotated_at` timestamp to today's date
2. **For each category with premium listings:**
   - Get all premium listings ordered by `rotation_position`
   - Move position 1 to the end (max position)
   - Decrement all other positions by 1
   - Update `last_rotated_at` timestamp

### Example

Before rotation (Day 1):
```
Restaurants:
  Position 1: Joe's Pizza
  Position 2: Sam's Seafood
  Position 3: Beach Bistro
```

After rotation (Day 2):
```
Restaurants:
  Position 1: Sam's Seafood
  Position 2: Beach Bistro
  Position 3: Joe's Pizza
```

### Key Files

- `src/services/rotation.js` - Rotation logic
  - `needsRotation()` - Check if rotation needed today
  - `rotateAllCategories()` - Execute rotation for all categories
  - `rotateCategoryPremiums(category)` - Rotate single category

---

## Environment Variables

### API Server (/.env)

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Server
PORT=3000
```

### Admin Interface (/admin/.env.local)

```bash
# Supabase (same project)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these from: Supabase Dashboard → Settings → API

---

## Running Locally

### Prerequisites

- Node.js 18+
- Supabase project with `listings` table

### API Server

```bash
# From project root
npm install
npm run dev
# Server runs on http://localhost:3000
```

### Admin Interface

```bash
# From admin directory
cd admin
npm install
npm run dev
# Admin runs on http://localhost:3001
```

### Both Together

Open two terminals:
1. Terminal 1: `npm run dev` (API)
2. Terminal 2: `cd admin && npm run dev` (Admin)

---

## Deployment

### Recommended Setup

| Component | Platform | Notes |
|-----------|----------|-------|
| API Server | Render | Free tier works, set env vars |
| Admin UI | Vercel | Connect to GitHub repo |
| Database | Supabase | Free tier sufficient |

### API Server on Render

1. Create new Web Service
2. Connect GitHub repo
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables

### Admin on Vercel

1. Create new project
2. Connect GitHub repo
3. Root directory: `admin`
4. Framework: Next.js (auto-detected)
5. Add environment variables

### Database Schema

The `listings` table should already exist from Phase 1. Key columns:

```sql
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  address TEXT,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  phone TEXT,
  email TEXT,
  website TEXT,
  description TEXT,
  image_url TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  rotation_position INTEGER DEFAULT 0,
  last_rotated_at TIMESTAMPTZ,
  goodbarber_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Key Files Reference

### API Server

| File | Purpose |
|------|---------|
| `src/index.js` | Express app setup, routes |
| `src/api/feed.js` | /api/feed/maps endpoint |
| `src/models/listing.js` | Database queries |
| `src/services/rotation.js` | Rotation business logic |
| `src/db/supabase.js` | Supabase client |

### Admin Interface

| File | Purpose |
|------|---------|
| `admin/src/middleware.ts` | Auth protection |
| `admin/src/lib/supabase/` | Supabase clients (server/client/middleware) |
| `admin/src/lib/actions/` | Server Actions for mutations |
| `admin/src/lib/queries/` | Data fetching functions |
| `admin/src/app/(protected)/` | Protected routes |

---

## Troubleshooting

### API returns empty items

1. Check Supabase connection (env vars correct?)
2. Check if listings exist in database
3. Check server logs for errors

### Rotation not happening

1. Check `last_rotated_at` in database
2. Rotation only triggers on API request
3. Check for errors in `needsRotation()` or `rotateAllCategories()`

### Admin login not working

1. Verify Supabase auth is enabled
2. Check env vars in admin/.env.local
3. Ensure user exists in Supabase Auth

### GoodBarber not showing updates

1. GoodBarber may cache feed data
2. Verify API endpoint returns expected data
3. Check GoodBarber Custom Feed settings
