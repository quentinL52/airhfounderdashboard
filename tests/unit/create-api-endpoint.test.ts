import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiEndpoint } from '@/modules/shared/infrastructure/http/create-api-endpoint';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  InternalServerError,
} from '@/modules/shared/infrastructure/http/http-errors';
import { getRequestContext } from '@/modules/shared/infrastructure/http/request-context';
import { logger } from '@/lib/logging/logger';

// Mock getAuthenticatedUser
vi.mock('@/lib/security/with-auth', () => ({
  getAuthenticatedUser: vi.fn(),
}));

import { getAuthenticatedUser } from '@/lib/security/with-auth';

describe('createApiEndpoint Wrapper Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getAuthenticatedUser as any).mockResolvedValue({
      user: { id: 'test-user-123' },
      error: null,
    });
  });

  describe('Trace ID & Response Headers', () => {
    it('generates a traceId if not supplied in request headers and attaches x-trace-id header to response', async () => {
      const endpoint = createApiEndpoint({
        async handler(req, { traceId, userId }) {
          expect(traceId).toBeDefined();
          expect(traceId.length).toBeGreaterThan(0);
          expect(userId).toBe('test-user-123');
          return NextResponse.json({ success: true });
        },
      });

      const req = new NextRequest('http://localhost:9002/api/test');
      const res = await endpoint(req);

      expect(res.status).toBe(200);
      const traceHeader = res.headers.get('x-trace-id');
      expect(traceHeader).toBeDefined();
      expect(traceHeader).not.toBeNull();
    });

    it('propagates existing x-trace-id from request header to response header', async () => {
      const customTraceId = 'custom-trace-uuid-9999';
      const endpoint = createApiEndpoint({
        async handler(req, { traceId }) {
          expect(traceId).toBe(customTraceId);
          return NextResponse.json({ ok: true });
        },
      });

      const req = new NextRequest('http://localhost:9002/api/test', {
        headers: { 'x-trace-id': customTraceId },
      });
      const res = await endpoint(req);

      expect(res.headers.get('x-trace-id')).toBe(customTraceId);
    });

    it('populates AsyncLocalStorage request context during handler execution', async () => {
      let contextInsideHandler: any = null;

      const endpoint = createApiEndpoint({
        async handler() {
          contextInsideHandler = getRequestContext();
          return NextResponse.json({ ok: true });
        },
      });

      const req = new NextRequest('http://localhost:9002/api/test-context');
      await endpoint(req);

      expect(contextInsideHandler).toBeDefined();
      expect(contextInsideHandler?.userId).toBe('test-user-123');
      expect(contextInsideHandler?.route).toBe('/api/test-context');
      expect(contextInsideHandler?.traceId).toBeDefined();
    });
  });

  describe('Authentication Integration', () => {
    it('returns 401 response if getAuthenticatedUser fails when auth is required', async () => {
      (getAuthenticatedUser as any).mockResolvedValue({
        user: null,
        error: NextResponse.json(
          { error: 'Authentication required. Please sign in.' },
          { status: 401 },
        ),
      });

      const endpoint = createApiEndpoint({
        auth: true,
        async handler() {
          return NextResponse.json({ unreachable: true });
        },
      });

      const req = new NextRequest('http://localhost:9002/api/protected');
      const res = await endpoint(req);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain('Authentication required');
      expect(res.headers.get('x-trace-id')).toBeDefined();
    });

    it('allows unauthenticated requests when auth option is set to false', async () => {
      const endpoint = createApiEndpoint({
        auth: false,
        async handler(req, { userId }) {
          expect(userId).toBeUndefined();
          return NextResponse.json({ public: true });
        },
      });

      const req = new NextRequest('http://localhost:9002/api/public');
      const res = await endpoint(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.public).toBe(true);
    });
  });

  describe('Zod Schema Validation', () => {
    const testSchema = z.object({
      title: z.string().min(3, 'Title too short'),
      amount: z.number().positive('Amount must be positive'),
    });

    it('validates request body and passes parsed typed data to handler', async () => {
      const endpoint = createApiEndpoint({
        bodySchema: testSchema,
        async handler(req, { body }) {
          expect(body.title).toBe('Project Alpha');
          expect(body.amount).toBe(1500);
          return NextResponse.json({ success: true, body });
        },
      });

      const req = new NextRequest('http://localhost:9002/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Project Alpha', amount: 1500 }),
      });

      const res = await endpoint(req);
      expect(res.status).toBe(200);
    });

    it('returns 400 with field errors when body validation fails', async () => {
      const endpoint = createApiEndpoint({
        bodySchema: testSchema,
        async handler() {
          return NextResponse.json({ unreachable: true });
        },
      });

      const req = new NextRequest('http://localhost:9002/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Hi', amount: -50 }),
      });

      const res = await endpoint(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Validation failed');
      expect(data.fields.title).toContain('Title too short');
      expect(data.fields.amount).toContain('Amount must be positive');
      expect(res.headers.get('x-trace-id')).toBeDefined();
    });

    it('returns 400 when body contains malformed JSON syntax', async () => {
      const endpoint = createApiEndpoint({
        bodySchema: testSchema,
        async handler() {
          return NextResponse.json({ unreachable: true });
        },
      });

      const req = new NextRequest('http://localhost:9002/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ malformed_json: ',
      });

      const res = await endpoint(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Invalid JSON in request body');
    });

    it('validates query parameters using querySchema', async () => {
      const querySchema = z.object({
        page: z.string().regex(/^\d+$/).transform(Number),
        search: z.string().optional(),
      });

      const endpoint = createApiEndpoint({
        querySchema,
        async handler(req, { query }) {
          expect(query.page).toBe(2);
          expect(query.search).toBe('test');
          return NextResponse.json({ query });
        },
      });

      const req = new NextRequest('http://localhost:9002/api/search?page=2&search=test');
      const res = await endpoint(req);
      expect(res.status).toBe(200);
    });

    it('validates dynamic route params using paramsSchema', async () => {
      const paramsSchema = z.object({
        id: z.string().uuid('Invalid UUID'),
      });

      const endpoint = createApiEndpoint({
        paramsSchema,
        async handler(req, { params }) {
          expect(params.id).toBe('123e4567-e89b-12d3-a456-426614174000');
          return NextResponse.json({ params });
        },
      });

      const req = new NextRequest('http://localhost:9002/api/items/123e4567-e89b-12d3-a456-426614174000');
      const res = await endpoint(req, {
        params: Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' }),
      });

      expect(res.status).toBe(200);
    });
  });

  describe('Error Handling & Sentry Capturing', () => {
    it('handles thrown HttpError instances by returning structured status code & message', async () => {
      const endpoint = createApiEndpoint({
        async handler() {
          throw new ForbiddenError('Admin privileges required.');
        },
      });

      const req = new NextRequest('http://localhost:9002/api/admin-only');
      const res = await endpoint(req);

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe('Admin privileges required.');
      expect(res.headers.get('x-trace-id')).toBeDefined();
    });

    it('captures unhandled internal exceptions, logs to logger/Sentry, and returns safe 500 error response', async () => {
      const loggerSpy = vi.spyOn(logger, 'error');

      const endpoint = createApiEndpoint({
        async handler() {
          throw new Error('Database connection lost unexpectedly!');
        },
      });

      const req = new NextRequest('http://localhost:9002/api/crash');
      const res = await endpoint(req);

      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toBe('An unexpected internal error occurred.');
      expect(data.traceId).toBeDefined();

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unhandled exception on /api/crash'),
        expect.any(Error),
        expect.objectContaining({
          route: '/api/crash',
          userId: 'test-user-123',
        }),
      );
    });
  });
});
