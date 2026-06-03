import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';

/** Médico. Login vía Firebase; este registro guarda el perfil. */
@Entity('usuarios')
@Unique(['instanceId', 'firebaseUid'])
@Index(['instanceId'])
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'instance_id', type: 'int' })
  instanceId: number;

  @Column({ name: 'firebase_uid' })
  firebaseUid: string;

  @Column()
  email: string;

  @Column()
  nombre: string;

  @Column()
  apellido: string;

  @Column({ type: 'varchar', nullable: true })
  matricula: string | null;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
