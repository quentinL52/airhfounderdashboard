/**
 * Helmdash — Logger structuré avec Sentry optionnel
 *
 * Utilise Sentry si configuré (SENTRY_DSN), sinon fallback vers console.
 * Format JSON structuré pour aggregabilité (Logtail, Grafana, etc.).
 */

import { getRequestContext } from '@/modules/shared/infrastructure/http/request-context';

const SENTRY_DSN = process.env.SENTRY_DSN || '';

// Lazy-init Sentry pour éviter l'import au build si pas configuré
let sentryInstance: any = null;
let sentryAttempted = false;

async function getSentry() {
  if (!SENTRY_DSN) return null;
  if (!sentryAttempted) {
    sentryAttempted = true;
    try {
      const Sentry = await import('@sentry/nextjs');
      sentryInstance = Sentry.default || Sentry;
    } catch {
      sentryInstance = null;
    }
  }
  return sentryInstance;
}

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  traceId?: string;
  route?: string;
  userId?: string;
  duration?: number;
  errorDetails?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log structuré — écrit en console + envoie à Sentry si configuré.
 */
function log(level: LogLevel, message: string, meta?: {
  route?: string;
  userId?: string;
  traceId?: string;
  duration?: number;
  error?: unknown;
  [key: string]: unknown;
}) {
  const ctx = getRequestContext();
  const route = (meta?.route as string) || ctx?.route;
  const userId = (meta?.userId as string) || ctx?.userId;
  const traceId = (meta?.traceId as string) || ctx?.traceId;

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    traceId,
    route,
    userId,
    duration: meta?.duration as number,
    errorDetails: meta?.error
      ? meta.error instanceof Error
        ? meta.error.stack || meta.error.message
        : typeof meta.error === 'object'
        ? JSON.stringify(meta.error)
        : String(meta.error)
      : undefined,
    metadata: meta ? { ...meta } : undefined,
  };

  // Supprimer les champs déjà extraits du metadata pour éviter la duplication
  if (entry.metadata) {
    delete entry.metadata.route;
    delete entry.metadata.userId;
    delete entry.metadata.traceId;
    delete entry.metadata.duration;
    delete entry.metadata.error;
    if (Object.keys(entry.metadata).length === 0) {
      delete entry.metadata;
    }
  }

  // Console JSON structuré
  const formatted = JSON.stringify(entry);
  switch (level) {
    case 'error':
      console.error(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'debug':
      console.debug(formatted);
      break;
    default:
      console.log(formatted);
  }

  // Sentry pour les erreurs uniquement
  if (level === 'error' && SENTRY_DSN && meta?.error) {
    getSentry().then((Sentry) => {
      if (Sentry?.captureException) {
        Sentry.captureException(meta.error, {
          tags: { route, traceId },
          user: userId ? { id: userId } : undefined,
          extra: entry.metadata as Record<string, unknown>,
        });
      }
    });
  }
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
  error: (message: string, error?: unknown, meta?: Record<string, unknown>) => log('error', message, { ...meta, error }),
  debug: (message: string, meta?: Record<string, unknown>) => log('debug', message, meta),

  /**
   * Middleware pour logger les appels API IA
   */
  apiCall: (route: string, userId: string, duration: number, status: 'success' | 'error', meta?: Record<string, unknown>) => {
    log(status === 'error' ? 'error' : 'info', `API ${route}`, {
      route,
      userId,
      duration,
      ...meta,
    });
  },
};