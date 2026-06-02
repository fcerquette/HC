import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

/** Overrides de una plantilla por instancia/sede (JSONB con cambios parciales). */
@Entity('plantillas_ficha_custom')
@Index(['instanceId'])
export class PlantillaFichaCustom {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'plantilla_id', type: 'int' })
  plantillaId: number;

  @Column({ name: 'instance_id', type: 'int' })
  instanceId: number;

  @Column({ name: 'company_id', type: 'int', nullable: true })
  companyId: number | null;

  @Column({ type: 'jsonb' })
  overrides: Record<string, unknown>;
}
