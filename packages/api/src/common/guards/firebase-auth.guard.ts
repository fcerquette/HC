import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { firebaseAuth } from '../firebase/firebase';
import { asyncContext } from '../context/async-context';

/** Verifica el Bearer token de Firebase y carga firebaseUid/email al contexto. */
@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const header = req.header('authorization') || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Falta el token Bearer');
    }

    try {
      const decoded = await firebaseAuth().verifyIdToken(token);
      asyncContext.set('firebaseUid', decoded.uid);
      asyncContext.set('email', decoded.email);
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido');
    }
  }
}
