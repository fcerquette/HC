import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';
import type { SchemaFicha } from '@hc/shared';

export class CreatePlantillaFichaDto {
  @IsString()
  nombre: string;

  @IsObject()
  schema: SchemaFicha;

  @IsOptional()
  @IsBoolean()
  esPredefinida?: boolean;
}
