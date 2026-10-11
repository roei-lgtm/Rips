# Validation report

Run date: 11 October 2026. Node 24.19.0, Next.js 15.5.27, Prisma 6.19.0, local SQLite/libSQL, Chromium through Playwright.

| Check                                        | Result                                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------- |
| TypeScript                                   | Passed, no type errors                                                                |
| Vitest domain suite                          | **15 passed**, 0 failed, 0 skipped                                                    |
| Playwright end-to-end suite                  | **7 passed**, 0 failed, 0 skipped                                                     |
| Production build                             | Passed, API and dynamic player/admin entry generated                                  |
| Production server API smoke                  | Passed, catalog and persisted wallet returned                                         |
| Fresh directory installation                 | `npm ci` passed in `/tmp/rips-clean`, without copying node_modules or the database    |
| Fresh migration / seed                       | Passed, 8 stocked packs and primary $250 wallet verified through HTTP                 |
| Repeat setup                                 | Passed twice, migration checksums verified, no duplicated seed                        |
| Screenshot artifacts                         | 24 captures, 390×844 mobile, 1440×900 desktop and 320×568 small mobile                |
| Approved visual reference comparison         | **Unrun: reference images were not attached**                                         |
| Physical device FPS / independent WCAG audit | Unrun; no hardware-performance or certification claim                                 |
| Cloud publication / new-task restoration     | Pending user publication; current-instance setup and saved configuration are distinct |

## Domain coverage

Seeded categories and all 32 tiers; published odds total 100%; correct 72% standard-pack RTP; scoped purchase idempotency; insufficient wallet; out-of-stock blocking without renormalization; one-time sell credit; collect/sell exclusivity; frozen opening odds/version/outcome; admin price and accent reflected in catalog; deterministic simulation without wallet/stock changes; idempotent demo top-ups excluded from pack sales; strict shipping threshold and idempotent fulfillment; concurrent duplicate purchases; exactly one reservation of the final unique card; cross-category odds and unstocked activation rejection.

## Browser coverage

Four category/symbol/front/CTA changes; same-category price/art/accent/odds switching; keyboard carousel and query persistence after refresh; loaded adjacent artwork; 100.000% contents and Escape; purchase/open/skip/reveal/collect; collection persistence; sell confirmation/credit; wallet refill and profile history; admin-to-player price edit; API refusal of analyst mutations; all nine admin routes; reduced-motion mode; 320×568 layout with the buy button tested for actual visibility and hit testing; modal focus containment; collection deep-link refresh; eligible demo shipping request and admin approval.

## Functional corrections verified

Native Prisma engine downloading was blocked by the network policy. The shipped engine-free adapter/generator and checksum-verifying migration runner work without disabling package, checksum or TLS verification. Browser checks caught and resolved carousel query persistence, same-origin host comparison through Next's local server, small-screen CTA obstruction, overly flattened category icons and deferred adjacent artwork. Development and production now use separate build directories.

The final production build reports approximately **116 kB first-load JS** for the shared player entry, with the larger operations/chart interface loaded separately. This is a build report, not a physical-device benchmark.

Screenshots show real demo validation activity. QA activity is cleared before handoff so the primary account starts again at $250; the audit log is retained. Tests can reproduce the screenshot activity. The seeded database and original assets are available in the source delivery archive as well as the prepared environment.
