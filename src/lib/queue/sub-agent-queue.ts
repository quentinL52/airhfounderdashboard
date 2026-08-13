import { Client } from '@upstash/qstash';
import { env } from '@/lib/env';

const qstashClient = process.env.QSTASH_TOKEN ? new Client({ token: process.env.QSTASH_TOKEN }) : null;

export interface SubAgentJobData {
  taskId: string;
  userId: string;
  agentRole: string;
  taskObjective: string;
  context?: Record<string, any>;
  constraints?: {
    budget?: number;
    deadline?: string;
    allowedTools?: string[];
  };
  successCriteria: string[];
}

export const subAgentQueue = {
  add: async (name: string, data: SubAgentJobData) => {
    if (qstashClient) {
      await qstashClient.publishJSON({
        url: `${env.NEXT_PUBLIC_APP_URL}/api/jobs/sub-agent`,
        body: data,
      });
    } else {
      // Fallback local: appel HTTP direct (ne bloque pas)
      fetch(`${env.NEXT_PUBLIC_APP_URL}/api/jobs/sub-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(err => console.error('Local queue fallback error:', err));
    }
  }
};