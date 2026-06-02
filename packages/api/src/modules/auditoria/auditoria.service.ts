import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccionAuditoria } from '@hc/shared';
import { asyncContext } from '../../common/context/async-context';
import { LogAuditoria } from './entities/log-auditoria.entity';

@Injectable()
export class AuditoriaService {
  constructor(
    @InjectRepository(LogAuditoria)
    private readonly logs: Repository<LogAuditoria>,
  ) {}

  async log(
    entidad: string,
    entidadId: number | null,
    accion: AccionAuditoria,
  ): Promise<void> {
    const instanceId = asyncContext.get('instanceId');
    if (instanceId == null) return;
    await this.logs.save(
      this.logs.create({
        instanceId,
        usuarioId: asyncContext.get('userId') ?? null,
        entidad,
        entidadId,
        accion,
      }),
    );
  }
}
