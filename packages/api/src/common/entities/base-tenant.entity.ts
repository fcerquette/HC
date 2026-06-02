import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Base para toda tabla de negocio multitenant (instancia + sede). */
export abstract class BaseTenantEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'instance_id', type: 'int' })
  instanceId: number;

  @Column({ name: 'company_id', type: 'int', nullable: true })
  companyId: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
