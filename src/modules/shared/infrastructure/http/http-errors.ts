/**
 * Helmdash — HTTP Exception Classes
 *
 * Strongly typed HTTP errors that can be thrown inside API handlers
 * or domain logic to produce consistent JSON error responses.
 */

export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends HttpError {
  constructor(message = 'Bad Request', details?: unknown) {
    super(400, message, details);
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Authentication required. Please sign in.', details?: unknown) {
    super(401, message, details);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Forbidden access.', details?: unknown) {
    super(403, message, details);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Resource not found.', details?: unknown) {
    super(404, message, details);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends HttpError {
  constructor(message = 'Resource state conflict.', details?: unknown) {
    super(409, message, details);
    this.name = 'ConflictError';
  }
}

export class UnprocessableEntityError extends HttpError {
  constructor(message = 'Unprocessable entity.', details?: unknown) {
    super(422, message, details);
    this.name = 'UnprocessableEntityError';
  }
}

export class InternalServerError extends HttpError {
  constructor(message = 'An unexpected internal error occurred.', details?: unknown) {
    super(500, message, details);
    this.name = 'InternalServerError';
  }
}
