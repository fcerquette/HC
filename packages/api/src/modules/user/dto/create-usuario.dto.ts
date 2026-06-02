import { IsArray, IsEmail, IsOptional, IsString, IsInt } from 'class-validator';

export class CreateUsuarioDto {
  @IsString()
  firebaseUid: string;

  @IsEmail()
  email: string;

  @IsString()
  nombre: string;

  @IsString()
  apellido: string;

  @IsOptional()
  @IsString()
  matricula?: string;

  /** Sedes a las que el médico tiene acceso. */
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  companyIds?: number[];
}
