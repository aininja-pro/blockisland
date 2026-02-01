# Phase 4: API Endpoint - Research

**Researched:** 2026-02-01
**Domain:** GoodBarber Custom Map Feed JSON API
**Confidence:** HIGH

<research_summary>
## Summary

Researched GoodBarber's Custom Map Feed specification to understand the exact JSON format our API must produce. GoodBarber consumes external JSON feeds that follow their Content API specification.

Key finding: GoodBarber expects a specific JSON structure with `items` array containing map objects. Each item needs specific field names (title, latitude, longitude, content, etc.) that map to our database schema. The format is straightforward - no authentication, just a publicly accessible JSON endpoint.

**Primary recommendation:** Create a simple Express endpoint that transforms our Supabase listings into GoodBarber's expected JSON format. Use `getSortedByCategory()` for proper premium ordering.
</research_summary>

<standard_stack>
## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| express | 5.x | HTTP server/routing | Already in project from Phase 1 |
| @supabase/supabase-js | 2.x | Database access | Already in project |
| cors | 2.x | Cross-origin requests | Already in project |

### No Additional Libraries Needed
This is a simple JSON transformation endpoint. Express handles routing, Supabase handles data, cors handles cross-origin requests from GoodBarber.

**Installation:** None needed - all dependencies already installed.
</standard_stack>

<goodbarber_spec>
## GoodBarber Custom Map Feed Specification

**Source:** [GitHub - goodbarber/contentapi_custom_feeds_example](https://github.com/goodbarber/contentapi_custom_feeds_example)

### Required JSON Structure

```json
{
  "items": [
    {
      "id": 123,
      "title": "Business Name",
      "content": "<p>Description HTML</p>",
      "summary": "Brief description",
      "address": "123 Main St",
      "latitude": "41.1234",
      "longitude": "-71.5678",
      "phoneNumber": "401-555-1234",
      "email": "info@business.com",
      "website": "https://business.com",
      "date": "2026-01-15T12:00:00+00:00",
      "type": "map",
      "subtype": "Restaurants",
      "thumbnail": "https://example.com/image.jpg",
      "images": [
        {"id": 1, "url": "https://example.com/image.jpg"}
      ]
    }
  ],
  "next_page": null,
  "stat": "ok"
}
```

### Field Mapping (Our DB → GoodBarber)

| Our Field | GoodBarber Field | Notes |
|-----------|------------------|-------|
| id (UUID) | id | Use goodbarber_id if exists, else numeric hash |
| name | title | Required |
| description | content | HTML allowed |
| description | summary | Truncate to ~100 chars |
| address | address | Optional |
| latitude | latitude | String format |
| longitude | longitude | String format |
| phone | phoneNumber | Optional |
| email | email | Optional |
| website | website | Optional |
| category | subtype | Category name |
| image_url | thumbnail | Primary image |
| image_url | images | Array with single image |
| created_at | date | ISO 8601 format |
| - | type | Always "map" |

### Optional Fields (We Won't Use)
- commentsEnabled, commentsUrl, commentsPostUrl - No comments feature
- nbcomments - Always 0
- author - Not relevant
- pinIconUrl, pinIconColor, pinIconWidth, pinIconHeight - Default pins fine
- url - No detail page URL
</goodbarber_spec>

<architecture_patterns>
## Architecture Patterns

### Recommended Endpoint Structure

```
GET /api/feed/maps              → All listings, sorted (premium first)
GET /api/feed/maps?category=X   → Single category, sorted
```

### Pattern: Transform at API Layer

```javascript
// src/api/feed.js
function transformToGoodBarber(listing) {
  return {
    id: listing.goodbarber_id || hashId(listing.id),
    title: listing.name,
    content: listing.description || '',
    summary: truncate(listing.description, 100),
    address: listing.address || '',
    latitude: String(listing.latitude || ''),
    longitude: String(listing.longitude || ''),
    phoneNumber: listing.phone || '',
    email: listing.email || '',
    website: listing.website || '',
    date: listing.created_at,
    type: 'map',
    subtype: listing.category,
    thumbnail: listing.image_url || '',
    images: listing.image_url ? [{ id: 1, url: listing.image_url }] : []
  };
}
```

### Pattern: Trigger Rotation Check on Request

```javascript
// Check if rotation needed, run if so
const rotation = require('../services/rotation');

app.get('/api/feed/maps', async (req, res) => {
  // Check/run daily rotation
  if (await rotation.needsRotation()) {
    await rotation.rotateAllCategories();
  }

  // Return sorted listings
  const listings = await listing.getSortedByCategory(category);
  // ...
});
```

### Anti-Patterns to Avoid
- **Pagination complexity:** GoodBarber handles caching - serve all items per category
- **Authentication on feed:** Must be publicly accessible
- **Complex URL schemes:** Keep it simple, GoodBarber just needs the URL
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sorting | Custom sort logic | getSortedByCategory() | Already built in Phase 3 |
| Rotation | Manual rotation | rotation.needsRotation() + rotateAllCategories() | Already built in Phase 3 |
| JSON response | Manual JSON stringify | Express res.json() | Handles headers, encoding |
| CORS | Manual headers | cors middleware | Already configured |

**Key insight:** Phase 3 already built the core logic. Phase 4 is just an HTTP wrapper.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Latitude/Longitude as Numbers
**What goes wrong:** GoodBarber expects strings, we store as floats
**Why it happens:** Database returns DOUBLE PRECISION
**How to avoid:** Explicitly convert: `String(listing.latitude)`
**Warning signs:** Map pins not appearing or in wrong location

### Pitfall 2: Missing Optional Fields
**What goes wrong:** null values break JSON parsing
**Why it happens:** Database allows NULL, GoodBarber wants empty strings
**How to avoid:** Default all optional fields: `listing.phone || ''`
**Warning signs:** Feed works for some listings but not others

### Pitfall 3: HTML in Description
**What goes wrong:** HTML entities showing as text
**Why it happens:** Double-encoding or stripping HTML
**How to avoid:** Pass HTML through unchanged - GoodBarber handles rendering
**Warning signs:** `&amp;` showing in app instead of `&`

### Pitfall 4: Category Filtering Case Sensitivity
**What goes wrong:** ?category=restaurants returns nothing
**Why it happens:** Database has "Restaurants" (capitalized)
**How to avoid:** Case-insensitive comparison or document exact category names
**Warning signs:** Empty results for valid categories
</common_pitfalls>

<code_examples>
## Code Examples

### Basic Feed Endpoint
```javascript
// Source: Express.js patterns + GoodBarber spec
const express = require('express');
const router = express.Router();
const listing = require('../models/listing');
const rotation = require('../services/rotation');

router.get('/maps', async (req, res) => {
  try {
    const { category } = req.query;

    // Run rotation if needed (once per day)
    if (await rotation.needsRotation()) {
      await rotation.rotateAllCategories();
    }

    // Get sorted listings
    let listings;
    if (category) {
      listings = await listing.getSortedByCategory(category);
    } else {
      listings = await listing.getAll(); // Or aggregate all categories
    }

    // Transform to GoodBarber format
    const items = listings.map(transformToGoodBarber);

    res.json({
      items,
      next_page: null,
      stat: 'ok'
    });
  } catch (error) {
    res.status(500).json({ stat: 'error', message: error.message });
  }
});
```

### Transform Function
```javascript
function transformToGoodBarber(listing) {
  const summary = listing.description
    ? listing.description.replace(/<[^>]*>/g, '').substring(0, 100)
    : '';

  return {
    id: listing.goodbarber_id ? parseInt(listing.goodbarber_id) : hashCode(listing.id),
    title: listing.name,
    content: listing.description || '',
    summary: summary,
    address: listing.address || '',
    latitude: listing.latitude ? String(listing.latitude) : '',
    longitude: listing.longitude ? String(listing.longitude) : '',
    phoneNumber: listing.phone || '',
    email: listing.email || '',
    website: listing.website || '',
    date: listing.created_at,
    type: 'map',
    subtype: listing.category,
    thumbnail: listing.image_url || '',
    images: listing.image_url ? [{ id: 1, url: listing.image_url }] : []
  };
}

// Simple hash for UUIDs → integers
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
```
</code_examples>

<integration_notes>
## GoodBarber Integration Notes

### Adding Custom Feed in GoodBarber
1. Go to GoodBarber dashboard → Design → Sections
2. Add new section → Custom → Custom Map
3. Paste URL: `https://your-domain.com/api/feed/maps`
4. For category-specific: `https://your-domain.com/api/feed/maps?category=Restaurants`

### Testing Before Integration
```bash
# Test endpoint locally
curl http://localhost:3000/api/feed/maps | jq .

# Test with category filter
curl "http://localhost:3000/api/feed/maps?category=Restaurants" | jq .

# Verify JSON structure matches GoodBarber spec
curl http://localhost:3000/api/feed/maps | jq '.items[0] | keys'
```

### CORS Requirements
GoodBarber fetches from their servers, not browser. CORS may not be required for the feed itself, but enable it anyway for testing/debugging from browser.
</integration_notes>

<open_questions>
## Open Questions

1. **Numeric ID requirement**
   - What we know: GoodBarber examples use integer IDs
   - What's unclear: Will UUID strings work, or must we convert?
   - Recommendation: Convert UUID to numeric hash for safety

2. **All listings vs per-category feeds**
   - What we know: GoodBarber can pull single URL
   - What's unclear: Do they prefer one feed or multiple category feeds?
   - Recommendation: Support both - default returns all, ?category filters

3. **Caching behavior**
   - What we know: GoodBarber caches feeds
   - What's unclear: Cache duration, refresh triggers
   - Recommendation: Our rotation is daily anyway; cache is fine
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- [GoodBarber Custom Feeds GitHub](https://github.com/goodbarber/contentapi_custom_feeds_example) - maps.json example
- Raw maps.json file showing exact field structure

### Secondary (MEDIUM confidence)
- [GoodBarber Help - Custom Feeds](https://www.goodbarber.com/help/custom-feeds-r111/how-to-create-custom-feeds-a287/)
- [GoodBarber for Developers](https://goodbarber.github.io/)

### Tertiary (Verified with primary)
- WebSearch results confirmed against GitHub examples
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Express.js JSON API
- Ecosystem: GoodBarber Custom Map Feed
- Patterns: Transform layer, rotation trigger
- Pitfalls: Type conversion, null handling

**Confidence breakdown:**
- Standard stack: HIGH - already in project
- GoodBarber format: HIGH - from official GitHub examples
- Architecture: HIGH - straightforward REST pattern
- Pitfalls: MEDIUM - inferred from format differences

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (30 days - GoodBarber spec stable)
</metadata>

---

*Phase: 04-api-endpoint*
*Research completed: 2026-02-01*
*Ready for planning: yes*
