-- AlterTable
ALTER TABLE "sales_orders" ADD COLUMN     "status_id" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "order_statuses" (
    "id" SERIAL NOT NULL,
    "status_name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255),

    CONSTRAINT "order_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_statuses_status_name_key" ON "order_statuses"("status_name");

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "order_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
