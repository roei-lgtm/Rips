import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { db } from "../lib/db";
import { seed } from "../prisma/seed";
import {
  catalog,
  purchase,
  resolveOpening,
  publishOdds,
  topup,
  fulfillment,
  savePack,
  simulate,
  adminState,
  resetDemo,
} from "../lib/domain";
beforeAll(async () => {
  execFileSync("node", ["--import", "tsx", "scripts/migrate.ts"], {
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
  });
  await seed();
});
afterAll(async () => {
  await db.$disconnect();
});
beforeEach(async () => {
  await resetDemo("admin", "RESET DEMO");
  await db.pack.update({
    where: { id: "pokemon-0" },
    data: { priceCents: 1000, isActive: true },
  });
  await publishOdds("admin", "pokemon-0", [
    { tierId: "pokemon-t0", weightBps: 6000 },
    { tierId: "pokemon-t2", weightBps: 3000 },
    { tierId: "pokemon-t3", weightBps: 800 },
    { tierId: "pokemon-t5", weightBps: 200 },
  ]);
});
describe("persistent demo business rules", () => {
  it("seeds 32 tiers, eight packs, 100% published odds and computed 72% RTP", async () => {
    const packs = await catalog();
    expect(packs).toHaveLength(8);
    expect(await db.tier.count()).toBe(32);
    for (const p of packs)
      expect(p.rows.reduce((s, r) => s + r.weightBps, 0)).toBe(10000);
    expect(packs.find((p) => p.id === "pokemon-0")?.marketRtp).toBe(72);
  });
  it("charges and reserves exactly once on repeated purchase keys", async () => {
    const key = randomUUID();
    const a = await purchase("demo", "pokemon-0", key),
      b = await purchase("demo", "pokemon-0", key);
    expect(a.id).toBe(b.id);
    expect(
      (await db.wallet.findUniqueOrThrow({ where: { userId: "demo" } }))
        .balanceCents,
    ).toBe(24000);
    expect(await db.opening.count()).toBe(1);
    expect(
      await db.ledgerEntry.count({ where: { type: "pack_purchase" } }),
    ).toBe(1);
  });
  it("rejects an idempotency key used for another pack", async () => {
    const key = randomUUID();
    await purchase("demo", "pokemon-0", key);
    await expect(purchase("demo", "pokemon-1", key)).rejects.toThrow(
      "another pack",
    );
  });
  it("blocks unavailable advertised tiers without silently reweighting or charging", async () => {
    await db.pooledInventory.updateMany({
      where: { tierId: "pokemon-t0" },
      data: { quantityAvailable: 0 },
    });
    await expect(purchase("demo", "pokemon-0", randomUUID())).rejects.toThrow(
      "out of stock",
    );
    expect(
      (await db.wallet.findUniqueOrThrow({ where: { userId: "demo" } }))
        .balanceCents,
    ).toBe(25000);
    expect(await db.opening.count()).toBe(0);
  });
  it("blocks insufficient balance and leaves inventory intact", async () => {
    await db.wallet.update({
      where: { userId: "demo" },
      data: { balanceCents: 1 },
    });
    await expect(purchase("demo", "pokemon-0", randomUUID())).rejects.toThrow(
      "Insufficient",
    );
    expect(await db.opening.count()).toBe(0);
  });
  it("sell credits configured snapshot exactly once and prohibits collect afterward", async () => {
    await publishOdds("admin", "pokemon-0", [
      { tierId: "pokemon-t2", weightBps: 10000 },
    ]);
    await db.pack.update({
      where: { id: "pokemon-0" },
      data: { sellBps: 8000 },
    });
    const o = await purchase("demo", "pokemon-0", randomUUID());
    await resolveOpening("demo", o.id, "sold");
    await resolveOpening("demo", o.id, "sold");
    await expect(resolveOpening("demo", o.id, "collected")).rejects.toThrow(
      "already been resolved",
    );
    expect(
      (await db.wallet.findUniqueOrThrow({ where: { userId: "demo" } }))
        .balanceCents,
    ).toBe(24800);
    expect(await db.ledgerEntry.count({ where: { type: "sell_credit" } })).toBe(
      1,
    );
    await db.pack.update({
      where: { id: "pokemon-0" },
      data: { sellBps: 10000 },
    });
  });
  it("collect is idempotent and cannot be sold afterward", async () => {
    const o = await purchase("demo", "pokemon-0", randomUUID());
    await resolveOpening("demo", o.id, "collected");
    await resolveOpening("demo", o.id, "collected");
    await expect(resolveOpening("demo", o.id, "sold")).rejects.toThrow(
      "already been resolved",
    );
    expect(
      (await db.card.findUniqueOrThrow({ where: { id: o.cardId } })).status,
    ).toBe("collected");
  });
  it("rejects invalid odds sums and snapshots odds versions", async () => {
    await expect(
      publishOdds("admin", "pokemon-0", [
        { tierId: "pokemon-t0", weightBps: 9999 },
      ]),
    ).rejects.toThrow("100.000%");
    const o = await purchase("demo", "pokemon-0", randomUUID());
    const next = await publishOdds("admin", "pokemon-0", [
      { tierId: "pokemon-t3", weightBps: 10000 },
    ]);
    const stored = await db.opening.findUniqueOrThrow({ where: { id: o.id } });
    expect(stored.oddsVersionId).toBe(o.oddsVersionId);
    expect(stored.oddsVersionId).not.toBe(next.id);
    expect(stored.outcomeMarketValueCents).toBe(o.outcomeMarketValueCents);
  });
  it("admin pack edits appear in player catalog", async () => {
    const p = (await catalog()).find((p) => p.id === "pokemon-0")!;
    await savePack("admin", p.id, {
      ...p,
      title: "Updated Trainer",
      priceCents: 1200,
      accentHex: "#A899E9",
    });
    const updated = (await catalog()).find(
      (candidate) => candidate.id === p.id,
    )!;
    expect(updated.priceCents).toBe(1200);
    expect(updated.accentHex).toBe("#A899E9");
    await savePack("admin", p.id, { ...p, title: "Trainer Pack" });
  });
  it("simulation is deterministic and never mutates live wallet or stock", async () => {
    const p = (await catalog())[0];
    const before = await db.wallet.findMany(),
      stock = await db.pooledInventory.findMany();
    const a = simulate(p.rows, p.priceCents, 42),
      b = simulate(p.rows, p.priceCents, 42);
    expect(a).toEqual(b);
    expect(Object.values(a.counts).reduce((s, n) => s + n, 0)).toBe(10000);
    expect(await db.wallet.findMany()).toEqual(before);
    expect(await db.pooledInventory.findMany()).toEqual(stock);
  });
  it("simulated top-ups are idempotent and excluded from pack sales", async () => {
    const key = randomUUID();
    await topup("demo", 5000, key);
    await topup("demo", 5000, key);
    expect((await adminState()).metrics.topups).toBe(5000);
    expect((await adminState()).metrics.sales).toBe(0);
    expect(
      (await db.wallet.findUniqueOrThrow({ where: { userId: "demo" } }))
        .balanceCents,
    ).toBe(30000);
  });
  it("shipping threshold is strictly greater and requests are persistent/idempotent", async () => {
    await publishOdds("admin", "pokemon-0", [
      { tierId: "pokemon-t6", weightBps: 10000 },
    ]);
    const high = await purchase("demo", "pokemon-0", randomUUID());
    await resolveOpening("demo", high.id, "collected");
    await db.setting.update({
      where: { key: "shippingThresholdCents" },
      data: { value: 30000 },
    });
    await expect(fulfillment("demo", high.id)).rejects.toThrow(
      "does not exceed",
    );
    await db.setting.update({
      where: { key: "shippingThresholdCents" },
      data: { value: 25000 },
    });
    const a = await fulfillment("demo", high.id),
      b = await fulfillment("demo", high.id);
    expect(a.id).toBe(b.id);
    expect(a.status).toBe("requested");
  });
  it("concurrent purchase retries never double debit or allocate a card twice", async () => {
    await publishOdds("admin", "pokemon-0", [
      { tierId: "pokemon-t6", weightBps: 10000 },
    ]);
    const key = randomUUID();
    const results = await Promise.allSettled([
      purchase("demo", "pokemon-0", key),
      purchase("demo", "pokemon-0", key),
    ]);
    expect(results.some((r) => r.status === "fulfilled")).toBe(true);
    const retry = await purchase("demo", "pokemon-0", key);
    expect(await db.opening.count()).toBe(1);
    expect(
      (await db.wallet.findUniqueOrThrow({ where: { userId: "demo" } }))
        .balanceCents,
    ).toBe(24000);
    expect(await db.card.count({ where: { status: "reserved" } })).toBe(1);
    expect(retry.cardId).toBeTruthy();
  });
  it("only one opening can reserve the final unique card", async () => {
    await db.card.updateMany({
      where: { tierId: "pokemon-t6" },
      data: { status: "sold" },
    });
    const last = await db.card.findFirstOrThrow({
      where: { tierId: "pokemon-t6" },
    });
    await db.card.update({
      where: { id: last.id },
      data: { status: "in_stock" },
    });
    await publishOdds("admin", "pokemon-0", [
      { tierId: "pokemon-t6", weightBps: 10000 },
    ]);
    const results = await Promise.allSettled([
      purchase("demo", "pokemon-0", randomUUID()),
      purchase("demo", "pokemon-0", randomUUID()),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await db.opening.count()).toBe(1);
    expect(
      (await db.wallet.findUniqueOrThrow({ where: { userId: "demo" } }))
        .balanceCents,
    ).toBe(24000);
  });
  it("rejects cross-category odds and unstocked activation", async () => {
    await expect(
      publishOdds("admin", "pokemon-0", [
        { tierId: "baseball-t0", weightBps: 10000 },
      ]),
    ).rejects.toThrow("category");
    const p = (await catalog()).find((p) => p.id === "pokemon-0")!;
    await db.pooledInventory.updateMany({
      where: { tierId: "pokemon-t0" },
      data: { quantityAvailable: 0 },
    });
    await expect(savePack("admin", p.id, p)).rejects.toThrow(
      "Activation requires",
    );
  });
});
