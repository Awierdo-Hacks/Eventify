-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('WEDDING', 'BIRTHDAY', 'CORPORATE', 'FESTIVAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SlotStatus" AS ENUM ('EMPTY', 'SEARCHING', 'QUOTES_REQUESTED', 'QUOTES_RECEIVED', 'BOOKED');

-- CreateEnum
CREATE TYPE "ProviderCategory" AS ENUM ('CATERING', 'MUSIC', 'PHOTOGRAPHY', 'DECORATION', 'VENUE', 'ENTERTAINMENT', 'VIDEOGRAPHY', 'TRANSPORT', 'ACCOMMODATION', 'SECURITY', 'SANITARY', 'CAKE', 'FLOWERS', 'MC', 'OTHER');

-- AlterTable
ALTER TABLE "quotes" ADD COLUMN     "event_slot_id" TEXT;

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "event_type" "EventType" NOT NULL,
    "event_date" TIMESTAMP(3),
    "location" TEXT,
    "guest_count" INTEGER,
    "budget_min" DOUBLE PRECISION,
    "budget_max" DOUBLE PRECISION,
    "status" "EventStatus" NOT NULL DEFAULT 'PLANNING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_slots" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "category" "ProviderCategory" NOT NULL,
    "custom_name" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "status" "SlotStatus" NOT NULL DEFAULT 'EMPTY',
    "booked_quote_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_slots_booked_quote_id_key" ON "event_slots"("booked_quote_id");

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_event_slot_id_fkey" FOREIGN KEY ("event_slot_id") REFERENCES "event_slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_slots" ADD CONSTRAINT "event_slots_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_slots" ADD CONSTRAINT "event_slots_booked_quote_id_fkey" FOREIGN KEY ("booked_quote_id") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
