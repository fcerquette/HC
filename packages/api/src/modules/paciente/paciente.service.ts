import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AsyncContextHelper } from '../../common/context/async-context';
import { AccionAuditoria } from '@hc/shared';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { FichaPaciente } from '../ficha-paciente/entities/ficha-paciente.entity';
import { Visita } from '../visita/entities/visita.entity';
import { Paciente } from './entities/paciente.entity';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';

@Injectable()
export class PacienteService {
  constructor(
    @InjectRepository(Paciente)
    private readonly pacientes: Repository<Paciente>,
    @InjectRepository(FichaPaciente)
    private readonly fichas: Repository<FichaPaciente>,
    @InjectRepository(Visita)
    private readonly visitas: Repository<Visita>,
    private readonly auditoria: AuditoriaService,
  ) {}

  findAll(): Promise<Paciente[]> {
    return this.pacientes.find({
      where: { instanceId: AsyncContextHelper.instanceId },
      order: { apellido: 'ASC', nombre: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Paciente> {
    const paciente = await this.pacientes.findOne({
      where: { id, instanceId: AsyncContextHelper.instanceId },
    });
    if (!paciente) throw new NotFoundException('Paciente no encontrado');
    return paciente;
  }

  async create(dto: CreatePacienteDto): Promise<Paciente> {
    const paciente = await this.pacientes.save(
      this.pacientes.create({
        ...dto,
        dni: dto.dni ?? null,
        companyId: dto.companyId ?? null,
        instanceId: AsyncContextHelper.instanceId,
      }),
    );
    await this.auditoria.log('Paciente', paciente.id, AccionAuditoria.Crear);
    return paciente;
  }

  async update(id: number, dto: UpdatePacienteDto): Promise<Paciente> {
    const paciente = await this.findOne(id);
    Object.assign(paciente, dto);
    const saved = await this.pacientes.save(paciente);
    await this.auditoria.log('Paciente', id, AccionAuditoria.Actualizar);
    return saved;
  }

  /** Fichas del paciente (renderizadas en el front desde schema + data). */
  fichas_(pacienteId: number): Promise<FichaPaciente[]> {
    return this.fichas.find({
      where: { pacienteId, instanceId: AsyncContextHelper.instanceId },
    });
  }

  visitasDe(pacienteId: number): Promise<Visita[]> {
    return this.visitas.find({
      where: { pacienteId, instanceId: AsyncContextHelper.instanceId },
      order: { fecha: 'DESC' },
    });
  }
}
