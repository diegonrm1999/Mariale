import { Role } from "@prisma/client";

export class UpdateUserDto {
  email: string | null;
  password: string | null;
  firstName: string | null;
  lastName: string | null;
  shopId: string | null;
  role: Role | null;
}
