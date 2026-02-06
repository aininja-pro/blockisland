# GoodBarber Custom Map Feed Setup Guide

This guide walks through configuring GoodBarber to pull listings from our API endpoint.

**For: Rob Lucier**

---

## Prerequisites

Before starting, ensure:

1. **API is deployed** and accessible at a public URL
   - Example: `https://blockisland-api.onrender.com`
   - Test by visiting: `{your-api-url}/health` (should return `{"status":"ok"}`)

2. **Listings exist** in the database
   - Test by visiting: `{your-api-url}/api/feed/maps`
   - Should return JSON with items array

---

## How It Works

Each GoodBarber map section gets its own feed URL that returns only the listings for that section:

```
GoodBarber Section "Food & Drink" (map type)
  → fetches https://your-api-url/api/feed/maps?section=Food%20%26%20Drink
  → Express API queries Supabase for listings in that section
  → Returns GoodBarber-formatted JSON with categories: ["Fine Dining"]
  → Map pins appear, filter tabs show subcategories
```

---

## Per-Section Feed URLs

Each of the 24 map sections has its own feed URL. Replace `{BASE}` with your deployed API URL (e.g., `https://blockisland-api.onrender.com`).

| # | Section | Feed URL |
|---|---------|----------|
| 1 | Ferries | `{BASE}/api/feed/maps?section=Ferries` |
| 2 | Airlines | `{BASE}/api/feed/maps?section=Airlines` |
| 3 | Taxis | `{BASE}/api/feed/maps?section=Taxis` |
| 4 | Bike, Moped, Cars | `{BASE}/api/feed/maps?section=Bike%2C%20Moped%2C%20Cars` |
| 5 | Limousine Services | `{BASE}/api/feed/maps?section=Limousine%20Services` |
| 6 | Outdoor Activities | `{BASE}/api/feed/maps?section=Outdoor%20Activities` |
| 7 | Food & Drink | `{BASE}/api/feed/maps?section=Food%20%26%20Drink` |
| 8 | Shopping | `{BASE}/api/feed/maps?section=Shopping` |
| 9 | Sites & Landmarks | `{BASE}/api/feed/maps?section=Sites%20%26%20Landmarks` |
| 10 | Galleries & Theaters | `{BASE}/api/feed/maps?section=Galleries%20%26%20Theaters` |
| 11 | Sports & Recreation | `{BASE}/api/feed/maps?section=Sports%20%26%20Recreation` |
| 12 | Museums | `{BASE}/api/feed/maps?section=Museums` |
| 13 | Spas & Wellness | `{BASE}/api/feed/maps?section=Spas%20%26%20Wellness` |
| 14 | Tours | `{BASE}/api/feed/maps?section=Tours` |
| 15 | Nightlife | `{BASE}/api/feed/maps?section=Nightlife` |
| 16 | Hotels (20+ Rooms) | `{BASE}/api/feed/maps?section=Hotels%20(20%2B%20Rooms)` |
| 17 | Inns | `{BASE}/api/feed/maps?section=Inns` |
| 18 | B&Bs / Guest Houses | `{BASE}/api/feed/maps?section=B%26Bs%20%2F%20Guest%20Houses` |
| 19 | Mainland Accommodations | `{BASE}/api/feed/maps?section=Mainland%20Accommodations` |
| 20 | Marinas | `{BASE}/api/feed/maps?section=Marinas` |
| 21 | Community Places | `{BASE}/api/feed/maps?section=Community%20Places` |
| 22 | Services - Home & Business | `{BASE}/api/feed/maps?section=Services%20-%20Home%20%26%20Business` |
| 23 | Weddings & Special Events | `{BASE}/api/feed/maps?section=Weddings%20%26%20Special%20Events` |
| 24 | Real Estate | `{BASE}/api/feed/maps?section=Real%20Estate` |

---

## Step-by-Step: Configure a Section

Repeat this for each of the 24 map sections.

### 1. Open the Section in GoodBarber

1. Log in to your GoodBarber admin panel
2. Go to **Content** > **Sections**
3. Find the map section you want to configure (e.g., "Food & Drink")
4. Click to edit it

### 2. Switch to Custom Map Feed

1. In the section settings, look for the **Content Source** option
2. Change from **CMS** to **Custom Map Feed** (JSON format)
3. Paste the feed URL from the table above

Example for Food & Drink:
```
https://blockisland-api.onrender.com/api/feed/maps?section=Food%20%26%20Drink
```

### 3. Save and Preview

1. Save the section settings
2. Use GoodBarber's preview mode to verify listings appear on the map
3. Check that map pins show at correct locations
4. Tap a pin to verify business details display correctly

### 4. Configure Filter Tabs (if needed)

The API includes a `categories` array on each listing with its subcategory name (e.g., `["Fine Dining"]`, `["Seafood"]`). If GoodBarber does not auto-generate filter tabs from the `categories` field, configure them manually in the section settings using the same subcategory names.

---

## JSON Feed Format

Our API returns this structure, matching the official GoodBarber Custom Map Feed specification:

```json
{
  "items": [
    {
      "id": 12345,
      "title": "Business Name",
      "content": "Full description...",
      "summary": "Short description...",
      "author": "",
      "address": "123 Main St, Block Island, RI",
      "latitude": "41.1873",
      "longitude": "-71.5773",
      "phoneNumber": "401-555-1234",
      "email": "contact@example.com",
      "website": "https://example.com",
      "date": "2026-01-15T12:00:00Z",
      "type": "maps",
      "subtype": "custom",
      "categories": ["Fine Dining"],
      "commentsEnabled": false,
      "nbcomments": 0,
      "thumbnail": "https://example.com/image.jpg",
      "images": [
        { "url": "https://example.com/image.jpg" }
      ]
    }
  ],
  "next_page": null,
  "generated_in": "42ms",
  "stat": "ok"
}
```

**Key fields:**
- `type: "maps"` — identifies this as a maps/places feed (plural, per GoodBarber spec)
- `subtype: "custom"` — source type identifier (always "custom" for our API)
- `categories: ["Fine Dining"]` — subcategory name(s) for filter tabs within the section

---

## Deployment

### Deploy API to Render

1. Create a new **Web Service** on Render
2. Connect to your GitHub repo
3. **Build command:** `npm install`
4. **Start command:** `npm start`
5. Add environment variables:
   - `SUPABASE_URL` — your Supabase project URL
   - `SUPABASE_ANON_KEY` — your Supabase anon key
6. Deploy and note the public URL (e.g., `https://blockisland-api.onrender.com`)
7. Verify: visit `https://your-url.onrender.com/health`

### Verify Feed is Working

After deployment, test a few section feeds:

```
https://your-url.onrender.com/api/feed/maps?section=Food%20%26%20Drink
https://your-url.onrender.com/api/feed/maps?section=Ferries
https://your-url.onrender.com/api/feed/maps?section=Community%20Places
```

Each should return JSON with an `items` array and `stat: "ok"`.

---

## Refresh Settings

Configure how often GoodBarber refreshes data:

- **Recommended:** Every 15-30 minutes minimum
- Our API serves fresh data on each request
- Rotation happens once per day (first request each day triggers it)

---

## Troubleshooting

### "Feed not found" or connection error

1. Verify API URL is correct and publicly accessible
2. Test URL directly in browser — should show JSON
3. Check for HTTPS vs HTTP (GoodBarber may require HTTPS)
4. Make sure special characters are URL-encoded (& → %26, spaces → %20)

### Listings not appearing

1. Check API response has items: `{your-url}/api/feed/maps?section=SectionName`
2. Verify items array is not empty
3. Check GoodBarber logs for parsing errors

### Map pins not showing

1. Verify listings have latitude and longitude values
2. Check that lat/long are valid coordinates
3. In our API, lat/long are returned as strings (GoodBarber expects this)

### Filter tabs not showing

1. Verify listings have `categories` array with subcategory names
2. If GoodBarber doesn't auto-generate tabs from `categories`, configure them manually in the section settings
3. Use the same subcategory names that appear in the feed

### Premium order seems wrong

1. Rotation happens once per day on first API request
2. Position 1 = top listing for today
3. Check Premium page in admin to see current rotation order

### Images not loading

1. Verify image URLs are publicly accessible
2. Check for HTTPS vs HTTP issues
3. Test image URLs directly in browser

### Changes not appearing in app

1. GoodBarber may cache feed data
2. Try forcing a refresh in GoodBarber admin
3. Wait for next automatic refresh cycle
4. Changes made in our admin are instant on API side

---

## Contact for Issues

If you encounter technical issues with the API:
- Check API health: `{your-url}/health`
- Check for errors in API logs (Render dashboard)
- Contact: [Developer contact info]

For GoodBarber-specific issues:
- Check GoodBarber documentation
- Contact GoodBarber support

---

## Quick Reference

| Item | Value |
|------|-------|
| **Feed URL Pattern** | `https://your-api-url/api/feed/maps?section=SectionName` |
| **Health Check** | `https://your-api-url/health` |
| **Format** | JSON (Custom Map Feed) |
| **type** | `"maps"` |
| **subtype** | `"custom"` |
| **Filter data** | `categories` array |
| **Total Sections** | 24 |
| **Refresh** | 15-30 min recommended |
| **Rotation** | Daily, automatic |
