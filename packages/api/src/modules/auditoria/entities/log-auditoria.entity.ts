import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { AccionAuditoria } from '@hc/shared';

/** Log de auditoría (exigencia legal de HC). */
@Entity('logs_auditoria')
@Index(['instanceId', 'entidad'])
export class LogAuditoria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'instance_id', type: 'int' })
  instanceId: number;

  @Column({ name: 'usuario_id', type: 'int', nullable: true })
  usuarioId: number | null;

  @Column()
  entidad: string;

  @Column({ name: 'entidad_id', type: 'int', nullable: true })
  entidadId: number | null;

  @Column({ type: 'varchar' })
  accion: AccionAuditoria;

  @CreateDateColumn({ name: 'fecha' })
  fecha: Date;
}
