import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TreatmentsModule } from './treatments/treatments.module';
import { OrdersService } from './orders/orders.service';
import { OrdersController } from './orders/orders.controller';
import { Usercontroller } from './users/user.controller';
import { ClientsModule } from './client/clients.module';
import { OrdersGateway } from './orders/orders.gateway';
import { FcmModule } from './fcm/fcm.module';
import reniecConfig from './config/reniec.config';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [reniecConfig],
    }),
    TreatmentsModule,
    ClientsModule,
    FcmModule,
  ],
  controllers: [
    AppController,
    AuthController,
    OrdersController,
    Usercontroller,
  ],
  providers: [AppService, OrdersService, ConfigService, OrdersGateway],
})
export class AppModule {}
