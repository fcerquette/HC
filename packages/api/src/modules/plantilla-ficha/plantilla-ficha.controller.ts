import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PlantillaFichaService } from './plantilla-ficha.service';
import { CreatePlantillaFichaDto } from './dto/create-plantilla-ficha.dto';

@ApiTags('plantillas')
@ApiBearerAuth()
@Controller('plantillas')
export class PlantillaFichaController {
  constructor(private readonly service: PlantillaFichaService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() dto: CreatePlantillaFichaDto) {
    return this.service.create(dto);
  }
}
