-- AlterTable
CREATE SEQUENCE order_ordernumber_seq;
ALTER TABLE "Order" ALTER COLUMN "orderNumber" SET DEFAULT nextval('order_ordernumber_seq');
ALTER SEQUENCE order_ordernumber_seq OWNED BY "Order"."orderNumber";
