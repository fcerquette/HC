import { AsyncLocalStorage } from 'node:async_hooks';
import type { TenantContext } from '@hc/shared';

/** Datos que viven durante el ciclo de vida de un request. */
export interface AsyncContextData extends TenantContext {
  uuid?: string;
  userAgent?: string;
  ip?: string;
}

const storage = new AsyncLocalStorage<AsyncContextData>();

export const asyncContext = {
  run<T>(data: AsyncContextData, cb: () => T): T {
    return storage.run(data, cb);
  },
  getStore(): AsyncContextData | undefined {
    return storage.getStore();
  },
  get<K extends keyof AsyncContextData>(key: K): AsyncContextData[K] | undefined {
    return storage.getStore()?.[key];
  },
  set<K extends keyof AsyncContextData>(key: K, value: AsyncContextData[K]): void {
    const store = storage.getStore();
    if (store) store[key] = value;
  },
};

/** Acceso tipado al contexto de tenant. Lanza si no hay instancia resuelta. */
export class AsyncContextHelper {
  static get instanceId(): number {
    const id = asyncContext.get('instanceId');
    if (id == null) throw new Error('instanceId no presente en el contexto');
    return id;
  }

  static get companyId(): number | undefined {
    return asyncContext.get('companyId');
  }

  static get userId(): number | undefined {
    return asyncContext.get('userId');
  }

  static get firebaseUid(): string | undefined {
    return asyncContext.get('firebaseUid');
  }
}
