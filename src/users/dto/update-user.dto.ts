import { Role } from "@prisma/client";

export class UpdateUserDto {
  email: string | null;
  password: string | null;
  role: Role | null;
}