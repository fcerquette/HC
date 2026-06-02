import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlantillaFicha } from './entities/plantilla-ficha.entity';
import { PlantillaFichaCustom } from './entities/plantilla-ficha-custom.entity';
import { PlantillaFichaService } from './plantilla-ficha.service';
import { PlantillaFichaController } from './plantilla-ficha.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PlantillaFicha, PlantillaFichaCustom])],
  controllers: [PlantillaFichaController],
  providers: [PlantillaFichaService],
})
export class PlantillaFichaModule {}
