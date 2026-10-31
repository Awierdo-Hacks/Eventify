-- Phase 1: one category taxonomy, event-slot linked requests,
-- booking completion/cancellation and booking-bound reviews.

-- 1. ServiceProvider.category: free text -> ProviderCategory enum (data preserved)
ALTER TABLE "service_providers"
  ALTER COLUMN "category" TYPE "ProviderCategory" USING (
    CASE lower(trim("category"))
      WHEN 'catering'      THEN 'CATERING'
      WHEN 'dj'            THEN 'MUSIC'
      WHEN 'music'         THEN 'MUSIC'
      WHEN 'muziek'        THEN 'MUSIC'
      WHEN 'photography'   THEN 'PHOTOGRAPHY'
      WHEN 'fotografie'    THEN 'PHOTOGRAPHY'
      WHEN 'decoration'    THEN 'DECORATION'
      WHEN 'decoratie'     THEN 'DECORATION'
      WHEN 'venues'        THEN 'VENUE'
      WHEN 'venue'         THEN 'VENUE'
      WHEN 'locatie'       THEN 'VENUE'
      WHEN 'entertainment' THEN 'ENTERTAINMENT'
      WHEN 'video'         THEN 'VIDEOGRAPHY'
      WHEN 'videography'   THEN 'VIDEOGRAPHY'
      WHEN 'transport'     THEN 'TRANSPORT'
      WHEN 'accommodation' THEN 'ACCOMMODATION'
      WHEN 'security'      THEN 'SECURITY'
      WHEN 'sanitary'      THEN 'SANITARY'
      WHEN 'cake'          THEN 'CAKE'
      WHEN 'flowers'       THEN 'FLOWERS'
      WHEN 'mc'            THEN 'MC'
      ELSE CASE
        WHEN upper(trim("category")) IN ('CATERING','MUSIC','PHOTOGRAPHY','DECORATION','VENUE','ENTERTAINMENT',
          'VIDEOGRAPHY','TRANSPORT','ACCOMMODATION','SECURITY','SANITARY','CAKE','FLOWERS','MC','OTHER')
        THEN upper(trim("category"))
        ELSE 'OTHER'
      END
    END
  )::"ProviderCategory";

-- ServiceRequest.category stays text, but uses the same enum values from now on
UPDATE "service_requests" SET "category" = CASE lower(trim("category"))
    WHEN 'catering'      THEN 'CATERING'
    WHEN 'dj'            THEN 'MUSIC'
    WHEN 'music'         THEN 'MUSIC'
    WHEN 'photography'   THEN 'PHOTOGRAPHY'
    WHEN 'decoration'    THEN 'DECORATION'
    WHEN 'venues'        THEN 'VENUE'
    WHEN 'venue'         THEN 'VENUE'
    WHEN 'entertainment' THEN 'ENTERTAINMENT'
    WHEN 'video'         THEN 'VIDEOGRAPHY'
    WHEN 'videography'   THEN 'VIDEOGRAPHY'
    WHEN 'transport'     THEN 'TRANSPORT'
    WHEN 'flowers'       THEN 'FLOWERS'
    WHEN 'cake'          THEN 'CAKE'
    WHEN 'mc'            THEN 'MC'
    ELSE "category"
  END;

-- 2. Service requests can belong to an event slot; decline/cancel info
ALTER TABLE "service_requests"
  ADD COLUMN "event_slot_id" TEXT,
  ADD COLUMN "decline_reason" TEXT,
  ADD COLUMN "closed_at" TIMESTAMP(3);

CREATE INDEX "service_requests_event_slot_id_idx" ON "service_requests"("event_slot_id");

ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_event_slot_id_fkey"
  FOREIGN KEY ("event_slot_id") REFERENCES "event_slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: requests whose quote is already linked to a slot
UPDATE "service_requests" sr SET "event_slot_id" = q."event_slot_id"
FROM "quotes" q
WHERE q."request_id" = sr."id" AND q."event_slot_id" IS NOT NULL AND sr."event_slot_id" IS NULL;

-- 3. Booking completion and cancellation
ALTER TABLE "bookings"
  ADD COLUMN "completed_at" TIMESTAMP(3),
  ADD COLUMN "cancelled_at" TIMESTAMP(3),
  ADD COLUMN "cancelled_by_id" TEXT,
  ADD COLUMN "cancellation_reason" TEXT;

-- 4. Reviews are tied to one booking (nullable for reviews created before this)
ALTER TABLE "reviews" ADD COLUMN "booking_id" TEXT;

CREATE UNIQUE INDEX "reviews_booking_id_key" ON "reviews"("booking_id");

ALTER TABLE "reviews" ADD CONSTRAINT "reviews_booking_id_fkey"
  FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
