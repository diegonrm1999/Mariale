import { IsArray, ValidateNested, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class TreatmentDto {
  @IsString()
  @IsNotEmpty()
  treatmentId: string;

  price: number;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TreatmentDto)
  treatments: TreatmentDto[];

  @IsString()
  @IsNotEmpty()
  clientDni: string;

  @IsString()
  @IsNotEmpty()
  clientName: string;

  @IsOptional()
  @IsString()
  clientPhone?: string;

  @IsOptional()
  @IsString()
  clientEmail?: string;

  @IsString()
  @IsNotEmpty()
  stylistId: string;

  @IsString()
  @IsNotEmpty()
  cashierId: string;
}
