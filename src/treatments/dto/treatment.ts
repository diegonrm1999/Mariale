import { IsString, IsNumber, Min, Max } from 'class-validator';
export class TreatmentDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;
}
