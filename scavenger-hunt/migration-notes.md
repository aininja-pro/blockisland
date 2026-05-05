# Scavenger Hunt Migration Notes

## Runtime Architecture

The hunter and chamber admin apps are served as static HTML from the platform backend.

- Hunter URL: `/scavenger-hunt/`
- Chamber admin static URL: `/scavenger-hunt/chamber-admin`
- API prefix: `/api/scavenger`

The existing Next.js admin dashboard exposes the chamber admin through a protected `/scavenger-hunt` route.

## Preserved Behavior

- Will's vanilla HTML/CSS/JS UI is preserved.
- Mock payment remains in place.
- Hunter email + PIN auth remains behind the Express API.
- Proof photos remain local-only on the hunter device.
- No Supabase Storage bucket or server-side photo upload route was added.

## Data Migration

The import script seeds only:

- staff
- hunt config
- hunt items

The catalog, hunter, leaderboard, and redemption tables are created empty unless Rob or Will later confirms those exported records are production data.

## Contribution Boundary

Will's future source ownership is intended to live under `/scavenger-hunt/`. CODEOWNERS is blocked until Will's GitHub handle is known.
