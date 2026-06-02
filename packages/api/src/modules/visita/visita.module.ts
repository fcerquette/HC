import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { Visita } from './entities/visita.entity';
import { VisitaService } from './visita.service';
import { VisitaController } from './visita.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Visita]), AuditoriaModule],
  controllers: [VisitaController],
  providers: [VisitaService],
})
export class VisitaModule {}
