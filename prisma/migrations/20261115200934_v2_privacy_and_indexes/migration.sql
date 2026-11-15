-- Eventiphy 2.0 — additive only.
--
-- Every statement is idempotent. v1 added `service_providers.btw_number` and
-- the `waitlist_entries` table outside of the migration history, so on the
-- production database they already exist; on a fresh database they do not.
-- This migration is safe in both cases and never drops or rewrites anything.

-- Drift repair (no-ops where v1 already created these)
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

-- Account erasure marker
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

-- Proof of accepted legal documents
CREATE TABLE IF NOT EXISTS "legal_acceptances" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_acceptances_pkey" PRIMARY KEY ("id")
);

-- Proof of cookie-consent choices
CREATE TABLE IF NOT EXISTS "consent_records" (
    "id" TEXT NOT NULL,
    "visitor_id" TEXT NOT NULL,
    "user_id" TEXT,
    "policy_version" TEXT NOT NULL,
    "analytics" BOOLEAN NOT NULL DEFAULT false,
    "marketing" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

-- Notice-and-action queue
CREATE TABLE IF NOT EXISTS "content_reports" (
    "id" TEXT NOT NULL,
    "reporter_id" TEXT,
    "reporter_email" TEXT,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "content_reports_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "legal_acceptances_user_id_document_idx" ON "legal_acceptances"("user_id", "document");
CREATE INDEX IF NOT EXISTS "consent_records_visitor_id_idx" ON "consent_records"("visitor_id");
CREATE INDEX IF NOT EXISTS "consent_records_user_id_idx" ON "consent_records"("user_id");
CREATE INDEX IF NOT EXISTS "content_reports_status_created_at_idx" ON "content_reports"("status", "created_at");
CREATE INDEX IF NOT EXISTS "event_slots_event_id_idx" ON "event_slots"("event_id");
CREATE INDEX IF NOT EXISTS "events_customer_id_idx" ON "events"("customer_id");
CREATE INDEX IF NOT EXISTS "message_attachments_message_id_idx" ON "message_attachments"("message_id");
CREATE INDEX IF NOT EXISTS "provider_services_provider_id_idx" ON "provider_services"("provider_id");
CREATE INDEX IF NOT EXISTS "quotes_event_slot_id_idx" ON "quotes"("event_slot_id");
CREATE INDEX IF NOT EXISTS "service_providers_verified_is_active_category_idx" ON "service_providers"("verified", "is_active", "category");

-- Foreign keys (guarded so a re-run is a no-op)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'legal_acceptances_user_id_fkey') THEN
    ALTER TABLE "legal_acceptances" ADD CONSTRAINT "legal_acceptances_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'consent_records_user_id_fkey') THEN
    ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'content_reports_reporter_id_fkey') THEN
    ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reporter_id_fkey"
      FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
