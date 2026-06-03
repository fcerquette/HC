import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Observable } from 'rxjs';
import { asyncContext } from '../../common/context/async-context';
import { Usuario } from './entities/usuario.entity';

/**
 * Resuelve el Usuario (médico) por firebaseUid+instanceId y carga userId al contexto.
 * Además actúa como control de acceso multitenant: exige que el usuario autenticado
 * pertenezca a la instancia indicada en el header `instance-id`. Si no pertenece → 403.
 * Esto evita que un usuario logueado lea/escriba datos de otra instancia cambiando el header.
 */
@Injectable()
export class AuthContextInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarios: Repository<Usuario>,
  ) {}

  async intercept(
    _ctx: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const uid = asyncContext.get('firebaseUid');
    const instanceId = asyncContext.get('instanceId');

    if (!uid) {
      throw new UnauthorizedException('Token no resuelto');
    }
    if (instanceId == null) {
      throw new BadRequestException('Falta el header instance-id');
    }

    const usuario = await this.usuarios.findOne({
      where: { firebaseUid: uid, instanceId, activo: true },
    });
    if (!usuario) {
      throw new ForbiddenException('El usuario no tiene acceso a esta instancia');
    }

    asyncContext.set('userId', usuario.id);
    return next.handle();
  }
}
