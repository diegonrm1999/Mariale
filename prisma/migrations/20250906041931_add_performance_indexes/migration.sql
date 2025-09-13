-- CreateIndex
CREATE INDEX "clients_shop_name" ON "Client"("shopId", "name");

-- CreateIndex
CREATE INDEX "orders_shop_date" ON "Order"("shopId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "orders_shop_status" ON "Order"("shopId", "status");

-- CreateIndex
CREATE INDEX "orders_shop_stylist" ON "Order"("shopId", "stylistId");

-- CreateIndex
CREATE INDEX "orders_shop_operator" ON "Order"("shopId", "operatorId");

-- CreateIndex
CREATE INDEX "orders_shop_cashier" ON "Order"("shopId", "cashierId");
