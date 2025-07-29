/*
  Warnings:

  - You are about to drop the column `receipt_no` on the `production_receipt_orders` table. All the data in the column will be lost.
  - Added the required column `status` to the `production_receipt_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_quantity_expected` to the `production_receipt_orders` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "production_receipt_orders_receipt_no_key";

-- AlterTable
ALTER TABLE "production_receipt_orders" DROP COLUMN "receipt_no",
ADD COLUMN     "status" VARCHAR(50) NOT NULL,
ADD COLUMN     "total_quantity_expected" INTEGER NOT NULL,
ALTER COLUMN "receipt_date" SET DATA TYPE TIMESTAMP(6);
