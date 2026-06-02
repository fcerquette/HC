import { IsInt, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateVisitaDto {
  @IsInt()
  pacienteId: number;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsString()
  motivo?: string;

  @IsOptional()
  @IsString()
  evolucion?: string;
}
