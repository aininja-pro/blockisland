# Roadmap: Block Island Premium Listing System

## Overview

Build an external backend that serves as the source of truth for all Block Island Directory App listings. The system provides a sorted JSON feed to GoodBarber via Custom Map Feed, placing premium members at the top with fair daily rotation. A full admin interface allows Chamber staff to manage listings, premium status, and view rotation order. GoodBarber displays what we feed it - all content management happens in our system.

## Domain Expertise

None

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Foundation** - Database setup, project scaffolding, basic data models
- [x] **Phase 2: Data Import** - Import existing listings from GoodBarber, preserve geo data
- [x] **Phase 3: Premium Logic** - Premium flag, daily rotation algorithm, per-category rotation
- [x] **Phase 4: API Endpoint** - JSON feed endpoint returning sorted listings for GoodBarber
- [x] **Phase 5: Admin Interface** - Full listing CRUD, premium toggle, rotation view for Chamber staff (4/4 plans)
- [x] **Phase 6: Integration & Docs** - GoodBarber custom feed integration, admin guide documentation (1/1 plans)
- [ ] **Phase 7: Section & Subcategory Support** - Multi-category data model, "Appears In" UI, section-based rotation

## Phase Details

### Phase 1: Foundation
**Goal**: Set up project structure, database, and basic data models for listings
**Depends on**: Nothing (first phase)
**Research**: Unlikely (established patterns)
**Plans**: TBD

Key deliverables:
- Project scaffolding (tech stack decision)
- Database schema for listings with premium flag and rotation metadata
- Basic listing model with all required fields (name, category, lat/long, etc.)

### Phase 2: Data Import
**Goal**: Import all existing listings from GoodBarber preserving data integrity
**Depends on**: Phase 1
**Research**: Likely (GoodBarber data format)
**Research topics**: GoodBarber export API/format, data structure, field mapping
**Plans**: TBD

Key deliverables:
- Data import script/tool
- All existing listings in database
- Verified lat/long coordinates preserved
- Category assignments intact

### Phase 3: Premium Logic
**Goal**: Implement premium flag and fair daily rotation algorithm
**Depends on**: Phase 2
**Research**: Unlikely (internal algorithm)
**Plans**: TBD

Key deliverables:
- Premium flag on listings
- Daily rotation algorithm (fair visibility)
- Per-category rotation (independent rotation within each category)
- Rotation metadata tracking

### Phase 4: API Endpoint
**Goal**: JSON API returning listings sorted correctly for GoodBarber consumption
**Depends on**: Phase 3
**Research**: Likely (GoodBarber custom feed spec)
**Research topics**: GoodBarber custom feed API requirements, expected JSON format, field names
**Plans**: TBD

Key deliverables:
- JSON endpoint returning sorted listings
- Premium members first (rotated), then basic members
- Per-category endpoints or filtering
- Format compatible with GoodBarber custom feed

### Phase 5: Admin Interface
**Goal**: Full web admin for Chamber staff to manage all listings and premium status
**Depends on**: Phase 3
**Research**: Unlikely (standard admin patterns)
**Plans**: TBD

Key deliverables:
- Secure login (Rob + Chamber staff)
- **Full listing CRUD** (create, edit, delete businesses)
- Edit all listing fields (name, description, address, phone, website, coordinates, images)
- Premium toggle on/off per business
- View current rotation order
- View premium member list
- Category management

### Phase 6: Integration & Docs
**Goal**: Complete GoodBarber integration and create admin documentation
**Depends on**: Phase 4, Phase 5
**Research**: Likely (GoodBarber configuration)
**Research topics**: GoodBarber custom feed configuration steps, testing in GoodBarber
**Plans**: TBD

Key deliverables:
- GoodBarber configured to pull from our endpoint
- App verified working with new feed
- Admin guide for Chamber staff
- System overview documentation

### Phase 7: Section & Subcategory Support
**Goal**: Update data model to support GoodBarber's section/subcategory hierarchy with "Appears In" functionality
**Depends on**: Phase 6
**Research**: Unlikely (data model change based on discovered requirements)
**Plans**: TBD

Key deliverables:
- Database schema update: `section` field + `listing_subcategories` junction table
- Admin UI: Section dropdown + subcategory checkboxes ("Appears In" like GoodBarber)
- API update: Support `?section=X` and `?section=X&sub=Y` filtering
- Premium rotation at section level (Option A - same position across all subcategories)
- Seed data: All known sections and subcategories from GoodBarber

Sections to support:
- Ferries, Airlines, Taxis, Bike/Moped/Cars
- Food & Drink (with 14 subcategories)
- Shopping, Sites & Landmarks, Galleries & Theaters
- Sports & Recreation, Museums, Spas & Wellness, Tours
- Hotels, Inns, B&Bs, Marinas
- Community Places, Services, Weddings & Special Events
- Real Estate

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 1/1 | Complete | 2026-01-31 |
| 2. Data Import | 1/1 | Complete | 2026-01-31 |
| 3. Premium Logic | 1/1 | Complete | 2026-02-01 |
| 4. API Endpoint | 1/1 | Complete | 2026-01-31 |
| 5. Admin Interface | 4/4 | Complete | 2026-02-01 |
| 6. Integration & Docs | 1/1 | Complete | 2026-02-01 |
| 7. Section & Subcategory | 0/TBD | Not started | - |
