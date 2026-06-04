import { Entity, Column, Unique, Index } from 'typeorm';
import { Sexo } from '@hc/shared';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';

/** Paciente: vive a nivel instancia. DNI único por instancia (compartido entre sedes). */
@Entity('pacientes')
@Unique(['instanceId', 'dni'])
@Index(['instanceId'])
export class Paciente extends BaseTenantEntity {
  @Column()
  apellido: string;

  @Column()
  nombre: string;

  @Column({ type: 'varchar', nullable: true })
  dni: string | null;

  @Column({ name: 'fecha_nacimiento', type: 'date', nullable: true })
  fechaNacimiento: string | null;

  @Column({ type: 'varchar', length: 1, nullable: true })
  sexo: Sexo | null;

  @Column({ type: 'varchar', nullable: true })
  contacto: string | null;

  @Column({ type: 'varchar', nullable: true })
  mail: string | null;

  @Column({ type: 'varchar', nullable: true })
  direccion: string | null;

  @Column({ type: 'varchar', nullable: true })
  localidad: string | null;

  @Column({ name: 'obra_social', type: 'varchar', nullable: true })
  obraSocial: string | null;

  @Column({ type: 'varchar', nullable: true })
  peso: string | null;

  @Column({ type: 'varchar', nullable: true })
  talla: string | null;
}
