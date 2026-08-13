export { createApiEndpoint } from '@/modules/shared/infrastructure/http/create-api-endpoint';
export type { ApiEndpointOptions } from '@/modules/shared/infrastructure/http/create-api-endpoint';
export {
  HttpError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  UnprocessableEntityError,
  InternalServerError,
} from '@/modules/shared/infrastructure/http/http-errors';
export {
  getRequestContext,
  getTraceId,
  getUserId,
} from '@/modules/shared/infrastructure/http/request-context';
