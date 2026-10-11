PRAGMA foreign_keys = ON;

CREATE TABLE "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'player',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Wallet" (
  "userId" TEXT NOT NULL PRIMARY KEY,
  "balanceCents" INTEGER NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "LedgerEntry" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "openingId" TEXT,
  "balanceBeforeCents" INTEGER NOT NULL,
  "balanceAfterCents" INTEGER NOT NULL,
  "reason" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "idempotencyKey" TEXT NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "LedgerEntry_idempotencyKey_key" ON "LedgerEntry"("idempotencyKey");

CREATE TABLE "Category" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slug" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "iconAsset" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL
);

CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

CREATE TABLE "Pack" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "categoryId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "priceCents" INTEGER NOT NULL,
  "accentHex" TEXT NOT NULL,
  "secondaryHex" TEXT NOT NULL DEFAULT '#FFFFFF',
  "artworkAsset" TEXT NOT NULL,
  "symbol" TEXT NOT NULL,
  "isActive" INTEGER NOT NULL DEFAULT 0,
  "isHidden" INTEGER NOT NULL DEFAULT 0,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "sellBps" INTEGER NOT NULL DEFAULT 10000,
  FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Pack_slug_key" ON "Pack"("slug");

CREATE TABLE "Tier" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "categoryId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "marketValueCents" INTEGER NOT NULL,
  "minStock" INTEGER NOT NULL DEFAULT 5,
  FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Card" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "categoryId" TEXT NOT NULL,
  "tierId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "grade" TEXT,
  "gradingCompany" TEXT,
  "certNumber" TEXT,
  "marketValueCents" INTEGER NOT NULL,
  "sellValueCents" INTEGER NOT NULL,
  "acquisitionCostCents" INTEGER NOT NULL DEFAULT 0,
  "vendor" TEXT NOT NULL DEFAULT 'Demo seed',
  "imageAsset" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'in_stock',
  "ownerUserId" TEXT,
  "inventoryMode" TEXT NOT NULL DEFAULT 'unique',
  "location" TEXT NOT NULL DEFAULT 'Demo vault A',
  "acquiredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("tierId") REFERENCES "Tier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "PooledInventory" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "categoryId" TEXT NOT NULL,
  "tierId" TEXT NOT NULL,
  "quantityAvailable" INTEGER NOT NULL,
  "quantityReserved" INTEGER NOT NULL DEFAULT 0,
  "unitValueCents" INTEGER NOT NULL,
  "unitAcquisitionCostCents" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "imageAsset" TEXT NOT NULL,
  FOREIGN KEY ("tierId") REFERENCES "Tier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "PackOddsVersion" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "packId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "isPublished" INTEGER NOT NULL DEFAULT 1,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("packId") REFERENCES "Pack" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "PackOddsVersion_packId_version_key" ON "PackOddsVersion"("packId", "version");

CREATE TABLE "PackOddsRow" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "oddsVersionId" TEXT NOT NULL,
  "tierId" TEXT NOT NULL,
  "weightBps" INTEGER NOT NULL,
  FOREIGN KEY ("oddsVersionId") REFERENCES "PackOddsVersion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY ("tierId") REFERENCES "Tier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "PackOddsRow_oddsVersionId_tierId_key" ON "PackOddsRow"("oddsVersionId", "tierId");

CREATE TABLE "Opening" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "packId" TEXT NOT NULL,
  "oddsVersionId" TEXT NOT NULL,
  "cardId" TEXT NOT NULL,
  "pooledUnitRef" TEXT,
  "priceCents" INTEGER NOT NULL,
  "outcomeMarketValueCents" INTEGER NOT NULL,
  "outcomeSellValueCents" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "randomReference" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" DATETIME,
  "idempotencyKey" TEXT NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY ("packId") REFERENCES "Pack" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY ("oddsVersionId") REFERENCES "PackOddsVersion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY ("cardId") REFERENCES "Card" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Opening_cardId_key" ON "Opening"("cardId");

CREATE UNIQUE INDEX "Opening_idempotencyKey_key" ON "Opening"("idempotencyKey");

CREATE TABLE "FulfillmentRequest" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "openingId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'requested',
  "addressPlaceholder" TEXT NOT NULL DEFAULT 'Demo address — no real PII',
  "trackingPlaceholder" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("openingId") REFERENCES "Opening" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "FulfillmentRequest_openingId_key" ON "FulfillmentRequest"("openingId");

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "actorId" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "payloadJson" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Setting" (
  "key" TEXT NOT NULL PRIMARY KEY,
  "value" INTEGER NOT NULL
);