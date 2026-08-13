import { env } from './env';

export const APP_URL = env.NEXT_PUBLIC_APP_URL;

if (process.env.NODE_ENV === 'production' && (!APP_URL || APP_URL === 'http://localhost:3000')) {
  throw new Error('NEXT_PUBLIC_APP_URL must be defined and valid in production');
}
