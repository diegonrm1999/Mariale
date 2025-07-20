import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import axios from 'axios';

function capitalizeWords(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async findByDni(dni: string): Promise<Partial<Client>> {
    const client = await this.prisma.client.findFirst({ where: { dni } });
    if (client) return client;

    const apiUrl = this.configService.get<string>('reniec.apiUrl');
    const token = this.configService.get<string>('reniec.token');

    try {
      const fullUrl = `${apiUrl}/${dni}?token=${token}`;

      const response = await axios.get<ReniecResponse>(fullUrl);
      const nombres = response.data.nombres || '';
      const apellidoPaterno = response.data.apellidoPaterno || '';
      const apellidoMaterno = response.data.apellidoMaterno || '';

      const fullName = capitalizeWords(
        `${nombres} ${apellidoPaterno} ${apellidoMaterno}`,
      );
      return {
        dni,
        name: fullName,
      };
    } catch (error) {
      console.error('[RENIEC ERROR]', error); // Esto te muestra el error exacto en consola
      throw new Error('Cliente no encontrado ni en la BD ni en Reniec');
    }
  }
}
