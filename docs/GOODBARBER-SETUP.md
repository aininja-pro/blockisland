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

## Step 1: Access GoodBarber Admin

1. Log in to your GoodBarber admin panel
2. Navigate to your Block Island Directory app

---

## Step 2: Configure Custom Map Feed

1. Go to the **Content** or **Sections** area
2. Find your Map section (or create a new one)
3. Look for **Custom Feed** or **External Source** option
4. Select **Custom Map Feed** (JSON format)

---

## Step 3: Set Feed URL

Enter the API endpoint URL:

```
https://your-api-url/api/feed/maps
```

Replace `your-api-url` with your actual deployed API URL.

**For category-specific feeds** (optional):

```
https://your-api-url/api/feed/maps?category=Restaurants
https://your-api-url/api/feed/maps?category=Hotels
```

---

## Step 4: Verify Feed Format

Our API returns this JSON structure:

```json
{
  "items": [
    {
      "id": 12345,
      "title": "Business Name",
      "content": "Full description...",
      "summary": "Short description...",
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

This follows GoodBarber's Custom Map Feed format.

---

## Step 5: Test the Integration

After configuring:

1. **Preview in GoodBarber** - Use preview mode to see if listings appear
2. **Check map pins** - Verify businesses appear on the map at correct locations
3. **Check listing order** - Premium members should appear first in each category
4. **Test a tap** - Verify business details show correctly

---

## Step 6: Verify Premium Ordering

Premium listings should appear **at the top** of each category:

1. In GoodBarber preview, open a category (e.g., Restaurants)
2. Premium businesses should be listed first
3. Regular businesses follow, sorted alphabetically

**Note:** Premium order rotates daily. The business at position 1 today will be at the bottom tomorrow.

---

## Step 7: Verify Map Pins

1. Open the map view in GoodBarber preview
2. All businesses with lat/long coordinates should have pins
3. Tap a pin to verify it shows correct business info

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
2. Test URL directly in browser - should show JSON
3. Check for HTTPS vs HTTP (GoodBarber may require HTTPS)

### Listings not appearing

1. Check API response has items: `{your-url}/api/feed/maps`
2. Verify items array is not empty
3. Check GoodBarber logs for parsing errors

### Map pins not showing

1. Verify listings have latitude and longitude values
2. Check that lat/long are valid coordinates
3. In our API, lat/long are returned as strings (GoodBarber expects this)

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
| **Feed URL** | `https://your-api-url/api/feed/maps` |
| **Health Check** | `https://your-api-url/health` |
| **Format** | JSON (Custom Map Feed) |
| **Refresh** | 15-30 min recommended |
| **Rotation** | Daily, automatic |
