import { IsInt, IsObject, IsOptional, IsString } from 'class-validator';
import type { DataFicha } from '@hc/shared';

export class UpsertFichaPacienteDto {
  @IsInt()
  pacienteId: number;

  @IsInt()
  plantillaId: number;

  @IsOptional()
  @IsString()
  fecha?: string;

  @IsOptional()
  @IsObject()
  data?: DataFicha;
}
