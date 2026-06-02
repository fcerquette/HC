import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Observable, from, switchMap } from 'rxjs';
import { asyncContext } from '../../common/context/async-context';
import { Usuario } from './entities/usuario.entity';

/** Resuelve el Usuario (médico) por firebaseUid+instanceId y carga userId al contexto. */
@Injectable()
export class AuthContextInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarios: Repository<Usuario>,
  ) {}

  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const uid = asyncContext.get('firebaseUid');
    const instanceId = asyncContext.get('instanceId');

    if (!uid || instanceId == null) return next.handle();

    return from(
      this.usuarios.findOne({ where: { firebaseUid: uid, instanceId } }),
    ).pipe(
      switchMap((usuario) => {
        if (usuario) asyncContext.set('userId', usuario.id);
        return next.handle();
      }),
    );
  }
}
