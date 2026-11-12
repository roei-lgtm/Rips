# Vault Rips Casino — clean rebuild

A brand-new Next.js application replacing the prior codebase on `main`. The previous project remains recoverable on `backup/pre-vault-rips-rebuild-2026-11-12`.

## Run
```bash
npm install
npm run dev
```
Open http://localhost:3000.

## First playable slice
- Premium slot-inspired collectible pack lobby with Pokémon, Basketball, Baseball and One Piece categories
- Standard, Elite and Legendary tiers
- Slot-style suspense/reveal animation, Sell / Keep demo choices
- Responsive wallet and collection UI with **illustrative local demo credits only**
- Server-generated illustrative card outcomes using `node:crypto`, without real-money charging

## Critical limitations
**Not production-ready.** No real deposits, payouts, prizes, physical inventory ownership, audited RNG, auth, transaction ledger, redemption, back office or Phygitals integration. Client-side credits are not real funds and the server's demo endpoint does not commit an inventory outcome or perform a purchase. This is the first product slice, not fulfillment of the full PRD.

## Required next slices
1. PostgreSQL/Prisma and secure identity, sessions, age/jurisdiction gates.
2. Atomic idempotent pack purchases, audited outcomes and inventory allocation, ledger.
3. Sell/Keep resolution with server-side ownership and buyback quotes.
4. Phygitals inventory adapters, reconciliation, shipping and redemption.
5. Admin/back office, RTP configuration, compliance and operational reporting.
6. End-to-end tests, observability, deployment hardening and mobile UX QA.

Business economics and physical entitlements must never be inferred from this illustrative demo.
