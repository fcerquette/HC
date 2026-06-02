import { Body, Controller, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { DataFicha } from '@hc/shared';
import { FichaPacienteService } from './ficha-paciente.service';
import { UpsertFichaPacienteDto } from './dto/upsert-ficha-paciente.dto';

@ApiTags('fichas')
@ApiBearerAuth()
@Controller('fichas')
export class FichaPacienteController {
  constructor(private readonly service: FichaPacienteService) {}

  @Post()
  create(@Body() dto: UpsertFichaPacienteDto) {
    return this.service.create(dto);
  }

  @Patch(':id/data')
  updateData(@Param('id', ParseIntPipe) id: number, @Body() data: DataFicha) {
    return this.service.updateData(id, data);
  }
}
