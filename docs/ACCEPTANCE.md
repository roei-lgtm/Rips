# Acceptance status

| PRD area                       | Delivered / validation                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Player hierarchy at 390×844    | Header, four category tabs, hero/side foil packs, dots, title, contents, min/max/odds, glossy buy and bottom pill nav; screenshots captured                        |
| Approved reference match       | **Pending reference files and visual approval**. Only the PRD was attached; no pixel-perfect comparison is claimed                                                 |
| Category symbol consistency    | Four original category symbols in tabs, foil fronts, category information and contrast-aware CTA artwork                                                           |
| Same-category variants         | Original and After Hours change image, accent, price, range and published odds; keyboard and refresh checked                                                       |
| Original pack assets           | Eight transparent 900×1200 PNGs plus editable SVGs; four distinct categories. User aesthetic review remains separate from functional checks                        |
| Odds                           | Published tier probabilities, total 100.000%, representative imagery, explicit tier-selection explanation and separate market/sell RTP                             |
| Purchase persistence           | Transactional wallet debit, single reservation, persistent opening, cryptographic server RNG, scoped idempotency key                                               |
| Opening/reveal                 | Three-second foil sequence with skip; reduced motion avoids intensity. Reveal uses stored outcome                                                                  |
| Sell / collect                 | Explicit sell confirmation, exclusive server resolution, idempotent credit/collection, refresh persistence                                                         |
| Admin/player connection        | Pack price/color/asset configuration is shared; edited price verified in browser, color verified in domain tests                                                   |
| Inventory                      | Unique tracked cards, pooled units and snapshots, no negative stock, low-stock thresholds, adjustments with reason, manual add/edit, CSV import/export             |
| Odds editor                    | 100% validation, eligible stock checks, version publication, separate market and sell RTP, seeded 10k simulation with no live mutations                            |
| Metrics                        | Ledger/opening-derived values; definitions, demo qualifiers, periods, category/pack volume and economic views                                                      |
| Shipping                       | Strictly above threshold, persistent simulated requests, server-validated lifecycle and demo-only placeholders; browser-verified request and approval              |
| Accessibility / responsiveness | Semantic headings, button labels, focus trapping, Escape, keyboard carousel, reduced motion, mobile/desktop and small-screen checks. Not an independent WCAG audit |
| Automated tests                | Domain rules plus Playwright player/admin flows, screenshots and responsive/deep-link checks; details in TEST_REPORT.md                                            |
| Reproducible startup           | Fresh-directory npm ci, migration/seed, setup repeated without duplication, TypeScript and functional startup verified on this host                                |
| Excluded clutter               | No winners feeds, banners, leaderboards, chat, autoplay or casino sections                                                                                         |

## Implementation boundaries

- Initial release seeds the four-category design specified in Gate A. A Yu-Gi-Oh pack/category is not seeded; there is no licensed duel art.
- Pack deletion is a non-destructive archive/hide operation to preserve historical ledger and outcomes.
- Configured pack categories are immutable after odds publication; create a new pack for a different category.
- Asset management selects/references locally shipped original assets. Arbitrary upload processing, license verification and an external asset CDN are outside this demo.
- Seeded tiers have fixed market values. Inventory acquisition costs, representative art, grade, vendor, certificate, vault reference and stock are editable; selecting a tier determines a card's market value.
- Lightweight custom React/CSS primitives replace Tailwind, shadcn, Framer Motion and React Hook Form; Next.js, TypeScript, Prisma, Zod, Recharts, Vitest and Playwright are used.
- Prisma generation uses a pinned engine-free programmatic generator; reviewed SQL migrations use Node SQLite with checksums. The restricted host prevented native Prisma CLI engine downloads. No verification was disabled.
- Demo identity is a visible local stub, not secure authentication. See PRODUCTION_GAPS.md before any separately authorized production work.
- Screenshots establish the implemented layout. They do not establish fidelity to missing references, performance on physical devices or independent accessibility certification.
