import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Sexo } from '@hc/shared';

export class CreatePacienteDto {
  @IsString()
  apellido: string;

  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  dni?: string;

  @IsOptional()
  @IsString()
  fechaNacimiento?: string;

  @IsOptional()
  @IsEnum(Sexo)
  sexo?: Sexo;

  @IsOptional()
  @IsString()
  contacto?: string;

  @IsOptional()
  @IsString()
  mail?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  localidad?: string;

  @IsOptional()
  @IsString()
  obraSocial?: string;

  @IsOptional()
  @IsInt()
  companyId?: number;
}
