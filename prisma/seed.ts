import { db } from "../lib/db";
const cats = [
  ["pokemon", "Pokémon", "TRAINER", "#F5C84B"],
  ["one-piece", "One Piece", "PIRATE", "#279BFA"],
  ["basketball", "Basketball", "HOOPS", "#F47A38"],
  ["baseball", "Baseball", "ROOKIE", "#E9434C"],
];
export async function seed() {
  return db.$transaction(
    async (tx) => {
      if (await tx.user.count()) return;
      for (const [id, name, role] of [
        ["demo", "Alex Morgan", "player"],
        ["demo-2", "Jordan Lee", "player"],
        ["demo-3", "Taylor Quinn", "player"],
        ["admin", "Sam Carter", "admin"],
        ["analyst", "Casey Reed", "analyst"],
      ])
        await tx.user.create({
          data: {
            id,
            name,
            role,
            wallet: { create: { balanceCents: role === "player" ? 25000 : 0 } },
          },
        });
      for (const [i, [id, label, title, color]] of cats.entries()) {
        await tx.category.create({
          data: {
            id,
            slug: id,
            label,
            iconAsset: `/assets/categories/${id}.svg`,
            sortOrder: i,
          },
        });
        for (const [t, value] of [
          100, 400, 1000, 2000, 6000, 10000, 30000, 75000,
        ].entries()) {
          const tierId = `${id}-t${t}`,
            name = [
              "First Light",
              "Rising Star",
              "All Star",
              "Prime Edition",
              "Silver Legend",
              "Gold Legend",
              "Crown Jewel",
              "One of One",
            ][t];
          await tx.tier.create({
            data: {
              id: tierId,
              categoryId: id,
              label: name,
              marketValueCents: value,
              minStock: 5,
            },
          });
          if (value < 6000)
            await tx.pooledInventory.create({
              data: {
                categoryId: id,
                tierId,
                quantityAvailable: 200,
                unitValueCents: value,
                unitAcquisitionCostCents: Math.round(value * 0.6),
                name: `${title} ${name}`,
                imageAsset: `/assets/cards/${id}-${t}.svg`,
              },
            });
          else
            for (let n = 0; n < 12; n++)
              await tx.card.create({
                data: {
                  categoryId: id,
                  tierId,
                  name: `${title} ${name}`,
                  grade: n % 2 ? "9" : "10",
                  gradingCompany: "DEMO",
                  certNumber: `DEMO-${id.toUpperCase()}-${t}-${n}`,
                  marketValueCents: value,
                  sellValueCents: value,
                  acquisitionCostCents: Math.round(value * 0.6),
                  imageAsset: `/assets/cards/${id}-${t}.svg`,
                },
              });
        }
        for (let v = 0; v < 2; v++) {
          const pack = await tx.pack.create({
            data: {
              id: `${id}-${v}`,
              categoryId: id,
              slug: `${id}-${v ? "after-hours" : title.toLowerCase()}`,
              title: v
                ? `${title[0] + title.slice(1).toLowerCase()} After Hours`
                : `${title[0] + title.slice(1).toLowerCase()} Pack`,
              description: v
                ? "A premium midnight edition. Bigger possibilities, original collectibles."
                : "Your next great collectible starts with one rip. One original card in every pack.",
              priceCents: v ? 5000 : 1000,
              accentHex: v ? "#A899E9" : color,
              artworkAsset: `/assets/packs/${id}-${v ? "after-hours" : title.toLowerCase()}.png`,
              symbol: `/assets/categories/${id}.svg`,
              isActive: true,
              sortOrder: v,
            },
          });
          await tx.packOddsVersion.create({
            data: {
              packId: pack.id,
              version: 1,
              rows: {
                create: (v
                  ? [
                      [1, 4000],
                      [3, 4000],
                      [5, 1800],
                      [7, 200],
                    ]
                  : [
                      [0, 6000],
                      [2, 3000],
                      [3, 800],
                      [5, 200],
                    ]
                ).map(([t, w]) => ({ tierId: `${id}-t${t}`, weightBps: w })),
              },
            },
          });
        }
      }
      for (const [key, value] of [
        ["shippingThresholdCents", 25000],
        ["rtpTargetBps", 9600],
        ["startingBalanceCents", 25000],
      ] as const)
        await tx.setting.create({ data: { key, value } });
      await tx.auditLog.create({
        data: {
          actorId: "admin",
          entityType: "environment",
          entityId: "demo",
          action: "seed",
          payloadJson: JSON.stringify({
            note: "Illustrative inventory: 32 tiers. No real imported cards.",
          }),
        },
      });
    },
    { timeout: 30000 },
  );
}
if (process.argv[1]?.endsWith("seed.ts")) seed().then(() => db.$disconnect());
