import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { asyncContext, AsyncContextData } from '../context/async-context';

/** Inicia el AsyncLocalStorage por request y carga el instance-id del header. */
@Injectable()
export class AsyncContextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const instanceHeader = req.header('instance-id');
    const data: AsyncContextData = {
      instanceId: instanceHeader ? parseInt(instanceHeader, 10) : undefined!,
      uuid: randomUUID(),
      userAgent: req.header('user-agent'),
      ip: req.ip,
    };
    asyncContext.run(data, () => next());
  }
}
