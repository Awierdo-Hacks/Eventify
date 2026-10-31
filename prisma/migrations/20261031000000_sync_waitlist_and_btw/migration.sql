-- Catch-up: these existed in schema.prisma (and were likely created with
-- `prisma db push` in production) but no migration ever created them.
-- IF NOT EXISTS keeps this safe on databases that already have them.

ALTER TABLE "service_providers" ADD COLUMN IF NOT EXISTS "btw_number" TEXT;

CREATE TABLE IF NOT EXISTS "waitlist_entries" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "categories" TEXT[],
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waitlist_entries_pkey" PRIMARY KEY ("id")
);
