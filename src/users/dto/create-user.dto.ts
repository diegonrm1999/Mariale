import { Role } from "@prisma/client";

export class CreateUserDto {
  email: string | null;
  password: string | null;
  firstName: string;
  lastName: string;
  role: Role;
}