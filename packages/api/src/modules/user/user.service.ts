import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AsyncContextHelper } from '../../common/context/async-context';
import { Usuario } from './entities/usuario.entity';
import { UsuarioCompany } from './entities/usuario-company.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarios: Repository<Usuario>,
    @InjectRepository(UsuarioCompany)
    private readonly usuarioCompanies: Repository<UsuarioCompany>,
  ) {}

  async create(dto: CreateUsuarioDto): Promise<Usuario> {
    const instanceId = AsyncContextHelper.instanceId;
    const usuario = await this.usuarios.save(
      this.usuarios.create({
        instanceId,
        firebaseUid: dto.firebaseUid,
        email: dto.email,
        nombre: dto.nombre,
        apellido: dto.apellido,
        matricula: dto.matricula ?? null,
      }),
    );

    if (dto.companyIds?.length) {
      await this.usuarioCompanies.save(
        dto.companyIds.map((companyId) =>
          this.usuarioCompanies.create({ usuarioId: usuario.id, companyId }),
        ),
      );
    }
    return usuario;
  }

  findAll(): Promise<Usuario[]> {
    return this.usuarios.find({
      where: { instanceId: AsyncContextHelper.instanceId },
    });
  }

  /** Perfil del médico autenticado (según el token Firebase). */
  async me(): Promise<Usuario> {
    const firebaseUid = AsyncContextHelper.firebaseUid;
    const instanceId = AsyncContextHelper.instanceId;
    const usuario = await this.usuarios.findOne({
      where: { firebaseUid, instanceId },
    });
    if (!usuario) throw new NotFoundException('Médico no registrado en esta instancia');
    return usuario;
  }

  async sedes(usuarioId: number): Promise<number[]> {
    const rels = await this.usuarioCompanies.find({ where: { usuarioId } });
    return rels.map((r) => r.companyId);
  }
}
