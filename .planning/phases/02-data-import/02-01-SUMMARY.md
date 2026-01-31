---
phase: 02-data-import
plan: 01
subsystem: database, import
tags: [goodbarber, json, import, supabase, upsert]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Supabase database with listings table, listing repository
provides:
  - GoodBarber JSON import script
  - Bulk upsert method for idempotent imports
  - Sample test data for verification
affects: [03-premium-logic, 05-admin-interface]

# Tech tracking
tech-stack:
  added: []
  patterns: [fallback pattern for bulk operations]

key-files:
  created:
    - src/scripts/import-goodbarber.js
    - src/scripts/sample-goodbarber-data.json
  modified:
    - src/models/listing.js
    - src/db/schema.sql

key-decisions:
  - "Fallback import method when UNIQUE constraint missing"
  - "Keep HTML in description field (strip later if needed)"

patterns-established:
  - "Import scripts in src/scripts/"
  - "Graceful fallback for database constraint dependencies"

issues-created: []

# Metrics
duration: 3min
completed: 2026-01-31
---

# Phase 2 Plan 01: Data Import Summary

**GoodBarber JSON import script with field mapping, bulk upsert, and sample test data for Block Island directory listings**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-01-31T23:31:20Z
- **Completed:** 2026-01-31T23:34:10Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Import script parses GoodBarber maps.json export format
- All fields mapped per DISCOVERY.md specification (id→goodbarber_id, title→name, subtype→category, etc.)
- Bulk upsert with fallback when UNIQUE constraint not present
- Sample data with 5 Block Island businesses across multiple categories
- Edge case handling: missing coordinates imports as null, missing phone logged as warning
- Idempotent imports verified (re-running updates, doesn't duplicate)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create GoodBarber JSON import script** - `d31a243` (feat)
2. **Task 2: Add bulk upsert to listing repository** - `c11e621` (feat)
3. **Task 3: Create sample test data and verify import** - `c1abd42` (feat)

**Plan metadata:** (this commit) (docs: complete plan)

## Files Created/Modified

- `src/scripts/import-goodbarber.js` - Main import script with CLI interface
- `src/scripts/sample-goodbarber-data.json` - 5 sample Block Island businesses
- `src/models/listing.js` - Added upsertByGoodBarberId and getByGoodBarberId methods
- `src/db/schema.sql` - Documented UNIQUE constraint for goodbarber_id

## Decisions Made

- **Fallback import method:** Added graceful fallback when UNIQUE constraint not present on goodbarber_id column. Script works either way - bulk upsert if constraint exists, individual insert/update if not.
- **HTML preservation:** Keep HTML in description field as-is from GoodBarber. Can strip later in API response if needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added fallback for missing UNIQUE constraint**
- **Found during:** Task 3 (running import against sample data)
- **Issue:** Supabase doesn't have UNIQUE constraint on goodbarber_id yet, bulk upsert fails
- **Fix:** Added fallback in upsertByGoodBarberId that checks for existing record and does insert or update individually
- **Files modified:** src/models/listing.js
- **Verification:** Import succeeds, idempotent behavior confirmed
- **Committed in:** c1abd42 (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (blocking issue)
**Impact on plan:** Essential for import to work without manual SQL setup. No scope creep.

## Issues Encountered

None - all planned work completed successfully.

## Next Phase Readiness

- ✓ Import script ready for real GoodBarber export
- ✓ Sample data in database for Phase 3 premium logic testing
- ✓ Upsert method enables future re-imports

**To import real data:**
1. Request content export from GoodBarber support
2. Run: `node src/scripts/import-goodbarber.js <path-to-export.json>`

**Optional optimization:**
Run this SQL in Supabase Dashboard for faster bulk imports:
```sql
ALTER TABLE listings ADD CONSTRAINT listings_goodbarber_id_unique UNIQUE (goodbarber_id);
```

---
*Phase: 02-data-import*
*Completed: 2026-01-31*
