import { NextRequest, NextResponse } from 'next/server';
import { subAgentRegistry } from '@/lib/ai/sub-agents/registry';
import { SubAgentContext } from '@/lib/ai/sub-agents/base-agent';
import { agentTaskService } from '@/lib/ai/delegation';
import { logger } from '@/lib/logging/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskId, userId, agentRole, taskObjective, context, constraints, successCriteria } = body;

    if (!taskId || !userId || !agentRole || !taskObjective) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    try {
      await agentTaskService.updateStatus(taskId, 'running');
      
      const agentContext: SubAgentContext = {
        userId,
        taskObjective,
        context,
        constraints,
        successCriteria,
      };
      
      const result = await subAgentRegistry.spawn(agentRole as any, agentContext);
      
      await agentTaskService.saveResult(taskId, result as any);
      await agentTaskService.updateStatus(taskId, result.status as any);
      
      return NextResponse.json({ success: true, taskId, status: result.status, deliverables: result.deliverables.length });
    } catch (error: any) {
      logger.error(`Sub-agent job ${taskId} failed`, error, { taskId, userId });
      await agentTaskService.updateStatus(taskId, 'failed');
      await agentTaskService.saveError(taskId, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
