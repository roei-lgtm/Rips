# RIPS by Lonestar — Product Requirements Document

**Version:** 1.0 | **Date:** 11 October 2026 | **Status:** Demo specification | **Language:** English

## 0. Build directive for Codex

Build a working, exceptionally polished, mobile-first **web demo** of RIPS by Lonestar with two connected interfaces: `/play` (consumer) and `/admin` (operations). This is **not a native mobile app** and **not a production gambling or payments system**. Prioritize visual fidelity and interaction quality over feature count. Use the reference images provided in the chat as the primary visual source; do not invent extra sections. Deliver source code, a seeded database, a README, reproducible startup commands, and automated tests. Do not stop at static mockups.

**Reference precedence:** (1) latest approved four-category image showing premium foil packs and pack-colored Buy buttons, (2) preceding simplified charcoal/white/gold design, (3) original Phygitals and Packed screenshots for layout. The latest approved image is a concept, not permission to copy another company's logos or copyrighted card art. Create original brand assets and use licensed/placeholder card imagery if rights are not established.

**Hard rules:** No Last Wins, recent winners, leaderboards, chat, promotional banners, unnecessary pop-ups, or casino clutter. One main CTA per screen. Simple, clear, premium, American comic/sticker influences **only on packaging and subtle details**, not a noisy UI. Pack visual must be the hero.

## 1. Goal and scope

Demonstrate the full loop: select category → browse pack → inspect contents and odds → buy using simulated wallet → cinematic pack-opening animation → reveal one card → Sell or Collect → reflect results in collection, wallet, inventory and admin analytics. Admins configure inventory, pack tiers, odds, prices and monitor simulated activity. No external payment, KYC, shipping or vault API is required to run the demo; build clean interfaces for future integrations.

### Explicit non-goals

Native iOS/Android app; real deposits/withdrawals; real shipping-label purchase; real KYC; production compliance approval; real-money redemption; social feed; tournaments; loyalty systems beyond a placeholder Rewards tab. Do not suggest that the demo is production-ready or legally approved.

## 2. Visual design system — highest priority

**Brand:** RIPS, small optional 'BY LONESTAR' subline. Original energetic brush-style wordmark with restrained tiny crown accent. No third-party brand marks except properly licensed assets.

**Base palette:** `#0B0B0F` near-black background; `#1A1A21` raised surfaces; `#2A2A32` borders; `#F2F2F4` main text; `#A3A3AD` secondary text. **Neutral chrome is fixed**; color is applied to the selected pack's accent, primary CTA, selected navigation highlight and selected carousel details. Never recolor every background panel.

**Pack accents (initial examples, editable per pack):** Pokémon Trainer warm gold `#F5C84B`; Baseball Rookie cherry red `#E9434C`; Basketball Hoops orange `#F47A38`; One Piece Pirate electric azure `#279BFA`; premium pack variants can use silver, violet or black. Accent is driven by **pack configuration**, not hardcoded category: changing packs within Pokémon must change CTA color accordingly. Category identity controls the central symbol and visual motifs. Contrast-aware CTA text (black on bright yellow/orange; white on deep red/blue) must meet WCAG AA where feasible.

**Typography:** modern legible sans-serif (e.g. Inter), with slightly heavier headings; compact and precise. Do not use graffiti typography for navigation or data. **Packaging:** realistic glossy sealed foil, physically plausible crimped edges and reflections; white/silver base with restrained brush strokes, small crowns, lightning/star stickers and a large category symbol. Category symbols: Pokémon = stylized red/white capture-ball-like motif only where licensed; Baseball = stitched baseball; Basketball = basketball; One Piece = straw hat only if licensed; Yu-Gi-Oh = original fantasy duel emblem unless licensed. Provide safe original alternatives for third-party IP. The symbol MUST change across category tabs, packaging, CTA icon and category header. Do not leave a Poké Ball on a baseball pack.

**CTA:** premium glossy rounded pill, 54–60px tall on mobile, full width with 16–24px horizontal padding; pack-accent gradient with subtle specular highlight, refined border, restrained glow and tasteful shadow. Small left icon matches selected pack category. Clear text 'Buy for $10'. States: default, hover, pressed, loading, disabled, insufficient balance. Animations 150–250ms; no overblown pulsing. Secondary action is quiet charcoal outlined pill. Bottom nav charcoal pill with four icons: Packs, Collection, Rewards, Profile.

**Layout reference:** at 390×844 mobile viewport: status/header, horizontally scrollable category tabs, hero carousel with center pack 1.2–1.4× visually larger than cropped adjacent packs, pagination dots, pack title, What's inside button, three compact data columns (Min Value, Max Pull, Odds View), sticky Buy CTA above bottom nav. Avoid scroll overflow in standard mobile heights; on smaller screens allow vertical scrolling while keeping buy accessible. Desktop: responsive centered phone-width play experience (or tasteful wider carousel), not stretched oversized UI.

**Motion:** subtle foil shimmer on idle; swipe easing 250–350ms; purchase feedback; pack tear/reveal cinematic sequence 2–4 seconds with user skip; lightweight particles and burst only during opening; reduced-motion preference removes intensive effects. Target 60fps on modern devices, graceful low-power fallback. No motion on every UI element.

**Image assets:** user-approved concept images are visual references, not web-ready product assets. Produce original high-resolution transparent PNG/WebP pack art for each seeded pack, consistent front-facing geometry, including category symbols and variants. If image-generation assets are not available, use polished placeholder artwork with consistent proportions and clearly mark it for replacement; do not replace the pack with plain CSS rectangles and call the design complete.

## 3. Consumer information architecture and routes

`/play` pack shop; `/play/pack/:slug` or modal What's Inside; `/play/open/:openingId` opening; `/play/reveal/:openingId` result; `/play/collection` saved cards; `/play/rewards` restrained 'Coming soon' state; `/play/profile` demo user, balance and transaction history. Use client-side navigation with deep links and refresh resilience.

### 3.1 Pack shop

Header: logo left, balance plus button right (plus opens **Demo Wallet** modal for simulated top-ups, labeled as demo). Category strip: Pokémon, One Piece, Basketball, Baseball, Yu-Gi-Oh (seed at least first four). Selecting a category changes pack selection, artwork, icon, color, title and information without layout shift. Pack carousel supports swipe, arrow keys, mouse drag and click side pack. Preserve selected category and pack in URL/query or local state. Center hero pack. Under hero: pagination, pack name, What's Inside, Min Value, Max Pull, Odds View and themed Buy button. Price must update with selected pack. No autoplay carousel.

### 3.2 What's Inside and Odds

Accessible bottom sheet on mobile / modal on desktop. Show selected pack artwork/name, a card grid with thumbnail, title, grade if applicable, tier, market value and probability. Explain: displayed probabilities are simulated demo data; odds may be configured by tier, not guaranteed per individual card. Total probability must equal 100%; if tier contains multiple cards, show per-tier odds and explain card selection within tier. Provide close/back. Scrollable content, sticky close action, keyboard Escape.

### 3.3 Buy, opening and reveal

Buy action: check balance, pack active, tier stock available, transaction idempotency; atomically debit demo wallet and reserve exactly one card according to configured weighted odds. No double charge on repeated clicks. Record opening with seed/reference and timestamp. Opening screen: same category/pack, 2–4s cinematic foil tear and glow, skip action; animation does NOT determine outcome. Reveal: one card with art, name, grade/certificate when applicable, market value, 'Collect Card' and 'Sell for $X'. One action only, enforced server-side; state persists across refresh. Sell credits simulated wallet by configured sell value (default market value for demo; explicit if discount); Collect moves card into Collection. After action, success state and link to shop/collection. No auto-sell without confirmation.

### 3.4 Collection

Grid/list of collected cards with image, title, category, grade, estimated value, acquisition date and status. Card detail view. Shipping request is a **simulated request** only and available for cards valued above $250 (strictly >$250) by default; admin may change eligibility threshold. Show 'Request shipping (demo)' only if eligible, and record a pending fulfillment request. No actual shipping. No promise of guaranteed value.

### 3.5 Profile / demo wallet

Demo account balance, wallet history, pack-opening history, sell history, demo balance refill; all labeled 'Demo — no real money'. Rewards tab can be a simple placeholder only, no extra mechanics.

## 4. Back Office routes and functional requirements

Admin desktop-first, responsive tablet; visually quiet and data-dense, same charcoal palette, pack accent only in previews/status, not rainbow tables. Left sidebar with Dashboard, Packs, Inventory, Odds & RTP, Openings, Users, Transactions, Shipping, Settings. Top bar global search, demo environment badge, admin avatar.

### 4.1 Dashboard

Metric cards with definitions and filters (Today/7d/30d/all): Demo Wallet Top-ups, Pack Sales (total pack purchase amount), Openings Count, Turnover (define as pack purchase volume; **do not count wallet recycling twice in one metric**), Pack Gross Margin / theoretical margin, Realized Payout via Sell, RTP realized on openings, RTP expected from odds table, outstanding collected-card value, low-stock tier alerts. Chart pack sales over time and breakdown by category/pack. **Do not call demo wallet top-ups 'revenue' or 'deposits' without demo qualifier.**

### 4.2 Pack Manager

CRUD packs: category, slug, title, description, price, active/hidden, artwork asset, primary/secondary colors, category symbol, min/max pull derived from available outcomes, sell policy, odds config, sorting. Live preview of consumer hero and button. Duplicate pack. Validate no pack activation with invalid odds or insufficient eligible inventory.

### 4.3 Inventory

Two inventory modes: individually tracked high-value cards, and pooled low-value tier units (default < $60). Fields for unique cards: internal ID, category, card title, image, tier, grade/grading company, certificate ID, acquisition cost, vendor, market value, date acquired, location/vault reference, status (in_stock, reserved, pulled, collected, sold, shipping_requested, shipped), timestamps. For pooled inventory: tier, category, quantity, unit acquisition cost, representative art, value, min stock threshold. Support search/filter/sort, manual add/edit, CSV import/export, tier-level restock alert, stock adjustments with audit logs. No negative stock. One card cannot be allocated to two openings. Seed illustrative 32 price tiers, but don't invent or present 5,301 real cards as imported inventory.

### 4.4 Odds & RTP editor

Per-pack weighted outcomes by tier, probability in percent, eligible stock count, market-value payout, expected contribution and expected RTP. Expected RTP = Σ(probability_i × payout_value_i) / pack_price × 100%. Show live validation that weights sum to 100.000% within tolerance and that outcomes are stocked. **96% is a configurable business target, not a guaranteed achieved result.** If payout for Sell differs from market value, show both 'Market-value RTP' and 'Cash sell-value RTP'; never conflate them. Changes create versioned odds configurations; existing openings retain the odds version used. Show preview of 10k simulated openings using deterministic seed (admin-only), distribution and realized RTP for demo. Do not let simulation mutate live demo stock or wallets.

### 4.5 Openings / Users / Transactions

Openings table: opening ID, user, pack, paid amount, outcome, odds version, outcome value, resolution (pending/sold/collected), timestamps. Users: demo account, balance, total purchases, cards held, recent activity. Transactions: immutable ledger entries (demo_topup, pack_purchase, sell_credit, refund_adjustment), with references, amounts and before/after balances. Admin manual adjustment with reason and audit trail; no destructive edits to ledger.

### 4.6 Shipping

List simulated fulfillment requests; card ID, user, estimated value, eligibility, address placeholder (never real PII in seed), status (requested, approved, packing, shipped, cancelled), tracking placeholder. Admin can advance state, never generate real labels or call a carrier. Expose an interface for future 3PL integration.

### 4.7 Settings / audit

Admin role and read-only analyst role for demo, configurable shipping threshold, RTP target, demo wallet starting balance, categories, asset management. Audit log: actor, action, before/after summary, timestamp. Demo reset button with explicit confirmation, restricted to admin.

## 5. Core data model

Use relational schema (SQLite for local demo; ORM migrations; easy migration to Postgres). Minimum entities:

- `User(id, name, role, createdAt)`
- `Wallet(userId, balanceCents, version)`; `LedgerEntry(id, userId, type, amountCents, openingId?, balanceAfterCents, createdAt, idempotencyKey)`
- `Category(id, slug, label, iconAsset, order)`
- `Pack(id, categoryId, slug, title, priceCents, accentHex, artworkAsset, isActive, sortOrder)`
- `Tier(id, categoryId, label, marketValueCents, minStock)`
- `Card(id, categoryId, tierId, name, grade?, certNumber?, marketValueCents, sellValueCents, acquisitionCostCents?, vendor?, imageAsset, status, ownerUserId?, inventoryMode)`
- `PooledInventory(id, categoryId, tierId, quantityAvailable, quantityReserved, unitValueCents)`
- `PackOddsVersion(id, packId, version, isPublished, createdAt)`; `PackOddsRow(id, oddsVersionId, tierId, weightBps)`
- `Opening(id, userId, packId, oddsVersionId, cardId?, pooledUnitRef?, priceCents, outcomeMarketValueCents, outcomeSellValueCents, status, createdAt, resolvedAt?, idempotencyKey)`
- `FulfillmentRequest(id, openingId, userId, status, createdAt)`
- `AuditLog(id, actorId, entityType, entityId, action, payloadJson, createdAt)`

Money stored as integer cents, probability as integer basis points (10,000 = 100%). Use transactions for purchase/allocation and sell/collect. Define pooled unit snapshots so a sold/collected outcome remains traceable. Never use floating point for money. Seed 1 admin, 1 analyst, 3 demo users, four categories, 2–3 packs per category, tiered cards and enough inventory for repeated tests.

## 6. Business rules and definitions

- Demo wallet starts at $250 for primary demo user; top-ups simulated only.
- Purchase price debited once; if insufficient funds, offer simulated top-up modal.
- Weighted RNG uses server-side cryptographically secure randomness for normal demo purchases; deterministic seeded RNG is allowed only in admin simulations/tests, never selectable by player.
- Exclude out-of-stock tiers from purchasable pack only after odds are explicitly republished; do not silently renormalize advertised odds. If active odds point to unavailable stock, block purchases and show admin alert.
- A pack's published odds are snapshotted per opening. An admin edit cannot retroactively change outcomes.
- `pack_sales = sum(pack_purchase)`; `expected_market_RTP = weighted market values / price`; `realized_market_RTP = sum(market values won) / pack sales`; `cash_sell_RTP = sum(actual sell credits) / pack sales` (label as observed cash-outs, not a direct substitute for theoretical RTP); `gross_margin_before_ops = pack_sales - sum(market values allocated)` as an illustrative economic view, not GAAP revenue. Show cost-of-inventory and cash flow separately where relevant.
- Example: $10 pack with outcome tiers $1 (60%), $10 (30%), $20 (8%), $100 (2%) yields expected value $7.20, RTP 72%; **do not label this 96%**. Seed a valid pack table with computed RTP clearly shown and target 96% separately; adjust only through editor.
- Shipment threshold strictly greater than $250 by default.

## 7. Interaction details and accessibility

Touch targets ≥44px, visible focus rings, keyboard-operable carousel, labels on all icon buttons, semantic headings, readable text contrast, loading/error/empty states, error toasts with recovery. Handle reduced motion, slow networks and missing images. Modal focus trapping and escape handling. Persist important state after refresh. Avoid horizontal scrolling except category strip and pack carousel. Currency formatted as USD. User-facing copy concise, American English.

## 8. Recommended implementation

**Stack:** Next.js App Router + TypeScript, Tailwind CSS, shadcn/ui for admin primitives (custom styling for player), Framer Motion for transitions, Prisma + SQLite, Zod validation, React Hook Form, Recharts for admin charts, Vitest + Playwright for tests. If environment prevents a dependency, use equivalent well-maintained tooling and document deviation. One repo, shared domain service layer, seeded DB. Server-side APIs/actions own wallet, inventory and odds; client never decides prizes or edits wallet balance directly. Keep a `DESIGN_TOKENS.md` and a small reusable component library (PackCarousel, FoilPack, PackBuyButton, CategoryTabs, PackInfo, CardReveal, AdminDataTable, RTPBar).

**Routes:** `/play`, `/play/collection`, `/play/rewards`, `/play/profile`, `/play/open/[id]`, `/play/reveal/[id]`, `/admin`, `/admin/packs`, `/admin/inventory`, `/admin/odds`, `/admin/openings`, `/admin/users`, `/admin/transactions`, `/admin/shipping`, `/admin/settings`.

**Asset handoff:** create `/public/assets/packs`, `/public/assets/categories`, `/public/assets/cards`, `/public/assets/brand`; an asset manifest maps category and pack to image/symbol; preserve editable color configuration. Use optimized images and lazy loading for offscreen carousel packs.

## 9. Build phases and review gates

**Gate A — visual fidelity (first):** Implement polished `/play` main screen with four category switches, category-specific symbols, premium pack artwork, matching dynamic glossy buttons and mobile bottom nav. Capture 390×844 screenshots for each category. Compare to approved reference, fix spacing and finish before proceeding.

**Gate B — player flow:** What's Inside, odds, simulated wallet, purchase, opening animation, reveal, Sell/Collect, collection, history. Screenshot every state. No fake clickable controls.

**Gate C — admin:** Dashboard, pack builder/live preview, inventory, odds editor, openings/users/ledger, simulated shipping and audit.

**Gate D — integration & polish:** End-to-end consistency, validation, accessibility, responsiveness, tests, performance and handoff docs.

At the end of each gate, report completed features, screenshots, known gaps and exact next tasks. Never claim pixel-perfect match without screenshot comparison. If design assets are missing, clearly identify missing deliverables and do not substitute a generic dashboard aesthetic.

## 10. Acceptance criteria (must pass)

1. At 390×844, `/play` visually matches approved reference hierarchy: header, category strip, large centered foil pack, side previews, info, pack-colored Buy CTA, bottom nav.
2. Switching Pokémon → Baseball → Basketball → One Piece changes category icon **and** pack front symbol **and** CTA icon; never leaves a Pokémon symbol on another category.
3. Switching packs within the same category changes pack art, accent color, price, min/max and odds as configured.
4. Four distinct, original high-quality foil pack designs are included; no broken or generic placeholder imagery in final reviewed demo.
5. CTA shows accessible default/hover/pressed/loading/disabled states and meets readable contrast.
6. What's Inside reflects published odds; probability total 100%; min/max derived, not hardcoded.
7. Buying a pack debits wallet once, reserves inventory once and creates a persistent opening.
8. Animation is skippable; reveal matches persisted server outcome, not animation randomness.
9. Sell credits correct configured sell value exactly once; Collect adds to Collection exactly once; refresh/retry cannot duplicate either.
10. Admin pack price/color/art edits appear in consumer view after refresh or reactive update.
11. Admin inventory and low-stock counts reflect openings; no negative stock.
12. Admin RTP editor rejects invalid weights and shows expected market and sell RTP separately.
13. Dashboard metrics are computed from ledger/openings and have clear definitions; simulated top-ups are not misrepresented as real deposits.
14. Shipping request only available above configured threshold and remains simulated.
15. Mobile and desktop work; keyboard and reduced-motion flows are usable.
16. Automated tests cover pack selection, odds sum, wallet idempotency, out-of-stock, sell/collect exclusivity, and admin-to-player updates.
17. `npm install`, database migration/seed, and `npm run dev` work from README on a clean machine.
18. No Last Wins, leaderboard, recent winners, casino banners or extra sections appear.

## 11. Required deliverables

Running demo; source repo; migration and seed scripts; original editable brand/pack/category assets or clear asset replacement manifest; `README.md`; `DESIGN_TOKENS.md`; admin metric glossary; Playwright screenshots at 390×844 and 1440×900; automated test report; documented limitations; production-gap checklist (security, legal, licensing, RNG audit, real wallet/payments, KYC, fulfillment, observability).

## 12. Final instruction to Codex

**Build, don't just describe.** Start with Gate A. Use the uploaded images as design references, especially the latest approved four-category layout and color-matched Buy buttons. Ask only for missing assets that block high visual fidelity. Make reasonable technical decisions, document them, and implement the smallest polished complete experience. Do not add features without explicit approval. Prioritize exact category symbol behavior, foil-pack realism, restrained premium color, clean mobile UX and functional admin connectivity.
