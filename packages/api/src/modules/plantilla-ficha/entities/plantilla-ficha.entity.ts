import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import type { SchemaFicha } from '@hc/shared';

/** Plantilla de ficha. instance_id null = predefinida (la entrega el dueño del sistema). */
@Entity('plantillas_ficha')
@Index(['instanceId'])
export class PlantillaFicha {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'instance_id', type: 'int', nullable: true })
  instanceId: number | null;

  @Column()
  nombre: string;

  @Column({ type: 'jsonb' })
  schema: SchemaFicha;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ name: 'es_predefinida', default: false })
  esPredefinida: boolean;

  @Column({ default: true })
  activa: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
