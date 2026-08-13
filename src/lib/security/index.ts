/**
 * Helmdash — Security Module
 *
 * Composable security helpers for API routes.
 *
 * @module
 */

export { withAuth, getAuthenticatedUser } from './with-auth';
export type { AuthenticatedHandler, AuthResult } from './with-auth';

export { withRateLimit } from './with-rate-limit';
export type { RateLimitConfig } from './with-rate-limit';

export { withValidation } from './with-validation';
export type { ValidationContext } from './with-validation';

// Unified API endpoint wrapper & HTTP errors
export { createApiEndpoint } from '@/modules/shared/infrastructure/http/create-api-endpoint';
export type { ApiEndpointOptions } from '@/modules/shared/infrastructure/http/create-api-endpoint';
export { HttpError, BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError } from '@/modules/shared/infrastructure/http/http-errors';

// Re-export encryption utilities
export { encrypt, decrypt, decryptToString, deriveKey, generateSalt } from './encryption';