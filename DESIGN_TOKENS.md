# RIPS design tokens

| Token              | Value     | Use                             |
| ------------------ | --------- | ------------------------------- |
| Background         | `#0B0B0F` | Player canvas                   |
| Raised surface     | `#1A1A21` | Cards, chrome                   |
| Border             | `#2A2A32` | Quiet separators                |
| Text               | `#F2F2F4` | Primary copy                    |
| Secondary text     | `#A3A3AD` | Supporting copy                 |
| Trainer accent     | `#F5C84B` | Original creature crest pack    |
| Pirate accent      | `#279BFA` | Original nautical pack          |
| Hoops accent       | `#F47A38` | Original basketball pack        |
| Rookie accent      | `#E9434C` | Original baseball pack          |
| After Hours accent | `#A899E9` | Premium variant, all categories |

Palette lives in CSS; accent is read from each pack, never from a category color switch. CTA text selects black/white using WCAG relative luminance. Neutral panels stay neutral. Color is applied to the CTA, selected tab/nav and subtle hero illumination.

Typography: bundled DM Sans; 25–28px player headings, 9–12px supporting copy, 15px CTA. Operations uses compact 10–14px copy. Logo and packaging lettering use an original vector treatment. Mobile buy CTA: 58px, full width, pill, glossy gradient and quiet shadow. Controls target 44px; keyboard focus uses a gold outline.

Player: centered 430px experience on desktop, full viewport on mobile. At 390×844 the header, horizontal category strip, centered foil carousel with cropped neighboring editions, dots, title, contents, three data columns, buy and pill navigation fit on screen. Small heights permit scrolling and retain access to buy. Admin: 225px sidebar, responsive cards and scrollable tables; mobile sidebar opens explicitly.

Motion: 300ms pack entry, 180ms button feedback, sparse 8-second idle foil sheen, 3-second opening sequence with skip. `prefers-reduced-motion` removes shimmer, transitions, particles and opening intensity. No carousel autoplay.

Asset source: `scripts/assets.ts`. Transparent PNGs: 900×1200; editable SVG counterparts and card/symbol vectors included. Original alternatives avoid third-party card art, character marks, capture balls and licensed pirate imagery. Missing approved reference images are documented in README.
