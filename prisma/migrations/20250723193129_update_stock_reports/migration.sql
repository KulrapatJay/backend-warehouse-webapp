/*
  Warnings:

  - Added the required column `report_type` to the `stock_reports` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "stock_reports" ADD COLUMN     "notes" VARCHAR(500),
ADD COLUMN     "parameters" JSONB,
ADD COLUMN     "report_type" VARCHAR(50) NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3);
