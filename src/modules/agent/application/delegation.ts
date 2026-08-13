import { prisma } from '@/lib/prisma';
import { AgentTaskDTO } from '../domain/types';

export type AgentTaskStatus = 'pending' | 'running' | 'success' | 'partial' | 'failed' | 'needs_approval';

export const agentTaskService = {
  async create(params: {
    userId: string;
    agentRole: string;
    taskObjective: string;
    taskId?: string;
  }): Promise<AgentTaskDTO> {
    const taskId = params.taskId || `${params.agentRole}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return prisma.agentTask.create({
      data: {
        userId: params.userId,
        taskId,
        agentRole: params.agentRole,
        taskObjective: params.taskObjective,
        status: 'pending',
      },
    }) as unknown as AgentTaskDTO;
  },

  async updateStatus(taskId: string, status: AgentTaskStatus): Promise<AgentTaskDTO> {
    const updateData: Record<string, unknown> = { status };
    if (status === 'running') {
      updateData.startedAt = new Date();
    }
    if (['success', 'partial', 'failed', 'needs_approval'].includes(status)) {
      updateData.completedAt = new Date();
    }
    return prisma.agentTask.update({
      where: { taskId },
      data: updateData,
    }) as unknown as AgentTaskDTO;
  },

  async saveResult(taskId: string, result: Record<string, unknown>): Promise<AgentTaskDTO> {
    return prisma.agentTask.update({
      where: { taskId },
      data: { result: result as any },
    }) as unknown as AgentTaskDTO;
  },

  async saveError(taskId: string, errorMessage: string): Promise<AgentTaskDTO> {
    return prisma.agentTask.update({
      where: { taskId },
      data: { errorMessage },
    }) as unknown as AgentTaskDTO;
  },

  async listForUser(
    userId: string,
    filters?: { status?: AgentTaskStatus; agentRole?: string; limit?: number }
  ): Promise<AgentTaskDTO[]> {
    const where: Record<string, unknown> = { userId };
    if (filters?.status) where.status = filters.status;
    if (filters?.agentRole) where.agentRole = filters.agentRole;

    return prisma.agentTask.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit ?? 50,
    }) as unknown as AgentTaskDTO[];
  },

  async getPending(): Promise<AgentTaskDTO[]> {
    return prisma.agentTask.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
    }) as unknown as AgentTaskDTO[];
  },
};

export class TaskDelegator {
  delegateTask(title: string, _description: string, role: string) {
    return agentTaskService.create({
      userId: 'system',
      agentRole: role,
      taskObjective: title,
    });
  }

  async getTasksByRole(_role: string) {
    return [];
  }

  async getPendingTasks() {
    return agentTaskService.getPending();
  }

  async updateTaskStatus(taskId: string, status: AgentTaskStatus) {
    return agentTaskService.updateStatus(taskId, status);
  }
}

export const taskDelegator = new TaskDelegator();
