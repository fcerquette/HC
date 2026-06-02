import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { VisitaService } from './visita.service';
import { CreateVisitaDto } from './dto/create-visita.dto';

@ApiTags('visitas')
@ApiBearerAuth()
@Controller('visitas')
export class VisitaController {
  constructor(private readonly service: VisitaService) {}

  @Post()
  create(@Body() dto: CreateVisitaDto) {
    return this.service.create(dto);
  }
}
