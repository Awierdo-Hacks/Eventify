-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PENDING', 'PAID', 'FAILED', 'CANCELLED', 'EXPIRED', 'REFUNDED');

-- AlterTable: Booking
ALTER TABLE "bookings"
  ADD COLUMN "agreement_accepted_at" TIMESTAMP(3),
  ADD COLUMN "agreement_ip"          TEXT;

ALTER TABLE "bookings"
  ALTER COLUMN "payment_status" DROP DEFAULT,
  ALTER COLUMN "payment_status" TYPE "PaymentStatus" USING (
    CASE "payment_status"
      WHEN 'PAID'     THEN 'PAID'::"PaymentStatus"
      WHEN 'REFUNDED' THEN 'REFUNDED'::"PaymentStatus"
      ELSE 'UNPAID'::"PaymentStatus"
    END
  ),
  ALTER COLUMN "payment_status" SET NOT NULL,
  ALTER COLUMN "payment_status" SET DEFAULT 'UNPAID';

-- CreateTable: Payment
CREATE TABLE "payments" (
  "id"                  TEXT         NOT NULL,
  "booking_id"          TEXT         NOT NULL,
  "mollie_payment_id"   TEXT         NOT NULL,
  "amount"              DOUBLE PRECISION NOT NULL,
  "currency"            TEXT         NOT NULL DEFAULT 'EUR',
  "method"              TEXT,
  "status"              "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "idempotency_key"     TEXT         NOT NULL,
  "checkout_url"        TEXT,
  "webhook_received_at" TIMESTAMP(3),
  "paid_at"             TIMESTAMP(3),
  "failed_at"           TIMESTAMP(3),
  "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"          TIMESTAMP(3) NOT NULL,

  CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PaymentAuditLog
CREATE TABLE "payment_audit_logs" (
  "id"         TEXT         NOT NULL,
  "booking_id" TEXT         NOT NULL,
  "payment_id" TEXT,
  "user_id"    TEXT,
  "event"      TEXT         NOT NULL,
  "metadata"   JSONB,
  "ip_address" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "payment_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_mollie_payment_id_key" ON "payments"("mollie_payment_id");
CREATE UNIQUE INDEX "payments_idempotency_key_key"   ON "payments"("idempotency_key");
CREATE INDEX "payments_booking_id_idx"               ON "payments"("booking_id");
CREATE INDEX "payment_audit_logs_booking_id_idx"     ON "payment_audit_logs"("booking_id");
CREATE INDEX "payment_audit_logs_created_at_idx"     ON "payment_audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_fkey"
  FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
