/*
  Warnings:

  - You are about to drop the column `price` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `treatmentId` on the `Order` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'Manager';

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_treatmentId_fkey";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "price",
DROP COLUMN "treatmentId";

-- CreateTable
CREATE TABLE "OrderTreatment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "treatmentId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderTreatment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrderTreatment" ADD CONSTRAINT "OrderTreatment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderTreatment" ADD CONSTRAINT "OrderTreatment_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "Treatment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
