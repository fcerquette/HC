import { Entity, Column, Index } from 'typeorm';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';

/** Visita al consultorio: un solo médico, evolución de texto libre. */
@Entity('visitas')
@Index(['instanceId', 'pacienteId'])
export class Visita extends BaseTenantEntity {
  @Column({ name: 'paciente_id', type: 'int' })
  pacienteId: number;

  @Column({ name: 'medico_id', type: 'int' })
  medicoId: number;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  fecha: Date;

  @Column({ type: 'varchar', nullable: true })
  motivo: string | null;

  @Column({ type: 'text', default: '' })
  evolucion: string;

  @Column({ type: 'text', nullable: true })
  conducta: string | null;
}
