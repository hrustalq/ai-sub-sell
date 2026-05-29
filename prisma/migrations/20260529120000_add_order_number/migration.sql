-- Add human-readable order numbers for Telegram linking (replaces one-off backfill script).

-- AlterTable
ALTER TABLE "order" ADD COLUMN "orderNumber" TEXT;

-- Stable numbers for seed orders (dev)
UPDATE "order" SET "orderNumber" = 'NEEDREPL' WHERE "id" = 'seed-order-needs-reply';
UPDATE "order" SET "orderNumber" = 'UNREAD01' WHERE "id" = 'seed-order-unread-buyer';
UPDATE "order" SET "orderNumber" = 'ALLREAD1' WHERE "id" = 'seed-order-all-read';
UPDATE "order" SET "orderNumber" = 'PEND0001' WHERE "id" = 'seed-order-pending';
UPDATE "order" SET "orderNumber" = 'CNCL0001' WHERE "id" = 'seed-order-canceled';
UPDATE "order" SET "orderNumber" = 'GUEST001' WHERE "id" = 'seed-order-guest';

-- Existing production orders: unique 8-char values
UPDATE "order"
SET "orderNumber" = upper(substr(hex(randomblob(4)) || hex(randomblob(4)), 1, 8))
WHERE "orderNumber" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "order_orderNumber_key" ON "order"("orderNumber");
