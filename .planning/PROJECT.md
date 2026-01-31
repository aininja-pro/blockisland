# Block Island Premium Listing System

## What This Is

A lightweight external backend system that enables premium listing management and automatic rotation for the Block Island Directory App. The system feeds sorted listings to GoodBarber via custom feed, placing premium members at the top of category listings with fair daily rotation. Includes a simple admin interface for Chamber staff to toggle premium status.

## Core Value

Premium members always appear above basic members with fair rotation — no manual sorting required, "set it and forget it" functionality.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Admin web interface with secure login for Rob + Chamber staff
- [ ] **Full listing management** (create, edit, delete businesses)
- [ ] Edit all listing fields (name, description, address, phone, website, coordinates, images)
- [ ] Premium toggle on/off per business listing
- [ ] View current rotation order and premium member list
- [ ] Database storing listings with premium flag and rotation metadata
- [ ] Automatic daily rotation logic for premium tier (fair visibility)
- [ ] JSON API endpoint returning listings in correct sorted order (premium first, rotated, then basic)
- [ ] Premium rotation applies within each category independently
- [ ] GoodBarber custom feed integration
- [ ] Preserve existing map pin functionality (lat/long coordinates)
- [ ] Preserve all current listing data and categories
- [ ] Admin guide and system overview documentation

### Out of Scope

- Ad rotation system — future phase, not in this contract
- Changes to GoodBarber app design or layout — app looks identical to users
- Ongoing hosting fees — separate (~$10-20/month on Render)
- Business self-service portal — businesses don't update their own listings
- User-facing premium content (coupons, discounts) — future consideration
- Full content management — Good Barber remains source of truth for content editing

## Context

**The App:**
- Block Island tourism directory app built on GoodBarber platform
- Partners with Block Island Chamber of Commerce
- 40,000 downloads, 3-4 million page views over 5 years
- Peak usage June-August (tourist season)
- Categories: Airlines, Ferries, Restaurants, Hotels, Taxis, Bikes, Mopeds, Cars, etc.

**Current State:**
- Free listing for all Chamber members
- Premium membership ~$500/year for enhanced visibility
- Manual position-based sorting — labor intensive
- No way to designate premium vs basic in GoodBarber natively
- ~30-40 premium members currently
- Premium status changes annually (once per year)

**The Problem:**
- GoodBarber doesn't support custom fields, tiered sorting, or automatic rotation
- Current manual sorting is unfair (alphabetical advantage) and tedious
- Premium members should get value for their investment

**The Solution:**
- External backend serves as source of truth for all listings
- App looks and works identically to users
- GoodBarber Custom Map Feed pulls from our API endpoint
- All listing management (add/edit/delete) happens in our admin dashboard
- GoodBarber just displays what we feed it

**Stakeholders:**
- Rob Lucier (Client) — app owner, primary admin
- Chamber of Commerce staff (1-2 people) — content updates, premium management
- Ray Richards / R-CUBED HOLDINGS LLC — developer/consultant

## Constraints

- **Data Source**: Our system is source of truth for all listing content; GoodBarber pulls from our Custom Map Feed
- **Integration**: Must work with GoodBarber's Custom Map Feed extension
- **Geo Data**: Must preserve lat/long coordinates for map functionality
- **Categories**: Must support all existing categories with independent rotation per category
- **Access**: Small team access (2-3 admins) with same permissions
- **Hosting**: Target Render or similar (~$10-20/month)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| External backend vs GoodBarber native | GoodBarber doesn't support custom sorting/rotation natively | External backend |
| Our system as source of truth | GoodBarber Custom Map Feed pulls from us; all edits happen in our admin | Our system is source of truth |
| Daily rotation (not per-request) | Simpler, still fair, discussed in kickoff call | Daily rotation |
| Supabase for database + auth | Free tier covers needs, built-in auth simplifies admin (Phase 5), managed = less ops | Supabase |
| Express.js for API | Simple, well-documented, deploys easily to Render | Express.js |

---
*Last updated: 2026-01-31 after initialization*
