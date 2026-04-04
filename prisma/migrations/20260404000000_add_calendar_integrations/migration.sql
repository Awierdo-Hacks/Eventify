-- CreateEnum
CREATE TYPE "CalendarSyncType" AS ENUM ('GOOGLE', 'ICAL');

-- CreateTable
CREATE TABLE "calendar_integrations" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "type" "CalendarSyncType" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "google_account_email" TEXT,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "ical_url" TEXT,
    "ical_last_etag" TEXT,
    "last_synced_at" TIMESTAMP(3),
    "sync_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_calendar_events" (
    "id" TEXT NOT NULL,
    "integration_id" TEXT NOT NULL,
    "external_uid" TEXT NOT NULL,
    "title" TEXT,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "is_all_day" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "calendar_integrations_provider_id_idx" ON "calendar_integrations"("provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_integrations_provider_id_type_key" ON "calendar_integrations"("provider_id", "type");

-- CreateIndex
CREATE INDEX "external_calendar_events_integration_id_idx" ON "external_calendar_events"("integration_id");

-- CreateIndex
CREATE INDEX "external_calendar_events_start_date_idx" ON "external_calendar_events"("start_date");

-- CreateIndex
CREATE UNIQUE INDEX "external_calendar_events_integration_id_external_uid_key" ON "external_calendar_events"("integration_id", "external_uid");

-- AddForeignKey
ALTER TABLE "calendar_integrations" ADD CONSTRAINT "calendar_integrations_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "service_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_calendar_events" ADD CONSTRAINT "external_calendar_events_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "calendar_integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
