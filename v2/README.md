# Rips V2 — clean-room interactive prototype

This is a **new implementation from scratch** in `v2/`. It does not depend on or modify the existing Next.js demo.

## Run

Open `v2/index.html` in a browser, or serve the directory with:

```sh
python3 -m http.server 8080 --directory v2
```

Then visit `http://localhost:8080`.

## Implemented in this first build

- Responsive premium black/lime Rips-branded lobby, mobile navigation, hero and promotional widget.
- Four collectible categories: Pokémon, Basketball, Baseball and One Piece.
- Standard, Elite and Legendary pack tiers with price filtering.
- Demo pack confirmation and 5.6-second animated reveal.
- Sell/Keep decisions, locally stored demo credits, personal collection, profile and reset.
- Reduced-motion CSS support and visible no-real-funds disclosures.

## Explicit limitations

This is a **front-end prototype**, not a production game or payment application. All balances, cards, values and openings are fictional, with browser-local storage and client-side random selections. Refresh during a pending reveal can result in a charge without a resolved card; this is unacceptable for production. No live payments, Phygitals API, authentication, shipping, audited odds/RTP, legal compliance, secure ledger, admin, or native mobile app are implemented in V2 yet. Category names are illustrative and no third-party licensed card imagery is included.

## Next implementation slices

1. Create a typed Next.js API + PostgreSQL schema, secure auth and account eligibility.
2. Move pack purchase/outcome selection to atomic, idempotent server-side transactions; implement durable pending-reveal recovery.
3. Add versioned odds, RTP simulation, inventory reservation, immutable ledger, reconciliation, and test coverage.
4. Add mock provider interfaces for Phygitals and payment rails; integrate real services only after contract/API/legal review.
5. Build staff back office, shipping/redemption workflow, audit logs and deployment pipeline.

The existing `main` branch is untouched. This prototype is intended for design/product review and iteration before a production migration.
