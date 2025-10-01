import { Role } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string | null;

  @IsString()
  @IsOptional()
  password?: string | null;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  shopId: string;

  @IsEnum(Role)
  role: Role;
}
