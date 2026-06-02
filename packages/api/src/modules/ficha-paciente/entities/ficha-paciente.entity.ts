import { Entity, Column, Index } from 'typeorm';
import type { DataFicha } from '@hc/shared';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';

/** Datos cargados de una ficha para un paciente (un paciente puede tener varias). */
@Entity('fichas_paciente')
@Index(['instanceId', 'pacienteId'])
export class FichaPaciente extends BaseTenantEntity {
  @Column({ name: 'paciente_id', type: 'int' })
  pacienteId: number;

  @Column({ name: 'plantilla_id', type: 'int' })
  plantillaId: number;

  @Column({ type: 'jsonb', default: {} })
  data: DataFicha;
}
