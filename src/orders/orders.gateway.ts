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

  emitOrderRefresh(id: string) {
    try {
      this.server.emit('order-refresh', id);
    } catch (error) {}
  }

  completeRefresh(id: string) {
    try {
      this.server.emit('complete-refresh', id);
    } catch (error) {}
  }
}
