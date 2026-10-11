import { randomInt, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { z } from "zod";
export class DomainError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
function fail(message: string, status = 400): never {
  throw new DomainError(message, status);
}
function ensureAsset(asset: string) {
  if (!existsSync(path.join(process.cwd(), "public", asset)))
    fail("Artwork file is missing. Select an existing original asset.");
}
const keySchema = z.string().min(8).max(150);
const cents = z.number().int().min(1).max(100000000);
export const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value % 100 === 0 ? 0 : 2,
  }).format(value / 100);
const packInclude = {
  category: true,
  oddsVersions: {
    where: { isPublished: true },
    orderBy: { version: "desc" as const },
    take: 1,
    include: {
      rows: {
        include: {
          tier: {
            include: { pools: true, cards: { where: { status: "in_stock" } } },
          },
        },
      },
    },
  },
};
export function stock(tier: {
  pools: { quantityAvailable: number }[];
  cards: unknown[];
}) {
  return (
    tier.pools.reduce((a, p) => a + p.quantityAvailable, 0) + tier.cards.length
  );
}
export async function catalog() {
  const packs = await db.pack.findMany({
    include: packInclude,
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });
  return packs.map((p) => {
    const rows = (p.oddsVersions[0]?.rows ?? []).map((r) => ({
      tierId: r.tierId,
      label: r.tier.label,
      weightBps: r.weightBps,
      valueCents: r.tier.marketValueCents,
      sellCents: Math.floor((r.tier.marketValueCents * p.sellBps) / 10000),
      stock: stock(r.tier),
      minStock: r.tier.minStock,
      image:
        r.tier.pools[0]?.imageAsset ??
        r.tier.cards[0]?.imageAsset ??
        `/assets/cards/${p.categoryId}-${r.tierId.split("t").pop()}.svg`,
    }));
    const ev = rows.reduce((a, r) => a + r.weightBps * r.valueCents, 0) / 10000;
    return {
      ...p,
      oddsVersions: undefined,
      oddsVersion: p.oddsVersions[0]?.version ?? 0,
      rows,
      minCents: Math.min(...rows.map((r) => r.valueCents)),
      maxCents: Math.max(...rows.map((r) => r.valueCents)),
      marketRtp: (ev / p.priceCents) * 100,
      sellRtp: ((ev * p.sellBps) / 10000 / p.priceCents) * 100,
      available:
        p.isActive &&
        rows.length > 0 &&
        rows.every((r) => r.stock > 0) &&
        rows.reduce((s, r) => s + r.weightBps, 0) === 10000,
    };
  });
}
async function audit(
  tx: Prisma.TransactionClient,
  actor: string,
  entityType: string,
  entityId: string,
  action: string,
  payload: unknown,
) {
  await tx.auditLog.create({
    data: {
      actorId: actor,
      entityType,
      entityId,
      action,
      payloadJson: JSON.stringify(payload),
    },
  });
}
async function ledger(
  tx: Prisma.TransactionClient,
  userId: string,
  type: string,
  amountCents: number,
  key: string,
  openingId?: string,
  reason?: string,
) {
  const wallet = await tx.wallet.findUniqueOrThrow({ where: { userId } });
  if (wallet.balanceCents + amountCents < 0)
    fail("Insufficient demo balance. Add demo funds to continue.", 409);
  const result = await tx.wallet.updateMany({
    where: { userId, version: wallet.version },
    data: {
      balanceCents: { increment: amountCents },
      version: { increment: 1 },
    },
  });
  if (!result.count) fail("Wallet changed. Please retry.", 409);
  return tx.ledgerEntry.create({
    data: {
      userId,
      type,
      amountCents,
      idempotencyKey: key,
      openingId,
      reason,
      balanceBeforeCents: wallet.balanceCents,
      balanceAfterCents: wallet.balanceCents + amountCents,
    },
  });
}
export async function purchase(
  userId: string,
  packId: string,
  requestKey: string,
) {
  keySchema.parse(requestKey);
  const idempotencyKey = `purchase:${userId}:${requestKey}`;
  return db.$transaction(
    async (tx) => {
      const prior = await tx.opening.findUnique({
        where: { idempotencyKey },
        include: { card: true, pack: true },
      });
      if (prior) {
        if (prior.packId !== packId)
          fail("Idempotency key belongs to another pack.", 409);
        return prior;
      }
      const pack = await tx.pack.findUnique({
        where: { id: packId },
        include: packInclude,
      });
      if (!pack?.isActive || pack.isHidden)
        fail("This pack is unavailable.", 409);
      const version = pack.oddsVersions[0];
      if (
        !version ||
        version.rows.reduce((s, r) => s + r.weightBps, 0) !== 10000
      )
        fail("Pack odds are not published correctly.", 409);
      if (version.rows.some((r) => r.weightBps > 0 && stock(r.tier) === 0))
        fail(
          "A published tier is out of stock. This pack is paused until restocked or odds are republished.",
          409,
        );
      const wallet = await tx.wallet.findUniqueOrThrow({ where: { userId } });
      if (wallet.balanceCents < pack.priceCents)
        fail("Insufficient demo balance. Add demo funds to continue.", 409);
      const roll = randomInt(10000);
      let cursor = 0;
      const row = version.rows.find((r) => (cursor += r.weightBps) > roll)!;
      let card;
      let pooledUnitRef: string | undefined;
      const unitRoll = randomInt(stock(row.tier));
      if (unitRoll < row.tier.cards.length) {
        const selected = row.tier.cards[unitRoll];
        const reserved = await tx.card.updateMany({
          where: { id: selected.id, status: "in_stock" },
          data: { status: "reserved", ownerUserId: userId },
        });
        if (!reserved.count) fail("Inventory changed. Please retry.", 409);
        card = await tx.card.findUniqueOrThrow({ where: { id: selected.id } });
      } else {
        let poolCursor = row.tier.cards.length;
        const pool = row.tier.pools.find(
          (p) => (poolCursor += p.quantityAvailable) > unitRoll,
        )!;
        const changed = await tx.pooledInventory.updateMany({
          where: { id: pool.id, quantityAvailable: { gt: 0 } },
          data: {
            quantityAvailable: { decrement: 1 },
            quantityReserved: { increment: 1 },
          },
        });
        if (!changed.count) fail("Inventory changed. Please retry.", 409);
        pooledUnitRef = pool.id;
        card = await tx.card.create({
          data: {
            categoryId: pack.categoryId,
            tierId: row.tierId,
            name: pool.name,
            marketValueCents: pool.unitValueCents,
            sellValueCents: Math.floor(
              (pool.unitValueCents * pack.sellBps) / 10000,
            ),
            acquisitionCostCents: pool.unitAcquisitionCostCents,
            imageAsset: pool.imageAsset,
            status: "reserved",
            ownerUserId: userId,
            inventoryMode: "pooled_snapshot",
          },
        });
      }
      const opening = await tx.opening.create({
        data: {
          userId,
          packId,
          oddsVersionId: version.id,
          cardId: card.id,
          pooledUnitRef,
          priceCents: pack.priceCents,
          outcomeMarketValueCents: card.marketValueCents,
          outcomeSellValueCents: Math.floor(
            (card.marketValueCents * pack.sellBps) / 10000,
          ),
          idempotencyKey,
          randomReference: randomUUID(),
        },
        include: { card: true, pack: true },
      });
      await ledger(
        tx,
        userId,
        "pack_purchase",
        -pack.priceCents,
        idempotencyKey,
        opening.id,
      );
      return opening;
    },
    { timeout: 15000 },
  );
}
export async function resolveOpening(
  userId: string,
  id: string,
  action: "sold" | "collected",
) {
  return db.$transaction(
    async (tx) => {
      const opening = await tx.opening.findUniqueOrThrow({ where: { id } });
      if (opening.userId !== userId)
        fail("Opening does not belong to this demo account.", 403);
      if (opening.status === action) return opening;
      if (opening.status !== "pending")
        fail("This card has already been resolved.", 409);
      const update = await tx.opening.updateMany({
        where: { id, status: "pending" },
        data: { status: action, resolvedAt: new Date() },
      });
      if (!update.count) fail("This card has already been resolved.", 409);
      await tx.card.update({
        where: { id: opening.cardId },
        data: {
          status: action,
          ownerUserId: action === "collected" ? userId : null,
        },
      });
      if (opening.pooledUnitRef)
        await tx.pooledInventory.update({
          where: { id: opening.pooledUnitRef },
          data: { quantityReserved: { decrement: 1 } },
        });
      if (action === "sold")
        await ledger(
          tx,
          userId,
          "sell_credit",
          opening.outcomeSellValueCents,
          `sell:${id}`,
          id,
        );
      return tx.opening.findUniqueOrThrow({ where: { id } });
    },
    { timeout: 15000 },
  );
}
export async function topup(
  userId: string,
  amount: number,
  key: string,
  reason?: string,
) {
  cents.max(100000).parse(amount);
  keySchema.parse(key);
  return db.$transaction(async (tx) => {
    const idempotencyKey = `topup:${userId}:${key}`;
    const prior = await tx.ledgerEntry.findUnique({
      where: { idempotencyKey },
    });
    if (prior) {
      if (prior.amountCents !== amount)
        fail("Idempotency key amount mismatch.", 409);
      return prior;
    }
    return ledger(
      tx,
      userId,
      "demo_topup",
      amount,
      idempotencyKey,
      undefined,
      reason,
    );
  });
}
export async function fulfillment(userId: string, id: string) {
  return db.$transaction(async (tx) => {
    const opening = await tx.opening.findUniqueOrThrow({
      where: { id },
      include: { card: true },
    });
    const setting = await tx.setting.findUniqueOrThrow({
      where: { key: "shippingThresholdCents" },
    });
    if (opening.userId !== userId) fail("Not your card.", 403);
    if (
      opening.status !== "collected" ||
      !["collected", "shipping_requested"].includes(opening.card.status)
    )
      fail("Only collected cards can be shipped.", 409);
    if (opening.outcomeMarketValueCents <= setting.value)
      fail("Card does not exceed the demo shipping threshold.", 409);
    const request = await tx.fulfillmentRequest.upsert({
      where: { openingId: id },
      create: { openingId: id, userId },
      update: {},
    });
    await tx.card.update({
      where: { id: opening.cardId },
      data: { status: "shipping_requested" },
    });
    return request;
  });
}
const openingInclude = {
  card: true,
  pack: { include: { category: true } },
  oddsVersion: { include: { rows: { include: { tier: true } } } },
  fulfillment: true,
};
export async function playerState() {
  const [wallet, openings, transactions, settings] = await Promise.all([
    db.wallet.findUniqueOrThrow({ where: { userId: "demo" } }),
    db.opening.findMany({
      where: { userId: "demo" },
      include: openingInclude,
      orderBy: { createdAt: "desc" },
    }),
    db.ledgerEntry.findMany({
      where: { userId: "demo" },
      orderBy: { createdAt: "desc" },
    }),
    db.setting.findMany(),
  ]);
  return {
    wallet,
    openings,
    transactions,
    settings: Object.fromEntries(settings.map((s) => [s.key, s.value])),
  };
}
export async function adminState(days = 0) {
  const [
    packs,
    cards,
    pools,
    tiers,
    openings,
    users,
    transactions,
    shipping,
    audits,
    settings,
  ] = await Promise.all([
    catalog(),
    db.card.findMany({
      include: { tier: true },
      orderBy: { acquiredAt: "desc" },
    }),
    db.pooledInventory.findMany({ include: { tier: true } }),
    db.tier.findMany(),
    db.opening.findMany({
      include: openingInclude,
      orderBy: { createdAt: "desc" },
    }),
    db.user.findMany({ include: { wallet: true } }),
    db.ledgerEntry.findMany({ orderBy: { createdAt: "desc" } }),
    db.fulfillmentRequest.findMany({
      include: { opening: { include: { card: true, user: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    db.setting.findMany(),
  ]);
  const cutoff = days ? Date.now() - days * 86400000 : 0;
  const os = openings.filter((o) => o.createdAt.getTime() >= cutoff),
    ls = transactions.filter((l) => l.createdAt.getTime() >= cutoff);
  const sales = ls
      .filter((l) => l.type === "pack_purchase")
      .reduce((s, l) => s - l.amountCents, 0),
    payout = os.reduce((s, o) => s + o.outcomeMarketValueCents, 0),
    sell = ls
      .filter((l) => l.type === "sell_credit")
      .reduce((s, l) => s + l.amountCents, 0);
  const metrics = {
    topups: ls
      .filter((l) => l.type === "demo_topup")
      .reduce((s, l) => s + l.amountCents, 0),
    sales,
    count: os.length,
    turnover: sales,
    margin: sales - payout,
    realizedMarketRtp: sales ? (payout / sales) * 100 : 0,
    cashSellRtp: sales ? (sell / sales) * 100 : 0,
    sell,
    held: cards
      .filter((c) =>
        ["collected", "shipping_requested", "shipped"].includes(c.status),
      )
      .reduce((s, c) => s + c.marketValueCents, 0),
    inventoryCost:
      cards
        .filter((c) => c.status === "in_stock")
        .reduce((s, c) => s + c.acquisitionCostCents, 0) +
      pools.reduce(
        (s, p) => s + p.quantityAvailable * p.unitAcquisitionCostCents,
        0,
      ),
    expectedMarketRtp: sales
      ? (os.reduce(
          (s, o) =>
            s +
            o.oddsVersion.rows.reduce(
              (ev, r) => ev + (r.weightBps * r.tier.marketValueCents) / 10000,
              0,
            ),
          0,
        ) /
          sales) *
        100
      : 0,
  };
  const chart = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(Date.now() - (6 - i) * 86400000)
      .toISOString()
      .slice(0, 10);
    return {
      date,
      label: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
      sales:
        os
          .filter((o) => o.createdAt.toISOString().startsWith(date))
          .reduce((s, o) => s + o.priceCents, 0) / 100,
    };
  });
  const categorySales = Object.fromEntries(
    packs.map((p) => [
      p.categoryId,
      os
        .filter((o) => o.pack.categoryId === p.categoryId)
        .reduce((sum, o) => sum + o.priceCents, 0),
    ]),
  );
  const packSales = Object.fromEntries(
    packs.map((p) => [
      p.id,
      os
        .filter((o) => o.packId === p.id)
        .reduce((sum, o) => sum + o.priceCents, 0),
    ]),
  );
  return {
    packs,
    cards,
    pools,
    tiers,
    openings,
    users,
    transactions,
    shipping,
    audits,
    categorySales,
    packSales,
    settings: Object.fromEntries(settings.map((s) => [s.key, s.value])),
    metrics,
    chart,
  };
}
const packSchema = z.object({
  title: z.string().min(2).max(80),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().max(500),
  categoryId: z.enum(["pokemon", "one-piece", "basketball", "baseball"]),
  priceCents: cents,
  accentHex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  secondaryHex: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#FFFFFF"),
  artworkAsset: z
    .string()
    .regex(/^\/assets\/packs\/[a-z0-9-]+\.(png|svg|webp)$/),
  isActive: z.boolean(),
  isHidden: z.boolean().default(false),
  sortOrder: z.number().int().min(0),
  sellBps: z.number().int().min(0).max(10000),
});
export async function savePack(
  actor: string,
  id: string | undefined,
  input: unknown,
) {
  const data = packSchema.parse(input);
  ensureAsset(data.artworkAsset);
  return db.$transaction(async (tx) => {
    const before = id
      ? await tx.pack.findUniqueOrThrow({ where: { id }, include: packInclude })
      : null;
    if (
      before &&
      before.categoryId !== data.categoryId &&
      before.oddsVersions.length
    )
      fail(
        "Duplicate a pack to another category, then publish category-specific odds. Existing pack categories are immutable.",
      );
    if (data.isActive) {
      if (!before)
        fail("Create an inactive pack and publish odds before activation.");
      const rows = before.oddsVersions[0]?.rows ?? [];
      if (
        !rows.length ||
        rows.reduce((s, r) => s + r.weightBps, 0) !== 10000 ||
        rows.some((r) => stock(r.tier) === 0)
      )
        fail("Activation requires valid published odds and stocked tiers.");
    }
    const pack = id
      ? await tx.pack.update({
          where: { id },
          data: {
            ...data,
            symbol: `/assets/categories/${data.categoryId}.svg`,
          },
        })
      : await tx.pack.create({
          data: {
            ...data,
            symbol: `/assets/categories/${data.categoryId}.svg`,
          },
        });
    await audit(tx, actor, "pack", pack.id, id ? "update" : "create", {
      before,
      after: pack,
    });
    return pack;
  });
}
export async function duplicatePack(actor: string, id: string) {
  return db.$transaction(async (tx) => {
    const p = await tx.pack.findUniqueOrThrow({
      where: { id },
      include: {
        oddsVersions: {
          orderBy: { version: "desc" },
          take: 1,
          include: { rows: true },
        },
      },
    });
    const { id: old, oddsVersions, ...data } = p;
    const copy = await tx.pack.create({
      data: {
        ...data,
        slug: `${p.slug}-copy-${randomUUID().slice(0, 6)}`,
        title: `${p.title} Copy`,
        isActive: false,
      },
    });
    if (oddsVersions[0])
      await tx.packOddsVersion.create({
        data: {
          packId: copy.id,
          version: 1,
          rows: {
            create: oddsVersions[0].rows.map((r) => ({
              tierId: r.tierId,
              weightBps: r.weightBps,
            })),
          },
        },
      });
    await audit(tx, actor, "pack", copy.id, "duplicate", { source: id });
    return copy;
  });
}
export async function publishOdds(
  actor: string,
  packId: string,
  input: unknown,
) {
  const rows = z
    .array(
      z.object({
        tierId: z.string(),
        weightBps: z.number().int().min(0).max(10000),
      }),
    )
    .min(1)
    .parse(input)
    .filter((r) => r.weightBps > 0);
  if (rows.reduce((s, r) => s + r.weightBps, 0) !== 10000)
    fail("Odds must total exactly 100.000%.");
  if (new Set(rows.map((r) => r.tierId)).size !== rows.length)
    fail("Duplicate tiers are not allowed.");
  return db.$transaction(async (tx) => {
    const pack = await tx.pack.findUniqueOrThrow({ where: { id: packId } });
    for (const r of rows) {
      const tier = await tx.tier.findUniqueOrThrow({
        where: { id: r.tierId },
        include: { pools: true, cards: { where: { status: "in_stock" } } },
      });
      if (tier.categoryId !== pack.categoryId)
        fail("Tier category must match pack.");
      if (stock(tier) === 0)
        fail("Every published tier must have eligible stock.");
    }
    const old = await tx.packOddsVersion.findFirst({
      where: { packId },
      orderBy: { version: "desc" },
    });
    await tx.packOddsVersion.updateMany({
      where: { packId },
      data: { isPublished: false },
    });
    const next = await tx.packOddsVersion.create({
      data: {
        packId,
        version: (old?.version ?? 0) + 1,
        rows: { create: rows },
      },
    });
    await audit(tx, actor, "odds", next.id, "publish", {
      previous: old?.version,
      version: next.version,
      rows,
    });
    return next;
  });
}
export function simulate(
  rows: {
    weightBps: number;
    valueCents: number;
    sellCents: number;
    tierId: string;
  }[],
  priceCents: number,
  seed = 42,
) {
  let state = seed >>> 0;
  const counts: Record<string, number> = {};
  let market = 0,
    sell = 0;
  for (let i = 0; i < 10000; i++) {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    let cursor = 0;
    const row = rows.find(
      (r) => (cursor += r.weightBps) > (state / 4294967296) * 10000,
    )!;
    counts[row.tierId] = (counts[row.tierId] ?? 0) + 1;
    market += row.valueCents;
    sell += row.sellCents;
  }
  return {
    seed,
    count: 10000,
    counts,
    marketRtp: (market / (10000 * priceCents)) * 100,
    sellRtp: (sell / (10000 * priceCents)) * 100,
  };
}
export async function adjustStock(
  actor: string,
  id: string,
  delta: number,
  reason: string,
) {
  z.number().int().min(-100000).max(100000).parse(delta);
  z.string().min(3).parse(reason);
  return db.$transaction(async (tx) => {
    const before = await tx.pooledInventory.findUniqueOrThrow({
      where: { id },
    });
    if (before.quantityAvailable + delta < 0) fail("Stock cannot be negative.");
    const after = await tx.pooledInventory.update({
      where: { id },
      data: { quantityAvailable: { increment: delta } },
    });
    await audit(tx, actor, "pool", id, "stock_adjustment", {
      before: before.quantityAvailable,
      after: after.quantityAvailable,
      reason,
    });
    return after;
  });
}
export async function saveCard(
  actor: string,
  id: string | undefined,
  input: unknown,
) {
  const schema = z.object({
    categoryId: z.string(),
    tierId: z.string(),
    name: z.string().min(2),
    grade: z.string().nullable().optional(),
    gradingCompany: z.string().nullable().optional(),
    certNumber: z.string().nullable().optional(),
    marketValueCents: cents,
    sellValueCents: z.number().int().min(0),
    acquisitionCostCents: z.number().int().min(0),
    vendor: z.string(),
    imageAsset: z.string().regex(/^\/assets\/cards\/[a-z0-9-]+\.svg$/),
    location: z.string(),
  });
  const data = schema.parse(input);
  ensureAsset(data.imageAsset);
  return db.$transaction(async (tx) => {
    const tier = await tx.tier.findUniqueOrThrow({
      where: { id: data.tierId },
    });
    if (
      tier.categoryId !== data.categoryId ||
      tier.marketValueCents !== data.marketValueCents
    )
      fail("Inventory category/value must match tier.");
    const before = id
      ? await tx.card.findUniqueOrThrow({ where: { id } })
      : null;
    if (before?.status !== "in_stock" && before)
      fail("Allocated card snapshots cannot be edited.");
    const after = id
      ? await tx.card.update({ where: { id }, data })
      : await tx.card.create({ data });
    await audit(tx, actor, "card", after.id, id ? "update" : "create", {
      before,
      after,
    });
    return after;
  });
}
export async function updateSettings(actor: string, input: unknown) {
  const data = z
    .object({
      shippingThresholdCents: z.number().int().min(0),
      rtpTargetBps: z.number().int().min(0).max(20000),
      startingBalanceCents: z.number().int().min(0),
    })
    .parse(input);
  return db.$transaction(async (tx) => {
    const before = await tx.setting.findMany();
    for (const [key, value] of Object.entries(data))
      await tx.setting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      });
    await audit(tx, actor, "settings", "demo", "update", {
      before,
      after: data,
    });
    return data;
  });
}
export async function advanceShipping(
  actor: string,
  id: string,
  status: string,
) {
  return db.$transaction(async (tx) => {
    const request = await tx.fulfillmentRequest.findUniqueOrThrow({
      where: { id },
      include: { opening: true },
    });
    const transitions: Record<string, string[]> = {
      requested: ["approved", "cancelled"],
      approved: ["packing", "cancelled"],
      packing: ["shipped", "cancelled"],
      shipped: [],
      cancelled: [],
    };
    if (!transitions[request.status]?.includes(status))
      fail("Invalid shipping status transition.");
    const after = await tx.fulfillmentRequest.update({
      where: { id },
      data: {
        status,
        trackingPlaceholder:
          status === "shipped" ? `DEMO-${id.slice(-8)}` : null,
      },
    });
    await tx.card.update({
      where: { id: request.opening.cardId },
      data: {
        status:
          status === "cancelled"
            ? "collected"
            : status === "shipped"
              ? "shipped"
              : "shipping_requested",
      },
    });
    await audit(tx, actor, "fulfillment", id, "advance", {
      before: request.status,
      after: status,
    });
    return after;
  });
}
export async function manualAdjustment(
  actor: string,
  userId: string,
  amount: number,
  reason: string,
  key: string,
) {
  z.number()
    .int()
    .min(-100000)
    .max(100000)
    .refine((v) => v !== 0)
    .parse(amount);
  z.string().min(3).parse(reason);
  keySchema.parse(key);
  return db.$transaction(async (tx) => {
    const prior = await tx.ledgerEntry.findUnique({
      where: { idempotencyKey: `adjust:${key}` },
    });
    if (prior) return prior;
    const entry = await ledger(
      tx,
      userId,
      "refund_adjustment",
      amount,
      `adjust:${key}`,
      undefined,
      reason,
    );
    await audit(tx, actor, "wallet", userId, "manual_adjustment", {
      amount,
      reason,
    });
    return entry;
  });
}
export async function resetDemo(actor: string, confirmation: string) {
  if (confirmation !== "RESET DEMO") fail("Type RESET DEMO to confirm.");
  await db.$transaction(async (tx) => {
    await tx.fulfillmentRequest.deleteMany();
    await tx.ledgerEntry.deleteMany();
    await tx.opening.deleteMany();
    await tx.card.deleteMany({ where: { inventoryMode: "pooled_snapshot" } });
    await tx.card.updateMany({
      data: { status: "in_stock", ownerUserId: null },
    });
    await tx.pooledInventory.updateMany({
      data: { quantityAvailable: 200, quantityReserved: 0 },
    });
    const starting = await tx.setting.findUniqueOrThrow({
      where: { key: "startingBalanceCents" },
    });
    await tx.wallet.updateMany({
      where: { user: { role: "player" } },
      data: { balanceCents: starting.value, version: { increment: 1 } },
    });
    await audit(tx, actor, "environment", "demo", "reset", { confirmation });
  });
}
export async function savePool(
  actor: string,
  id: string | undefined,
  input: unknown,
) {
  const data = z
    .object({
      tierId: z.string(),
      name: z.string().min(2),
      imageAsset: z.string().regex(/^\/assets\/cards\/[a-z0-9-]+\.svg$/),
      unitAcquisitionCostCents: z.number().int().min(0),
      minStock: z.number().int().min(0),
      quantityAvailable: z.number().int().min(0),
      expectedQuantityAvailable: z.number().int().min(0).optional(),
      reason: z.string().min(3),
    })
    .parse(input);
  ensureAsset(data.imageAsset);
  return db.$transaction(async (tx) => {
    const tier = await tx.tier.findUniqueOrThrow({
      where: { id: data.tierId },
    });
    if (tier.marketValueCents >= 6000)
      fail("Pooled demo units are for tiers below $60.");
    const before = id
      ? await tx.pooledInventory.findUniqueOrThrow({ where: { id } })
      : null;
    if (before && before.quantityAvailable !== data.expectedQuantityAvailable)
      fail(
        "Stock changed while you were editing. Close and reopen the editor to use current stock.",
        409,
      );
    if (before && before.tierId !== data.tierId)
      fail("Existing pool tier cannot be changed.");
    const values = {
      name: data.name,
      imageAsset: data.imageAsset,
      unitAcquisitionCostCents: data.unitAcquisitionCostCents,
      quantityAvailable: data.quantityAvailable,
    };
    const after = id
      ? await tx.pooledInventory.update({ where: { id }, data: values })
      : await tx.pooledInventory.create({
          data: {
            ...values,
            tierId: tier.id,
            categoryId: tier.categoryId,
            unitValueCents: tier.marketValueCents,
          },
        });
    await tx.tier.update({
      where: { id: tier.id },
      data: { minStock: data.minStock },
    });
    await audit(tx, actor, "pool", after.id, id ? "update" : "create", {
      before,
      after,
      minStock: data.minStock,
      reason: data.reason,
    });
    return after;
  });
}
