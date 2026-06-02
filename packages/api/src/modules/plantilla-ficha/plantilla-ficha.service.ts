import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { AsyncContextHelper } from '../../common/context/async-context';
import { PlantillaFicha } from './entities/plantilla-ficha.entity';
import { CreatePlantillaFichaDto } from './dto/create-plantilla-ficha.dto';

@Injectable()
export class PlantillaFichaService {
  constructor(
    @InjectRepository(PlantillaFicha)
    private readonly plantillas: Repository<PlantillaFicha>,
  ) {}

  /** Plantillas visibles para la instancia: las predefinidas (instance_id null) + las propias. */
  findAll(): Promise<PlantillaFicha[]> {
    const instanceId = AsyncContextHelper.instanceId;
    return this.plantillas.find({
      where: [
        { instanceId: IsNull(), activa: true },
        { instanceId, activa: true },
      ],
    });
  }

  create(dto: CreatePlantillaFichaDto): Promise<PlantillaFicha> {
    return this.plantillas.save(
      this.plantillas.create({
        instanceId: AsyncContextHelper.instanceId,
        nombre: dto.nombre,
        schema: dto.schema,
        esPredefinida: dto.esPredefinida ?? false,
      }),
    );
  }
}
