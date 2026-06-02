# Virtual Photobox

Virtual Photobox is a frontend-only photo booth composer built with Next.js. It lets users capture or upload local photos, arrange them into a styled photobox frame, customize the result, and export the final image from the browser.

The current MVP is intentionally local-first: no live rooms, no accounts, no database, and no server-side photo storage. This keeps privacy and delivery speed high while validating the core creation workflow before adding realtime infrastructure.

## Features

- Local camera capture through the browser camera API.
- Local image upload and drag-and-drop input.
- Photo slots for 2-4 images.
- Layouts for duo strip, triple stack, quad grid, and classic strip.
- Per-photo crop controls: horizontal position, vertical position, and zoom.
- Frame themes: Soft Pop, Midnight Flash, and Paper Strip.
- Filter presets: Clean, Warm, Flash, and Mono.
- Caption text with custom X/Y positioning.
- Optional date text.
- Sticker accents with placement controls.
- Client-side PNG/JPEG export.
- Browser-native share action when supported, with download as fallback.

## Privacy Model

Photos are processed locally in the browser. The app does not upload user photos, does not store photos in a database, and does not create user accounts or galleries.

Object URLs are used for local previews and revoked when photos are removed or the session is reset. Export only happens after an explicit user action.

## Tech Stack

- Next.js 16.2.6
- React 19.2.4
- TypeScript
- Tailwind CSS 4
- shadcn/ui
- Radix UI
- Lucide React

## Project Structure

```txt
app/
  layout.tsx
  page.tsx
components/
  photobox/
    PhotoboxApp.tsx   # Main creator UI and state orchestration
    canvas.ts         # Deterministic canvas renderer and export helpers
    config.ts         # Layouts, themes, filters, stickers, export presets
  ui/
    button.tsx
lib/
  utils.ts
```

## Running Locally

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Verification

Run lint:

```bash
npm run lint
```

Run TypeScript checks:

```bash
npm run typecheck
```

Run a production build:

```bash
npm run build
```

## Current Scope

Phase 1 focuses on the frontend-only MVP:

- Local camera capture.
- Local upload.
- 2-4 photo layouts.
- Styled frame themes.
- Caption, date, sticker, and filter controls.
- Client-side export.
- No database, no live room, no server photo storage.

## Non-Goals

- No realtime participant sync.
- No database-backed photo storage.
- No accounts or saved gallery.
- No AI background removal or generative compositing.
- No server-side image rendering.
- No payments, event admin, or campaign tooling.

## Roadmap

Phase 2 can add guided remote collaboration without storing photos: improved copy prompts, bulk import helpers, preset templates, and optional local-only drafts.

Phase 3 can explore live rooms with ephemeral signaling while preserving the rule that final photos are not stored in a database.

## Trade-Offs

The frontend-only approach is fast, private, and operationally simple. The trade-off is that remote collaboration remains manual and users cannot recover a composition after closing the browser unless an explicit local draft feature is added later.

Client-side canvas export avoids server cost and prevents server-side photo exposure. The trade-off is that export work runs on the user's device, so image counts and export sizes should stay bounded for low-end browsers.