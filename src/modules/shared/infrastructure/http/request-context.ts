import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  traceId: string;
  userId?: string;
  route?: string;
}

export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext | undefined {
  return requestContextStorage.getStore();
}

export function getTraceId(): string | undefined {
  return requestContextStorage.getStore()?.traceId;
}

export function getUserId(): string | undefined {
  return requestContextStorage.getStore()?.userId;
}
