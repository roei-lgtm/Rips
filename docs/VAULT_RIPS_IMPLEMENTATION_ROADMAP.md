# Vault Rips — implementation roadmap (PRD v1.0)

This repository is an existing **Next.js 15 + React 19 + Prisma/SQLite interactive demo**. Preserve working `/play`, `/admin`, original assets, odds versioning, atomic demo pack purchases, sell/keep, demo fulfillment, and tests while moving toward the new Vault Rips PRD.

## Source of truth

The product owner supplied **Vault Rips Casino — Complete PRD & Codex Engineering Specification v1.0 (12 November 2026)**. Implement the full specification incrementally. In particular, distinguish the 96% *target* from actual seed economics and distinguish FMV RTP from buyback RTP.

## Verified current implementation

- Next.js application routes `/play` and `/admin`, React, TypeScript.
- Prisma 6.19 and local SQLite with versioned custom migrations.
- Server-side cryptographic selection, basis-point odds versions, demo wallet ledger records and idempotent pack operations.
- Seed catalog, generated original collectible artwork, back-office economy/inventory screens, Vitest/Playwright coverage.
- All credits, fulfillment, roles and top-ups are **simulated**, not production integrations.

## Gap-based execution, in priority order

### P0 — Safe foundation / transactional architecture

1. Create a secure authentication and session layer (registered user vs staff/admin), authorization guards, rate limiting, and eligibility checks. **Do not use demo role headers as authentication.**
2. Introduce PostgreSQL as the production persistence target with additive, reviewed migrations. Retain SQLite/demo compatibility only where explicitly supported; never reset existing user data.
3. Implement immutable double-entry ledger accounts, categories, journal lines, idempotency scope and balanced postings with concurrency tests. Retain or migrate demo balance history without silently treating it as audited financial accounting.
4. Separate pack purchase and reveal states; commit one durable server outcome and inventory allocation per charge, with compensation/recovery for provider timeouts, refreshes, retries, and concurrent requests.
5. Introduce typed inventory and payment provider adapters with **mock** integrations and verification/reconciliation hooks; do not invent Phygitals endpoints.
6. Add endpoint validation, HTTP error envelopes, audit events, automated integration tests and CI.

### P0 — Customer experience

7. Preserve visual identity and refactor toward routes for homepage, categories, pack details, odds, registration/login, wallet, reveal, decision, collection and profile.
8. Provide a 6–7-second premium pack-opening interaction that reveals an **already committed** card, with skip/recovery/accessibility and Sell/Keep side by side.
9. Implement durable collection ownership, immutable card snapshots, buyback quote/acceptance and redemption requests backed by a **mock fulfillment** adapter.
10. Add responsive/mobile validation, loading/empty/error flows and accessible dialogs.

### P0 — Back office / operational safety

11. Expand existing admin to users, economy approvals/versioning, inventory reconciliation, GGR, wallet and transaction reconciliation, fulfillment queues, permission-based actions and export.
12. GGR must be reported as `pack sales − buybacks − FMV of kept cards` in the proposed Phygitals commercial reporting, separately from cash deposits, taxes, costs and accounting revenue.
13. Add observability, health monitoring, inventory exception alerts and recovery runbooks.

### P1

14. Albums, CRM, advanced reporting/segmentation and native apps are later phases.

## Delivery rules for Codex

- Work on a feature branch and submit a PR; do not rewrite `main` directly.
- First run existing scripts `npm run typecheck`, `npm test`, `npm run build` and E2E if browser is available. Record baseline failures before changes.
- Commit one verified, coherent vertical slice at a time: database + API + UI + tests.
- Preserve current routes/functionality unless an explicit migration path is provided.
- Use minor currency units, explicit odds configuration versions, real inventory constraints, scoped idempotency keys, secure sessions and server-side ownership checks.
- Never turn demo funds, fake shipping, or placeholder provider operations into apparent live transactions.
- Mark incomplete work clearly and document remaining integrations rather than claiming production readiness.

## Launch blockers requiring product/legal decisions

- Definition of 96% RTP (FMV or actual buyback); 85% buyback fixed or configurable; quote expiration.
- Buyback credits: reuse only vs withdrawability; sell-after-keep policy.
- Inventory legal title/custody and whether Phygitals chooses outcomes; official API docs, credentials and SLA.
- Payment processor, supported jurisdictions/currencies, identity/age verification, and compliance approvals.
- Shipping, taxes, insurance, permitted use of category names/art.
- Web responsive vs separate native app at launch.

**Do not enable live deposits, withdrawals or production allocation until the above are resolved, documented and verified.**
