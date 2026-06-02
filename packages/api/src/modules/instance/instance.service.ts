import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Instance } from './entities/instance.entity';

@Injectable()
export class InstanceService {
  constructor(
    @InjectRepository(Instance)
    private readonly instances: Repository<Instance>,
  ) {}

  findAll(): Promise<Instance[]> {
    return this.instances.find();
  }

  create(nombre: string): Promise<Instance> {
    return this.instances.save(this.instances.create({ nombre }));
  }
}
