import { Client } from '@upstash/qstash';
import { env } from '@/lib/env';

const qstashClient = process.env.QSTASH_TOKEN ? new Client({ token: process.env.QSTASH_TOKEN }) : null;

export interface ExtractEntitiesJob {
  noteId: string;
  userId: string;
  content: string;
  type: string;
}

export const memoryQueue = {
  add: async (name: string, data: ExtractEntitiesJob) => {
    if (qstashClient) {
      await qstashClient.publishJSON({
        url: `${env.NEXT_PUBLIC_APP_URL}/api/jobs/memory-extract`,
        body: data,
      });
    } else {
      // Fallback local: appel HTTP direct (ne bloque pas)
      fetch(`${env.NEXT_PUBLIC_APP_URL}/api/jobs/memory-extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(err => console.error('Local queue fallback error:', err));
    }
  }
};
