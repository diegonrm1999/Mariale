// orders.gateway.ts
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class OrdersGateway {
  @WebSocketServer()
  server: Server;

  emitOrderRefresh(operatorId: string, cashierId: string, userId: string) {
    try {
      this.server.emit(`order-refresh-${cashierId}`, userId);
      this.server.emit(`order-refresh-${operatorId}`, userId);
    } catch (error) {}
  }

  completeRefresh(operatorId: string, cashierId: string, userId: string) {
    try {
      this.server.emit(`complete-refresh-${cashierId}`, userId);
      this.server.emit(`complete-refresh-${operatorId}`, userId);
    } catch (error) {}
  }
}
