-- AlterTable
ALTER TABLE "product_warehouses" ADD COLUMN     "expiry_date" TIMESTAMP(3),
ADD COLUMN     "production_date" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 0;
