# Cats Admin Notes

This folder is the admin app for managing cat posts and categories.

Current stack:

- Firebase Auth + Firestore (v8 SDK)
- Cloudinary signed uploads
- Tailwind CDN + shared theme/config
- Vanilla JS modules per page (no build step)

## Current page architecture

Entry/auth pages:

- index.html: login gate (Google auth)
- admin.html: dashboard (stats + recent entries)

Feature pages:

- cats.html + cats-manager.js: create/edit/delete cat entries, media management
- categories.html + categories-manager.js: create/edit/delete categories

Shared assets:

- tailwind-theme.js: shared Tailwind config/colors/radius/fonts
- admin-shared.css: shared UI styles (font, scrollbar, panel-card)
- firebase.js: Firebase initialization/auth/firestore globals
- cloudinary.js: signed upload helper

## Firestore data model (source of truth)

### config/categories

Single document with numeric field keys that map ID -> name.

Example:

- 1: Ministry of Cats
- 2: Funny
- 3: Cute

Notes:

- Keys are stored as strings in Firestore but treated as numeric IDs in UI sorting.
- Categories are loaded/sorted numerically in both cats and categories pages.

### cats/{numericId}

Each post uses a numeric string doc ID: 1, 2, 3, ...

Canonical fields used by admin:

- title: string (required)
- description: string | null
- categories: comma-separated category IDs (example: "1,3,4")
- thumbnail: URL string (required for normal display)
- medias: URL array | null
- addedAt: server timestamp

Notes:

- medias may contain both image and video URLs.
- thumbnail must point to one URL in medias when medias exists.

## Cats page behavior (important)

Media model in cats-manager.js is state-based:

- state.mediaItems stores mixed sources:
  - kind=file (new uploads)
  - kind=url (existing or manually added URLs)
- state.selectedMediaId tracks thumbnail selection

Update behavior:

- Edit supports metadata-only changes.
- Edit supports thumbnail-only changes.
- Edit supports adding new uploads to existing media.
- Edit supports URL CRUD per media item (add/remove/select thumbnail).

Why this matters:

- Thumbnail updates no longer depend on uploading new files.
- Upload logic is not chained through nested if trees; it builds final media from unified state.

## Categories page behavior

- Category form is name-only (description removed intentionally).
- Supports create, edit, delete, and reload.
- IDs are generated as max numeric key + 1.

## Dashboard behavior

- No automatic default category initialization action.
- Shows total cats, total categories, recent uploads (last 7 days), recent entries.

## Responsive conventions

All admin pages now share a responsive shell:

- Mobile: stacked layout (top nav strip + content)
- Desktop: sidebar + main split layout
- Sticky form/list behavior only at larger breakpoints (xl)

Touch usability conventions:

- Edit/delete list actions are visible on mobile (not hover-only).

## Known constraints / gotchas

- Numeric IDs are generated client-side by scanning existing docs. This is fine for local/single-admin use, but can race under concurrent writers.
- categories field in cats docs is comma-separated for compatibility with current public/admin render logic.
- Cloudinary upload helper currently uses client-side signing config from cloudinary.js (local-use tradeoff).

## Quick maintenance checklist

When changing cat/category logic:

1. Keep cats-manager.js and categories-manager.js as the behavior source (avoid moving logic back inline into HTML).
2. Preserve category ID string format and numeric sort behavior.
3. If changing media schema, update both create and edit save paths.
4. Keep thumbnail assignment deterministic when media is added/removed.
5. Re-run syntax/error checks for all touched files.

## Future cleanup ideas

- Move shared sidebar HTML into a reusable include/template pattern.
- Replace comma-separated categories with array storage plus migration.
- Move Cloudinary signing server-side if project becomes public.
