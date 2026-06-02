# Virtual Photobox Frontend-Only PRD

## Commit Message

`docs: add virtual photobox frontend-only PRD`

## Product Summary

Virtual Photobox is a browser-based photo booth composer for people who are physically apart but still want a shared photobox-style result. The first release intentionally does not include live room, database storage, or server-side photo persistence. Users capture or upload photos locally, arrange them into a styled photobox frame, apply light creative edits, and export the final image from the browser.

This is a pragmatic MVP: it validates the core emotional value and visual workflow before investing in realtime infrastructure. The product should feel social and personal, but technically honest. It is not a video call app and should not imply that remote participants are live in the first release.

## Target Users

Primary users are friends or couples in different locations who want a simple, fun way to create a photo strip or collage together. They are likely sharing source photos through existing chat apps and want the final output to be polished enough for Instagram Stories, WhatsApp, TikTok, or personal keepsakes.

Secondary users include small friend groups who want lightweight themed photos for birthdays, graduation, anniversaries, or casual online hangouts.

## Problem

People who are far apart can share selfies, but the result usually feels fragmented. Existing photo booth experiences assume everyone is physically present, while video call screenshots look low-quality and utilitarian. Users need a low-friction way to turn separate photos into one intentional shared memory without handing private images to a server.

## Goals

- Let users create a shared photobox result entirely in the browser.
- Support camera capture and local image upload.
- Provide styled layouts for 2-4 participants.
- Include lightweight personalization: frames, captions, date text, stickers, and color filters.
- Export the final result as an image without storing photos in a database.
- Keep the UX clear that remote participation is manual in the MVP.

## Non-Goals

- No live room or realtime participant sync in the MVP.
- No database for photo storage.
- No user accounts or personal gallery.
- No AI background removal, face retouching, or generative compositing.
- No server-side image rendering.
- No payments, event admin, or brand campaign tooling.

## MVP Scope

### 1. Start Experience

The first screen should open directly into the creation workflow, not a marketing landing page. Users choose between:

- Capture photo from camera.
- Upload existing photos.
- Start with a layout and fill slots later.

Why: this keeps the app action-oriented. A marketing-style hero would slow down a tool whose value is immediate creation.

### 2. Photo Input

Users can add images through:

- Browser camera capture using local device camera.
- File upload from device storage.
- Drag-and-drop on desktop.

The app should support at least 2 and up to 4 photo slots for MVP. If a user has only one photo, the UI should still allow previewing templates but clearly mark empty slots.

### 3. Manual Remote Workflow

Because the MVP has no live room, the app should support a practical manual flow:

- User creates or selects a layout.
- App shows a short share prompt that users can copy into chat, asking friends to send selfies in the expected orientation.
- Host uploads received images into the remaining slots.

This is not as seamless as live collaboration, but it avoids premature backend complexity and keeps privacy strong.

### 4. Layouts

MVP layouts:

- 2-photo vertical photobooth strip.
- 3-photo stacked strip.
- 4-photo grid.
- 4-photo classic strip.

Each layout should define stable aspect ratios so the editor does not jump while images load. Layout selection should be visual, using thumbnails rather than text-heavy cards.

### 5. Styling Tools

MVP styling tools:

- Frame theme selector.
- Caption text.
- Optional date text.
- Light sticker placement from a curated sticker set.
- Filter selector with a small number of presets.

Recommended initial themes:

- Soft pop: friendly, bright, social.
- Midnight flash: dark booth feel with sharp accents.
- Paper strip: nostalgic printed photobooth style.

Why: these themes cover different emotional tones without forcing a large design system early.

### 6. Export

Users can export the final composition as a PNG or JPEG generated client-side. The app should provide:

- Download button.
- Copy/share guidance for platforms where direct Web Share API is unavailable.
- Optional browser-native share action when supported.

The app should not silently upload the final photo.

## UX Flow

1. User opens app.
2. User selects a layout or starts by adding photos.
3. User captures/uploads local photos.
4. User arranges crop/position per slot.
5. User chooses frame, filter, caption, sticker, and date.
6. User previews final result.
7. User exports/downloads the image.
8. User can start another composition without leaving the app.

The workflow should be forgiving. Users should be able to replace a photo, undo basic styling choices, and return to layout selection without losing already-added images where possible.

## Information Architecture

The main app should be organized around one creator surface:

- Top area: project title, reset/new controls, export action.
- Main area: photobox preview canvas.
- Side or bottom controls: photos, layout, style, text, stickers, export.

On mobile, controls should become bottom tabs or segmented panels. The preview remains the primary object, and controls should never cover critical parts of the composition without a clear dismiss path.

## Visual Direction

The app should feel like a modern social creation tool, not a dashboard. The visual tone should be playful but controlled: expressive frames, tactile controls, clear preview, and minimal explanatory copy.

UI quality requirements:

- Use real visual thumbnails for layouts and themes.
- Keep touch targets at least 44px.
- Use Lucide or consistent vector icons for actions.
- Avoid emoji as structural icons.
- Support responsive layouts from small mobile screens to desktop.
- Respect reduced-motion preferences.
- Keep text readable and avoid UI overlap around the preview/editor.

## Privacy Requirements

- Photos must be processed locally in the browser for MVP.
- The product must not save user photos in a database.
- The UI should clearly state that photos stay local during composition.
- Export happens only after explicit user action.
- If object URLs are used for previews, they should be revoked when images are removed or the session resets.
- No analytics event should include image data, filenames, captions, or other sensitive content.

## Technical Direction

The current project is a Next.js 16.2.6 app with React 19.2.4, Tailwind CSS 4, shadcn/ui, Radix UI, and Lucide React. The implementation should remain JavaScript-only for application code, matching the project instruction that TypeScript is not allowed for new code.

Recommended frontend modules:

- `PhotoInput`: camera, upload, drag-and-drop.
- `PhotoSlot`: image preview, replace/remove, crop positioning.
- `LayoutPicker`: visual template selection.
- `PhotoboxCanvas`: deterministic composition preview and export rendering.
- `StylePanel`: frame, filter, caption, date, sticker controls.
- `ExportPanel`: download and share actions.

For export, use client-side canvas rendering. This avoids server cost and prevents photo storage. The trade-off is that browser canvas work can become expensive on low-end devices, so the MVP should keep image count and export resolution bounded.

## Error Handling

Expected errors:

- Camera permission denied.
- Camera unavailable.
- Unsupported image format.
- File too large.
- Canvas export failure.
- Browser does not support Web Share API.

Each error should explain the cause and provide a recovery path. For example, if camera permission fails, offer upload as fallback. If Web Share API is unavailable, keep download available.

## Performance Requirements

- Use compressed previews where possible.
- Avoid rendering huge original images directly into the editor.
- Cap input image dimensions before composition when practical.
- Keep initial load focused on the editor shell.
- Lazy-load heavier editor tools if implementation complexity remains reasonable.
- Reserve layout dimensions to prevent cumulative layout shift.

## Accessibility Requirements

- All controls need visible labels or accessible labels.
- Keyboard users must be able to navigate file input, layout selection, styling controls, and export.
- Focus states must remain visible.
- Caption inputs need explicit labels.
- Color filters and theme choices must not rely on color alone; include names and preview thumbnails.
- Error messages should be placed near the relevant control.

## Success Metrics

For MVP validation:

- User can create a complete photobox result in under 3 minutes.
- User can complete the flow without account creation.
- Export succeeds on modern desktop and mobile browsers.
- At least 80% of test users understand that photos are not stored server-side.
- At least 70% of test users say the output feels shareable.

## Roadmap

### Phase 1: Frontend-Only MVP

- Local camera capture.
- Local upload.
- 2-4 photo layouts.
- Styled frame themes.
- Caption/date/sticker/filter controls.
- Client-side export.
- No DB, no live room, no server photo storage.

### Phase 2: Guided Remote Collaboration Without Photo Storage

- Better copy prompts for asking friends to send source photos.
- Import helper for multiple images.
- Preset templates for couples, best friends, birthdays, and anniversaries.
- Optional local draft persistence using browser storage only if users explicitly opt in.

### Phase 3: Live Room Exploration

- Evaluate WebRTC-based live room using ephemeral signaling only.
- Prefer open-source or self-hostable options if privacy and control are the top priority.
- Consider managed providers if speed, stability, and lower ops burden become more important.
- Continue the rule that final photos are not stored in a database.

## Key Trade-Offs

Frontend-only is the right starting point because it maximizes privacy and delivery speed. The trade-off is that the experience is manual for remote users and cannot provide true live presence.

Avoiding a database reduces security and compliance risk. The trade-off is no saved gallery, no cross-device drafts, and no automatic re-download after closing the browser.

Skipping AI compositing keeps the app fast and predictable. The trade-off is that the result is a stylized collage, not a realistic same-location group photo.

## Implementation Defaults

- Initial export presets should include square `1080x1080`, story `1080x1920`, and classic strip `1200x1800`.
- Local draft persistence is out of scope for Phase 1. It can be revisited in Phase 2 only with explicit opt-in.
- Initial visual themes are Soft Pop, Midnight Flash, and Paper Strip.
- Initial stickers should be simple vector-style accents such as hearts, stars, sparkles, tape, and label tags. They should be implemented as controllable UI assets, not emoji.
- Phase 1 should start with a plain browser canvas pipeline. A canvas helper library is only justified if crop, transform, or export complexity becomes hard to maintain.
