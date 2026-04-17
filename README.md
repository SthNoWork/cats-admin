# Admin Notes

This admin page uploads media to Cloudinary and stores metadata in Firestore.

## Current data model

### Collection: config

Document: categories

Fields are numeric keys:

- 1: Ministry of Cats
- 2: Funny
- 3: Cute
- 4: Street
- 5: Rescue

There is also:

- updatedAt: server timestamp

### Collection: cats

Each media post is saved as its own numeric document ID (1, 2, 3, ...).

Example fields in `cats/2`:

- medias: array of Cloudinary URLs for additional media, or null when post has only one file
- thumbnail: first media URL used by public viewer card
- title: string
- description: string or null
- categories: comma-separated IDs from config/categories (example: 1,3,4)
- uploaddate: yyyy/mm/dd
- addedAt: server timestamp

Required basic fields for each post:

- thumbnail
- title
- categories
- uploaddate

## Admin flow

1. Login with Google
2. Click "Initialize Default Categories" to write config/categories if needed
3. Upload one or more media files
4. Admin code computes next numeric ID in cats
5. All files are uploaded to Cloudinary
6. Metadata is written to Firestore

## Public viewer

Public page is in ../public/index.html.

It reads:

- config/categories
- cats/* numeric docs

Then it resolves category IDs to names for display.

The public card uses the first media URL as thumbnail.
Clicking the thumbnail toggles display of the full media list for that post.

## Important config files

- firebase.js: Firebase app/auth/firestore setup
- cloudinary.js: Cloudinary upload helper
- database-initializer.js: writes default categories
- index.html: admin UI and upload logic
