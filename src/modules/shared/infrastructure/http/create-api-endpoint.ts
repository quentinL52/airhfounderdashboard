/**
 * Helmdash — Unified API Endpoint Wrapper (`createApiEndpoint`)
 *
 * Enforces standardized HTTP handling across all API routes:
 * 1. Supabase session/auth validation via `getAuthenticatedUser()` (auth fail-closed).
 * 2. Zod request schema validation (body, query, params) with 400 field error responses.
 * 3. Contextual `traceId` generation, header propagation (`x-trace-id`), and AsyncLocalStorage injection.
 * 4. Sentry exception capturing & safe error response formatting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/security/with-auth';
import { logger } from '@/lib/logging/logger';
import { requestContextStorage } from './request-context';
import { HttpError } from './http-errors';

type InferSchema<T> = T extends z.ZodTypeAny ? z.infer<T> : undefined;

export interface ApiEndpointOptions<
  TBody extends z.ZodTypeAny = z.ZodTypeAny,
  TQuery extends z.ZodTypeAny = z.ZodTypeAny,
  TParams extends z.ZodTypeAny = z.ZodTypeAny,
  TAuth extends boolean = true,
> {
  /**
   * Whether authentication is required.
   * Default: true
   */
  auth?: TAuth;

  /**
   * Zod schema for request body validation.
   */
  bodySchema?: TBody;

  /**
   * Zod schema for query string parameter validation.
   */
  querySchema?: TQuery;

  /**
   * Zod schema for dynamic route params (context.params).
   */
  paramsSchema?: TParams;

  /**
   * Custom error message prefix for validation failures.
   */
  errorMessage?: string;

  /**
   * Strip unknown fields from parsed body (default: true).
   */
  stripUnknown?: boolean;

  /**
   * Main route execution handler.
   */
  handler: (
    req: NextRequest,
    context: {
      traceId: string;
      userId: TAuth extends false ? string | undefined : string;
      body: InferSchema<TBody>;
      query: TQuery extends z.ZodTypeAny ? z.infer<TQuery> : Record<string, string>;
      params: TParams extends z.ZodTypeAny ? z.infer<TParams> : Record<string, unknown>;
    },
  ) => Promise<NextResponse | Response>;
}

/**
 * Higher-order function to create a unified Next.js API route handler.
 */
export function createApiEndpoint<
  TBody extends z.ZodTypeAny = z.ZodTypeAny,
  TQuery extends z.ZodTypeAny = z.ZodTypeAny,
  TParams extends z.ZodTypeAny = z.ZodTypeAny,
  TAuth extends boolean = true,
>(
  options: ApiEndpointOptions<TBody, TQuery, TParams, TAuth>,
): (req: NextRequest, rawContext?: any) => Promise<NextResponse> {
  return async (req: NextRequest, rawContext?: any): Promise<NextResponse> => {
    // 1. Contextual traceId generation & propagation
    const traceId =
      req.headers.get('x-trace-id') ||
      req.headers.get('x-request-id') ||
      crypto.randomUUID();

    const route = req.nextUrl?.pathname || (req.url ? new URL(req.url).pathname : 'unknown-route');
    const authRequired = options.auth ?? true;
    const stripUnknown = options.stripUnknown ?? true;

    // Helper to append x-trace-id header to any response
    const withTraceHeader = (response: NextResponse): NextResponse => {
      response.headers.set('x-trace-id', traceId);
      return response;
    };

    // 2. Authentication check
    let userId: string | undefined = undefined;
    if (authRequired) {
      const authResult = await getAuthenticatedUser();
      if (authResult.error) {
        return withTraceHeader(authResult.error);
      }
      userId = authResult.user.id;
    }

    // 3. Route dynamic params validation
    let resolvedParams: Record<string, unknown> = {};
    if (rawContext && rawContext.params) {
      resolvedParams =
        rawContext.params instanceof Promise
          ? await rawContext.params
          : rawContext.params;
    }

    let parsedParams = resolvedParams;
    if (options.paramsSchema) {
      const paramsResult = options.paramsSchema.safeParse(resolvedParams);
      if (!paramsResult.success) {
        return withTraceHeader(
          formatValidationError(paramsResult.error, traceId, options.errorMessage),
        );
      }
      parsedParams = paramsResult.data;
    }

    // 4. Query string validation
    let parsedQuery: Record<string, string> = {};
    if (req.url) {
      try {
        const url = new URL(req.url);
        parsedQuery = Object.fromEntries(url.searchParams.entries());
      } catch {
        parsedQuery = {};
      }
    }

    let validatedQuery = parsedQuery;
    if (options.querySchema) {
      const queryResult = options.querySchema.safeParse(parsedQuery);
      if (!queryResult.success) {
        return withTraceHeader(
          formatValidationError(queryResult.error, traceId, options.errorMessage),
        );
      }
      validatedQuery = queryResult.data;
    }

    // 5. Body validation
    let parsedBody: any = undefined;
    if (options.bodySchema) {
      let rawBody: unknown;
      try {
        rawBody = await req.json();
      } catch (err) {
        if (err instanceof SyntaxError) {
          return withTraceHeader(
            NextResponse.json(
              { error: 'Invalid JSON in request body', traceId },
              { status: 400 },
            ),
          );
        }
        return withTraceHeader(
          NextResponse.json(
            { error: 'Failed to parse request body', traceId },
            { status: 400 },
          ),
        );
      }

      const bodyResult = options.bodySchema.safeParse(rawBody);
      if (!bodyResult.success) {
        return withTraceHeader(
          formatValidationError(bodyResult.error, traceId, options.errorMessage),
        );
      }
      parsedBody = stripUnknown ? bodyResult.data : rawBody;
    }

    // 6. Execute inside AsyncLocalStorage context & handle errors / Sentry capturing
    return requestContextStorage.run(
      { traceId, userId, route },
      async () => {
        try {
          const handlerContext = {
            traceId,
            userId: userId as any,
            body: parsedBody as InferSchema<TBody>,
            query: validatedQuery as any,
            params: parsedParams as any,
          };

          const result = await options.handler(req, handlerContext);

          if (result instanceof NextResponse) {
            return withTraceHeader(result);
          }

          // If standard Response is returned, convert to NextResponse
          const responseBody = await result.blob();
          const nextRes = new NextResponse(responseBody, {
            status: result.status,
            statusText: result.statusText,
            headers: result.headers,
          });
          return withTraceHeader(nextRes);
        } catch (error) {
          return withTraceHeader(handleEndpointError(error, { traceId, userId, route }));
        }
      },
    );
  };
}

/**
 * Formats Zod validation errors into a clean 400 HTTP response.
 */
function formatValidationError(
  zodError: z.ZodError,
  traceId: string,
  customErrorMessage?: string,
): NextResponse {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of zodError.issues) {
    const path = issue.path.join('.') || 'root';
    if (!fieldErrors[path]) fieldErrors[path] = [];
    fieldErrors[path].push(issue.message);
  }

  return NextResponse.json(
    {
      error: customErrorMessage ?? 'Validation failed',
      fields: fieldErrors,
      traceId,
    },
    { status: 400 },
  );
}

/**
 * Handles exceptions raised during endpoint execution.
 * Logs unexpected errors to Sentry via logger and returns safe JSON response.
 */
function handleEndpointError(
  error: unknown,
  context: { traceId: string; userId?: string; route: string },
): NextResponse {
  const { traceId, userId, route } = context;

  if (error instanceof HttpError) {
    logger.warn(`[API Endpoint] HttpError (${error.statusCode}): ${error.message}`, {
      traceId,
      userId,
      route,
      details: error.details,
    });

    return NextResponse.json(
      {
        error: error.message,
        ...(error.details !== undefined ? { details: error.details } : {}),
        traceId,
      },
      { status: error.statusCode },
    );
  }

  // Unhandled exception: log to console & Sentry
  logger.error(`[API Endpoint] Unhandled exception on ${route}`, error, {
    traceId,
    userId,
    route,
  });

  return NextResponse.json(
    {
      error: 'An unexpected internal error occurred.',
      traceId,
    },
    { status: 500 },
  );
}
