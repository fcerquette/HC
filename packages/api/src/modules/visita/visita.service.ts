import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccionAuditoria } from '@hc/shared';
import { AsyncContextHelper } from '../../common/context/async-context';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { Visita } from './entities/visita.entity';
import { CreateVisitaDto } from './dto/create-visita.dto';

@Injectable()
export class VisitaService {
  constructor(
    @InjectRepository(Visita)
    private readonly visitas: Repository<Visita>,
    private readonly auditoria: AuditoriaService,
  ) {}

  async create(dto: CreateVisitaDto): Promise<Visita> {
    const medicoId = AsyncContextHelper.userId;
    if (medicoId == null) {
      throw new BadRequestException('Médico no resuelto desde el token');
    }
    const visita = await this.visitas.save(
      this.visitas.create({
        instanceId: AsyncContextHelper.instanceId,
        companyId: AsyncContextHelper.companyId ?? null,
        pacienteId: dto.pacienteId,
        medicoId,
        fecha: dto.fecha ? new Date(dto.fecha) : new Date(),
        motivo: dto.motivo ?? null,
        evolucion: dto.evolucion ?? '',
        conducta: dto.conducta ?? null,
      }),
    );
    await this.auditoria.log('Visita', visita.id, AccionAuditoria.Crear);
    return visita;
  }
}
