/*
  Warnings:

  - A unique constraint covering the columns `[orderNumber]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - Made the column `dni` on table `Client` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `Client` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `orderNumber` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ticketNumber` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "email" TEXT,
ALTER COLUMN "dni" SET NOT NULL,
ALTER COLUMN "name" SET NOT NULL;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "orderNumber" INTEGER NOT NULL,
ADD COLUMN     "ticketNumber" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
