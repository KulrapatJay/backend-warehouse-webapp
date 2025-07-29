/*
  Warnings:

  - You are about to drop the column `order_id` on the `sales_order_items` table. All the data in the column will be lost.
  - Added the required column `sales_order_id` to the `sales_order_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "sales_order_items" DROP CONSTRAINT "sales_order_items_order_id_fkey";

-- AlterTable
ALTER TABLE "sales_order_items" DROP COLUMN "order_id",
ADD COLUMN     "sales_order_id" INTEGER NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
