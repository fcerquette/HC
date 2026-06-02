import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PacienteService } from './paciente.service';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';

@ApiTags('pacientes')
@ApiBearerAuth()
@Controller('pacientes')
export class PacienteController {
  constructor(private readonly service: PacienteService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() dto: CreatePacienteDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePacienteDto) {
    return this.service.update(id, dto);
  }

  @Get(':id/fichas')
  fichas(@Param('id', ParseIntPipe) id: number) {
    return this.service.fichas_(id);
  }

  @Get(':id/visitas')
  visitas(@Param('id', ParseIntPipe) id: number) {
    return this.service.visitasDe(id);
  }
}
