import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccionAuditoria } from '@hc/shared';
import { AsyncContextHelper } from '../../common/context/async-context';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { FichaPaciente } from './entities/ficha-paciente.entity';
import { UpsertFichaPacienteDto } from './dto/upsert-ficha-paciente.dto';

@Injectable()
export class FichaPacienteService {
  constructor(
    @InjectRepository(FichaPaciente)
    private readonly fichas: Repository<FichaPaciente>,
    private readonly auditoria: AuditoriaService,
  ) {}

  async create(dto: UpsertFichaPacienteDto): Promise<FichaPaciente> {
    const ficha = await this.fichas.save(
      this.fichas.create({
        instanceId: AsyncContextHelper.instanceId,
        companyId: AsyncContextHelper.companyId ?? null,
        pacienteId: dto.pacienteId,
        plantillaId: dto.plantillaId,
        fecha: dto.fecha ?? null,
        data: dto.data ?? {},
      }),
    );
    await this.auditoria.log('FichaPaciente', ficha.id, AccionAuditoria.Crear);
    return ficha;
  }

  async updateData(id: number, data: Record<string, unknown>): Promise<FichaPaciente> {
    const ficha = await this.fichas.findOne({
      where: { id, instanceId: AsyncContextHelper.instanceId },
    });
    if (!ficha) throw new NotFoundException('Ficha no encontrada');
    ficha.data = { ...ficha.data, ...data };
    const saved = await this.fichas.save(ficha);
    await this.auditoria.log('FichaPaciente', id, AccionAuditoria.Actualizar);
    return saved;
  }
}
