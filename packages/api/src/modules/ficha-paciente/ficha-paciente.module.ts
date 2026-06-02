import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { FichaPaciente } from './entities/ficha-paciente.entity';
import { FichaPacienteService } from './ficha-paciente.service';
import { FichaPacienteController } from './ficha-paciente.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FichaPaciente]), AuditoriaModule],
  controllers: [FichaPacienteController],
  providers: [FichaPacienteService],
})
export class FichaPacienteModule {}
