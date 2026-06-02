import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { TenantContext } from '@hc/shared';
import { asyncContext } from '../context/async-context';

/** Inyecta el contexto de tenant resuelto para el request actual. */
export const CurrentTenant = createParamDecorator(
  (_data: unknown, _ctx: ExecutionContext): TenantContext => {
    const store = asyncContext.getStore();
    return {
      instanceId: store?.instanceId!,
      companyId: store?.companyId,
      userId: store?.userId,
      firebaseUid: store?.firebaseUid,
      email: store?.email,
    };
  },
);
