import { IsInt, IsObject, IsOptional } from 'class-validator';
import type { DataFicha } from '@hc/shared';

export class UpsertFichaPacienteDto {
  @IsInt()
  pacienteId: number;

  @IsInt()
  plantillaId: number;

  @IsOptional()
  @IsObject()
  data?: DataFicha;
}
