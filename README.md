# RIPS by Lonestar

A mobile-first, connected collectibles **web demo**. `/play` is the player experience; `/admin` is the operations workspace. All wallets, top-ups, values, trades and shipping are simulated. No payments, gambling infrastructure, licensed character art, real addresses or carrier calls are included.

## Run locally

Requires Node **24** (or Node 22.13+ with `node:sqlite`) and npm. Use the existing checkout; cloud tasks are already isolated and do not need another worktree.

```bash
cd /workspace/Rips # on your machine, use your checkout directory
npm install
npm run setup
npm run dev
```

Open the app on port 3000, with `/play` and `/admin` as the entry routes. No credentials or external service is needed. `npm run setup` generates Prisma's client, applies the versioned SQLite migrations and seeds a database **only if no users exist**. It does not reset existing activity. The default database is `prisma/demo.db`. To select another local file, set `DATABASE_URL=file:./your-demo.db`; paths resolve relative to `prisma/`. `.env.example` documents this setting; the built-in default also works without an environment file.

```bash
npm run typecheck
npm test
npm run test:e2e
npm run build
npm start
```

Playwright uses `/usr/bin/chromium` in this cloud environment. On another machine, set `CHROMIUM_PATH` to a Chromium/Chrome executable, or install Playwright Chromium and adjust the launch configuration. E2E tests explicitly reset **demo** activity in the running database. Domain tests use a separate `prisma/test.db`. Never point demo tests at data you want to preserve.

## Workflow and implementation

- Next.js 15 App Router, React 19, TypeScript, custom responsive UI, Lucide icons, Recharts and locally bundled DM Sans.
- Prisma 6.19, SQLite via the engine-free `@prisma/adapter-libsql` local-file driver, Zod request validation. All normal prizes use server-side `crypto.randomInt`; only admin simulation uses a deterministic seed.
- Prices and balances are integer cents. Odds are integer basis points totaling 10,000. Purchase reserves exactly one outcome and debits once in a transaction; server-enforced resolution is mutually exclusive and idempotent. Pooled pulls become immutable card snapshots with a pool reference.
- Odds versions are retained per opening. Unavailable advertised tiers block purchases; there is no silent reweighting. Pack configuration is shared by player and admin.
- Ledger records balance before/after. Edits produce audit records. Analyst mode is blocked from mutations by the API. **Demo role switching is not authentication**; this app intentionally exposes local demo accounts and must not be publicly deployed as a secure service.
- Shipping is strictly above the configured threshold, defaults to $250, and records a simulated fulfillment request. State transitions are validated. No actual labels or shipments.
- Draft changes and a running local process do not publish the cloud environment.

### Engine-free migration tooling

The environment blocks `binaries.prisma.sh`. Instead of disabling checksum or TLS verification, the app uses Prisma's JS query compiler and the official local libSQL adapter. `scripts/generate.ts` invokes the pinned Prisma generator through its internal API with engine downloading skipped because Rust engines are unused. Schema validation runs through Prisma WASM. `npm run db:migrate` applies the checked-in SQL migrations with Node's built-in SQLite driver, checks their SHA-256 hashes against `_rips_migrations`, and wraps each migration in a transaction. Do **not** use `prisma migrate dev` in this restricted environment. Changes to the schema require a new reviewed SQL migration; do not regenerate an already applied migration. The initial migration was generated from Prisma's DMMF by `scripts/create-migration.ts`.

This is a documented tooling deviation from the recommended CLI, not a change to the relational model. For Postgres, use a suitable Prisma adapter, a new datasource and equivalent Postgres migrations. Internal generator APIs are pinned at 6.19; revalidate before upgrading Prisma.

## Seed and assets

Seed: 1 admin, 1 analyst, 3 players, 4 categories, 8 packs, **32 illustrative tiers**, 192 unique high-value cards and 3,200 pooled low-value units. The primary demo wallet starts at $250. These are fictional collectibles, not an import of 5,301 real cards.

The $10 original packs have $1 / $10 / $20 / $100 tiers at 60% / 30% / 8% / 2%: **72% expected market RTP**. The $50 After Hours packs have 40% / 40% / 18% / 2% at $4 / $20 / $100 / $750: **85.2% expected market RTP**. The 96% business target is displayed separately. Default sell policy is 100% of market value; it is editable per pack.

`public/assets/manifest.json` records original assets. `scripts/assets.ts` creates editable SVG foil packs, category symbols, original card artwork and 900×1200 transparent PNG pack assets. `npm run assets` regenerates them. The four original symbols are a lightning crest, nautical anchor, basketball and stitched baseball. Third-party character art, logos and category emblems are not copied. SVG source files and generated PNGs are included.

The reference images mentioned in the PRD were **not attached**. The layout follows the written hierarchy and design tokens, but no pixel-perfect comparison to the approved reference can be claimed. Supply those references for a subsequent visual review.

## Admin usage

Dashboard metrics are derived from actual demo activity; see [metric glossary](docs/METRICS.md). Use Packs to create, edit, duplicate, deactivate or archive packs. New packs are inactive until category-appropriate odds are published; activation also requires stock. Archived packs keep historical records. Category changes for configured packs are blocked to preserve valid odds; create a new pack instead.

Inventory includes pooled add/edit and adjustments with minimum-stock alerts, tracked-card add/edit, category/status/search/sort and CSV import/export. Export provides a template. CSV imports create in-stock records, do not overwrite IDs and reject allocated snapshots. If a row fails, prior imported rows are retained and the UI reports the count. Import only original or authorized artwork. Pack art is selected from local category assets; external image URLs are not accepted.

Odds & RTP displays market and sell-value RTP separately, validates stock and sums, versions published tables and simulates 10,000 openings without touching live state. Users allows immutable wallet adjustments with a reason. Shipping advances only simulated fulfillment. Settings contains demo thresholds, target, starting balance, asset manifest, audit log and explicitly confirmed reset. Reset clears player activity, resets stock and balance, and preserves pack settings and audit history.

## Handoff

- [Design tokens](DESIGN_TOKENS.md)
- [Metric glossary](docs/METRICS.md)
- [Acceptance and limitations](docs/ACCEPTANCE.md)
- [Test report](docs/TEST_REPORT.md)
- [Screenshot gallery](docs/SCREENSHOTS.md)
- [Production gaps](docs/PRODUCTION_GAPS.md)
- [Supplied product specification](docs/PRD.md)

No production readiness or legal approval is implied. Reference screenshots require user review; the demo does not connect to real payments, KYC, redemption, vaults or shipping.
