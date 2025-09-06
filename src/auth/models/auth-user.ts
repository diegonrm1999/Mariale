import { Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  rol: Role;
  shopId: string;
}
