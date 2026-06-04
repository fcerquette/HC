import type { Sexo, TipoCampoFicha } from './enums';

/** Contexto de tenant que viaja por request. */
export interface TenantContext {
  instanceId: number;
  companyId?: number;
  userId?: number;
  firebaseUid?: string;
  email?: string;
}

/** Definición de un campo dentro del schema JSON de una plantilla. */
export interface CampoFicha {
  code: string;
  label: string;
  tipo: TipoCampoFicha;
  requerido?: boolean;
  opciones?: string[];
  /** Agrupación visual (ej. "Antecedentes ginecológicos"). */
  seccion?: string;
}

/** Schema completo de una plantilla de ficha (lo que se guarda en JSONB). */
export interface SchemaFicha {
  secciones?: string[];
  campos: CampoFicha[];
  /** 'tabla' = vista pivot (analitos x fechas, ej. Laboratorio). Default 'ficha'. */
  vista?: 'ficha' | 'tabla';
}

/** Datos cargados de una ficha, indexados por `code` de campo. */
export type DataFicha = Record<string, unknown>;

export interface PacienteDTO {
  id: number;
  apellido: string;
  nombre: string;
  dni?: string | null;
  fechaNacimiento?: string | null;
  sexo?: Sexo | null;
  contacto?: string | null;
  mail?: string | null;
  direccion?: string | null;
  localidad?: string | null;
  obraSocial?: string | null;
  companyId?: number | null;
}

export interface VisitaDTO {
  id: number;
  pacienteId: number;
  medicoId: number;
  fecha: string;
  motivo?: string | null;
  evolucion: string;
}
