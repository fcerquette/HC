import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { FichaPaciente } from '../ficha-paciente/entities/ficha-paciente.entity';
import { Visita } from '../visita/entities/visita.entity';
import { Paciente } from './entities/paciente.entity';
import { PacienteService } from './paciente.service';
import { PacienteController } from './paciente.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Paciente, FichaPaciente, Visita]),
    AuditoriaModule,
  ],
  controllers: [PacienteController],
  providers: [PacienteService],
})
export class PacienteModule {}
