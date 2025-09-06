import { Injectable } from '@nestjs/common';
import { FcmService } from 'src/fcm/fcm.service';

@Injectable()
export class NotificationService {
  constructor(private readonly fcmService: FcmService) {}

  async assignCashierNotification(cashierId: string) {
    await this.fcmService.sendToTopic(
      `cashier_${cashierId}`,
      'Nueva orden creada',
      'Tienes una nueva orden para completar',
    );
  }
}
