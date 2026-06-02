import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InstanceService } from './instance.service';

@ApiTags('instances')
@ApiBearerAuth()
@Controller('instances')
export class InstanceController {
  constructor(private readonly service: InstanceService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body('nombre') nombre: string) {
    return this.service.create(nombre);
  }
}
