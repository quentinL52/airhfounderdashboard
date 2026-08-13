import { prisma } from '@/lib/prisma';
import { AgentProposalDTO, AgentTaskDTO } from '../domain/types';

export class AgentRepository {
  /**
   * Retrieves conversation with messages.
   */
  async getConversation(conversationId: string, userId: string) {
    return prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  /**
   * Lists recent conversations for a user.
   */
  async listConversations(userId: string, limit = 20) {
    return prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Creates a new conversation.
   */
  async createConversation(userId: string, title?: string, id?: string) {
    return prisma.conversation.create({
      data: {
        ...(id ? { id } : {}),
        userId,
        title: title || 'Nouvelle conversation',
      },
    });
  }

  /**
   * Saves messages to a conversation.
   */
  async saveMessages(conversationId: string, messages: Array<{ role: string; content: string }>) {
    return prisma.message.createMany({
      data: messages.map((m) => ({
        conversationId,
        role: m.role,
        content: m.content,
      })),
    });
  }

  /**
   * Lists delegated agent tasks.
   */
  async listTasks(userId: string, limit = 20): Promise<AgentTaskDTO[]> {
    const tasks = await prisma.agentTask.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return tasks as AgentTaskDTO[];
  }

  /**
   * Creates a record for a delegated agent task.
   */
  async createTask(data: { userId: string; taskId: string; agentRole: string; taskObjective: string }): Promise<AgentTaskDTO> {
    const task = await prisma.agentTask.create({
      data: {
        userId: data.userId,
        taskId: data.taskId,
        agentRole: data.agentRole,
        taskObjective: data.taskObjective,
        status: 'pending',
      },
    });
    return task as AgentTaskDTO;
  }

  /**
   * Updates an agent task status and result.
   */
  async updateTaskStatus(
    taskId: string,
    status: string,
    result?: Record<string, unknown> | null,
    errorMessage?: string | null
  ) {
    return prisma.agentTask.update({
      where: { taskId },
      data: {
        status,
        result: result as any,
        errorMessage,
        ...(status === 'running' ? { startedAt: new Date() } : {}),
        ...(status === 'success' || status === 'failed' || status === 'partial' ? { completedAt: new Date() } : {}),
      },
    });
  }

  /**
   * Lists pending proposals for a user.
   */
  async listProposals(userId: string, status = 'pending'): Promise<AgentProposalDTO[]> {
    const proposals = await prisma.agentProposal.findMany({
      where: { userId, status },
      orderBy: { createdAt: 'desc' },
    });
    return proposals as AgentProposalDTO[];
  }

  /**
   * Finds a proposal by ID.
   */
  async findProposalById(proposalId: string, userId: string): Promise<AgentProposalDTO | null> {
    const proposal = await prisma.agentProposal.findFirst({
      where: { id: proposalId, userId },
    });
    return proposal as AgentProposalDTO | null;
  }

  /**
   * Updates proposal status (accepted/rejected).
   */
  async updateProposalStatus(proposalId: string, status: 'accepted' | 'rejected') {
    return prisma.agentProposal.update({
      where: { id: proposalId },
      data: { status },
    });
  }

  /**
   * Enforces Decision D8: Agent chat, tasks, proposals and memory deleted on account purge.
   */
  async deleteUserData(userId: string) {
    return prisma.$transaction([
      prisma.conversation.deleteMany({ where: { userId } }),
      prisma.agentTask.deleteMany({ where: { userId } }),
      prisma.agentProposal.deleteMany({ where: { userId } }),
      prisma.memoryNote.deleteMany({ where: { userId } }),
    ]);
  }
}

export const agentRepository = new AgentRepository();
