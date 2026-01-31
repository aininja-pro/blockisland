# Phase 2: Data Import - Discovery

## Discovery Level: 2 (Standard Research)

**Conducted**: 2026-01-31
**Topics**: GoodBarber export API/format, data structure, field mapping

## Findings

### GoodBarber Data Export Options

1. **Manual Export Request**
   - Contact GoodBarber support to request CMS content export
   - Returns ZIP file containing JSON files organized by content type
   - Map points are in `maps/1.json`, `maps/2.json`, etc. (100 items per file)
   - Source: [GoodBarber Export Help](https://www.goodbarber.com/help/content-general-information-r93/export-content-created-in-goodbarber-cms-content-a338/)

2. **No Direct API for Reading**
   - GoodBarber Content API is for *feeding* data INTO the app, not extracting
   - Custom feeds allow external sources to push data to GoodBarber sections
   - No public API endpoint to pull existing CMS content programmatically

### GoodBarber Maps JSON Format

From [contentapi_custom_feeds_example](https://github.com/goodbarber/contentapi_custom_feeds_example):

```json
{
  "items": [
    {
      "id": 12345,
      "title": "Business Name",
      "address": "123 Main St, Block Island, RI",
      "latitude": "41.1736",
      "longitude": "-71.5643",
      "content": "<p>HTML description</p>",
      "summary": "Plain text summary",
      "phoneNumber": "+1-401-555-0123",
      "email": "contact@example.com",
      "website": "https://example.com",
      "url": "https://app.url/item/12345",
      "author": "Admin",
      "date": "2025-06-15T10:00:00Z",
      "type": "maps",
      "subtype": "restaurants",
      "images": [
        {
          "id": 1,
          "url": "https://cdn.example.com/image.jpg"
        }
      ],
      "thumbnail": "https://cdn.example.com/thumb.jpg",
      "smallThumbnail": "https://cdn.example.com/small.jpg",
      "largeThumbnail": "https://cdn.example.com/large.jpg",
      "originalThumbnail": "https://cdn.example.com/original.jpg",
      "commentsEnabled": false,
      "nbcomments": 0,
      "pinIconUrl": "https://cdn.example.com/pin.png",
      "pinIconWidth": 30,
      "pinIconHeight": 45,
      "pinIconColor": "#FF0000"
    }
  ],
  "next_page": null,
  "generated_in": "0.05s",
  "stat": "ok"
}
```

### Field Mapping to Our Schema

| GoodBarber Field | Our Field | Notes |
|------------------|-----------|-------|
| `id` | `goodbarber_id` | Store as string for reference |
| `title` | `name` | Direct mapping |
| `subtype` | `category` | May need normalization |
| `content` | `description` | Strip HTML or store raw |
| `address` | `address` | Direct mapping |
| `phoneNumber` | `phone` | Direct mapping |
| `website` | `website` | Direct mapping |
| `email` | `email` | Direct mapping |
| `latitude` | `latitude` | Parse string to float |
| `longitude` | `longitude` | Parse string to float |
| `thumbnail` | `image_url` | Use best available |
| — | `is_premium` | Default false, set manually later |
| — | `rotation_position` | Default 0 |

### Import Strategy

**Recommended approach:**
1. User requests content export from GoodBarber support
2. User places JSON file(s) in import directory
3. Run import script that:
   - Parses GoodBarber JSON format
   - Maps fields to our schema
   - Upserts to Supabase (using goodbarber_id for idempotency)
   - Reports import statistics

**Why this approach:**
- No API access to GoodBarber data
- One-time bulk import, not ongoing sync
- GoodBarber remains source of truth for content; we only manage premium status
- Upsert allows re-running import safely if needed

### Data Volume Estimate

From PROJECT.md context:
- ~30-40 premium members
- Multiple categories (Airlines, Ferries, Restaurants, Hotels, Taxis, etc.)
- Estimate: 100-300 total listings

JSON files: Likely 1-3 files (100 items each) for maps content.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| User doesn't have export yet | Script validates input, clear error messages |
| Field names differ from docs | Script handles common variations, logs unknowns |
| Missing coordinates | Log warning, allow import with null lat/long |
| Category normalization | Keep original category values, normalize in Phase 3 if needed |

## Sources

- [GoodBarber Export Help](https://www.goodbarber.com/help/content-general-information-r93/export-content-created-in-goodbarber-cms-content-a338/)
- [GoodBarber Custom Feeds GitHub](https://github.com/goodbarber/contentapi_custom_feeds_example)
- [GoodBarber Map CMS Help](https://www.goodbarber.com/help/maps-r11/cms-map-a25/)
- [GoodBarber Item Types Documentation](https://www.goodbarber.com/help/custom-feeds-r111/item-types-documentation-a284/)
