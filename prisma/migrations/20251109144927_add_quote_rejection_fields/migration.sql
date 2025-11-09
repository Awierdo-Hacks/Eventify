-- AlterTable
ALTER TABLE "quotes" ADD COLUMN     "rejected_at" TIMESTAMP(3),
ADD COLUMN     "rejection_reason" TEXT;
