/*
  Warnings:

  - The `order_no` column on the `sales_orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropIndex
DROP INDEX "sales_orders_order_no_key";

-- AlterTable
ALTER TABLE "sales_orders" DROP COLUMN "order_no",
ADD COLUMN     "order_no" UUID NOT NULL DEFAULT gen_random_uuid();
