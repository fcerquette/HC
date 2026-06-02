import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AsyncContextHelper } from '../../common/context/async-context';
import { Company } from './entities/company.entity';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companies: Repository<Company>,
  ) {}

  findAll(): Promise<Company[]> {
    return this.companies.find({
      where: { instanceId: AsyncContextHelper.instanceId },
    });
  }

  create(nombre: string): Promise<Company> {
    return this.companies.save(
      this.companies.create({ nombre, instanceId: AsyncContextHelper.instanceId }),
    );
  }
}
