import { test, expect } from "@playwright/test";
test.describe.configure({ mode: "serial" });
test.beforeAll(async ({ request }) => {
  const reset = await request.post("/api/admin/reset", {
    data: { confirmation: "RESET DEMO" },
  });
  expect(reset.ok()).toBeTruthy();
});
test("four categories, dynamic packs, keyboard carousel, odds and mobile screenshots", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/play");
  await expect(
    page.getByRole("heading", { name: "Trainer Pack", exact: true }),
  ).toBeVisible();
  for (const [label, slug, title] of [
    ["Pokémon", "pokemon", "Trainer Pack"],
    ["Baseball", "baseball", "Rookie Pack"],
    ["Basketball", "basketball", "Hoops Pack"],
    ["One Piece", "one-piece", "Pirate Pack"],
  ]) {
    await page.getByRole("tab", { name: label, exact: true }).click();
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await expect(page.locator(".buy-button .symbol")).toHaveAttribute(
      "src",
      `/assets/categories/${slug}-cta-dark.svg`,
    );
    await expect(page.locator(".hero-pack img")).toHaveAttribute(
      "src",
      new RegExp(slug),
    );
    await expect
      .poll(() =>
        page
          .locator(".side-pack img")
          .evaluateAll((images) =>
            images.every(
              (img) =>
                (img as HTMLImageElement).complete &&
                (img as HTMLImageElement).naturalWidth > 0,
            ),
          ),
      )
      .toBeTruthy();
    await page.screenshot({
      path: `docs/screenshots/play-${slug}-390x844.png`,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
  await page.getByRole("tab", { name: "Pokémon", exact: true }).click();
  await page.getByRole("region", { name: "Pack carousel" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("heading", { name: "Trainer After Hours" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Buy for $50" })).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Trainer After Hours" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "What's Inside" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("100.000%", { exact: true })).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/inside-390x844.png" });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("purchase, skip, collect, persistence and connected admin", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/play");
  await expect(page.getByRole("button", { name: "Buy for $10" })).toBeVisible();
  await page.getByRole("button", { name: "Buy for $10" }).click();
  await page.waitForURL(/\/play\/open\//);
  await page.screenshot({ path: "docs/screenshots/opening-390x844.png" });
  await page.getByRole("button", { name: /Skip animation/ }).click();
  await page.waitForURL(/\/play\/reveal\//);
  await expect(
    page.getByRole("button", { name: "Collect Card" }),
  ).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/reveal-390x844.png" });
  await page.getByRole("button", { name: "Collect Card" }).click();
  await expect(
    page.getByText("Added to collection", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Collect Card" })).toHaveCount(
    0,
  );
  await page.getByRole("link", { name: /View collection/ }).click();
  await expect(page.locator(".collection-card")).toHaveCount(1);
  await page.screenshot({ path: "docs/screenshots/collection-390x844.png" });
  const admin = await (await request.get("/api/admin")).json();
  expect(admin.metrics.count).toBe(1);
  expect(admin.metrics.sales).toBe(1000);
  expect(admin.openings[0].status).toBe("collected");
});
test("sell confirmation, top-up, profile, and screenshots", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/play");
  await page.getByRole("button", { name: "Buy for $10" }).click();
  await page.waitForURL(/\/play\/open\//);
  await page.getByRole("button", { name: /Skip animation/ }).click();
  await page.getByRole("button", { name: /^Sell for/ }).click();
  await expect(
    page.getByRole("dialog", { name: "Sell this card?" }),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/sell-confirmation-390x844.png",
  });
  await page.getByRole("button", { name: /^Confirm sell/ }).click();
  await expect(
    page.getByText("Demo wallet credited", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: /Back to packs/ }).click();
  await expect(
    page.getByRole("heading", { name: "Trainer Pack", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Demo wallet balance/ }).click();
  await expect(page.getByRole("dialog", { name: "Demo Wallet" })).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/wallet-390x844.png" });
  await page.getByRole("button", { name: "Add $50 demo funds" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("link", { name: "Profile", exact: true }).click();
  await expect(page.getByText("Demo top-up", { exact: true })).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/profile-390x844.png" });
  await page.getByRole("link", { name: "Rewards", exact: true }).click();
  await page.screenshot({ path: "docs/screenshots/rewards-390x844.png" });
});
test("admin pack edits affect player and analyst cannot mutate", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/admin/packs");
  await expect(
    page.getByRole("heading", { name: "Trainer Pack", exact: true }),
  ).toBeVisible();
  await page
    .locator(".admin-pack-card")
    .filter({
      has: page.getByRole("heading", { name: "Trainer Pack", exact: true }),
    })
    .getByRole("button", { name: "Edit pack" })
    .click();
  await page.getByLabel("Price (integer cents)").fill("1500");
  await page.getByRole("button", { name: "Save pack", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto("/play");
  await expect(page.getByRole("button", { name: "Buy for $15" })).toBeVisible();
  expect(
    await page
      .locator(".bottom-nav")
      .evaluate(
        (el) => el.getBoundingClientRect().bottom <= window.innerHeight,
      ),
  ).toBeTruthy();
  await page.screenshot({ path: "docs/screenshots/play-1440x900.png" });
  const packs = await (await request.get("/api/catalog")).json();
  const p = packs.find((p: any) => p.id === "pokemon-0");
  await request.post("/api/admin/pack", {
    data: { id: p.id, data: { ...p, priceCents: 1000 } },
  });
  await page.goto("/admin");
  await page.getByLabel("Demo role").selectOption("analyst");
  await expect(page.getByText(/Read-only analyst role/)).toBeVisible();
  const rejected = await request.post("/api/admin/settings", {
    headers: { "x-demo-role": "analyst" },
    data: {
      shippingThresholdCents: 0,
      rtpTargetBps: 9600,
      startingBalanceCents: 25000,
    },
  });
  expect(rejected.status()).toBe(403);
});
test("desktop admin pages and screenshots", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const section of [
    "",
    "packs",
    "inventory",
    "odds",
    "openings",
    "users",
    "transactions",
    "shipping",
    "settings",
  ]) {
    await page.goto(`/admin${section ? `/${section}` : ""}`);
    await expect(page.locator(".admin-title h1")).toBeVisible();
    await expect(page.getByText("Loading operations…")).toHaveCount(0);
    await page.screenshot({
      path: `docs/screenshots/admin-${section || "dashboard"}-1440x900.png`,
      fullPage: section === "settings",
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
});
test("reduced motion, small mobile, modal focus and refresh deep links", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/play");
  await expect(
    page.getByRole("heading", { name: "Trainer Pack", exact: true }),
  ).toBeVisible();
  const buy = page.getByRole("button", { name: "Buy for $10" });
  await expect(buy).toBeVisible();
  expect(
    await buy.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return (
        document
          .elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
          ?.closest(".buy-button") === el
      );
    }),
  ).toBeTruthy();
  await page.getByRole("button", { name: "What's Inside" }).click();
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(
      () => !!document.activeElement?.closest("[role=dialog]"),
    ),
  ).toBeTruthy();
  await page.keyboard.press("Escape");
  await page.screenshot({ path: "docs/screenshots/play-small-320x568.png" });
  await page.goto("/play/collection");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "The keepers." }),
  ).toBeVisible();
});

test("eligible collection shipping request and admin fulfillment are simulated and connected", async ({
  page,
  request,
}) => {
  const response = await request.post("/api/admin/odds", {
    data: {
      packId: "pokemon-1",
      rows: [{ tierId: "pokemon-t7", weightBps: 10000 }],
    },
  });
  expect(response.ok()).toBeTruthy();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/play?category=pokemon&pack=pokemon-1");
  await page.getByRole("button", { name: "Buy for $50" }).click();
  await page.waitForURL(/\/play\/open\//);
  await page.getByRole("button", { name: /Skip animation/ }).click();
  await page.getByRole("button", { name: "Collect Card" }).click();
  await page.getByRole("link", { name: /View collection/ }).click();
  await expect(
    page.getByRole("heading", { name: "The keepers." }),
  ).toBeVisible();
  await page
    .locator(".collection-card")
    .filter({ hasText: "One of One" })
    .click();
  await page.getByRole("button", { name: "Request shipping (demo)" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/admin/shipping");
  await expect(
    page.getByRole("button", { name: "Approve", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/shipping-request-1440x900.png",
  });
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Mark packing", exact: true }),
  ).toBeVisible();
  const admin = await (await request.get("/api/admin")).json();
  expect(admin.shipping[0].status).toBe("approved");
  expect(admin.shipping[0].addressPlaceholder).toContain("no real PII");
  await request.post("/api/admin/odds", {
    data: {
      packId: "pokemon-1",
      rows: [
        { tierId: "pokemon-t1", weightBps: 4000 },
        { tierId: "pokemon-t3", weightBps: 4000 },
        { tierId: "pokemon-t5", weightBps: 1800 },
        { tierId: "pokemon-t7", weightBps: 200 },
      ],
    },
  });
});
