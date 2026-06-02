import { Entity, PrimaryGeneratedColumn, Column, Unique, Index } from 'typeorm';

/** Relación médico ↔ sede (un médico puede atender en varias sedes). */
@Entity('usuario_companies')
@Unique(['usuarioId', 'companyId'])
@Index(['companyId'])
export class UsuarioCompany {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'usuario_id', type: 'int' })
  usuarioId: number;

  @Column({ name: 'company_id', type: 'int' })
  companyId: number;
}
