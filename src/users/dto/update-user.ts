import { Role } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string | null;

  @IsString()
  @IsOptional()
  password?: string | null;

  @IsString()
  @IsOptional()
  firstName?: string | null;

  @IsString()
  @IsOptional()
  lastName?: string | null;

  @IsString()
  @IsOptional()
  shopId?: string | null;

  @IsEnum(Role)
  @IsOptional()
  role?: Role | null;
}
