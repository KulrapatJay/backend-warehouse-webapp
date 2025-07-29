/*
  Warnings:

  - You are about to drop the column `quantity` on the `production_receipt_items` table. All the data in the column will be lost.
  - You are about to drop the column `receipt_id` on the `production_receipt_items` table. All the data in the column will be lost.
  - Added the required column `production_receipt_id` to the `production_receipt_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity_expected` to the `production_receipt_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit_cost` to the `production_receipt_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "production_receipt_items" DROP CONSTRAINT "production_receipt_items_receipt_id_fkey";

-- AlterTable
ALTER TABLE "production_receipt_items" DROP COLUMN "quantity",
DROP COLUMN "receipt_id",
ADD COLUMN     "production_receipt_id" INTEGER NOT NULL,
ADD COLUMN     "quantity_expected" INTEGER NOT NULL,
ADD COLUMN     "quantity_received" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unit_cost" DECIMAL(10,2) NOT NULL;

-- AddForeignKey
ALTER TABLE "production_receipt_items" ADD CONSTRAINT "production_receipt_items_production_receipt_id_fkey" FOREIGN KEY ("production_receipt_id") REFERENCES "production_receipt_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
