import { Controller, Get, Param } from '@nestjs/common';
import { ClientsService } from './clients.service';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get('dni/:dni')
  async getByDni(@Param('dni') dni: string) {
    const client = await this.clientsService.findByDni(dni);
    if (!client) {
      throw new Error(`No se encontró cliente con DNI ${dni}`);
    }
    return client;
  }
}
