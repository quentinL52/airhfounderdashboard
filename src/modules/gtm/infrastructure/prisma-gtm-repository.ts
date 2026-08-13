/**
 * Infrastructure repository implementing Prisma access for GTM strategy, contacts, and hypotheses.
 * Modular Monolith Architecture - GTM Module (Infrastructure Layer)
 */

import { prisma } from '@/lib/prisma';
import { GoToMarketStrategy, Contact, GrowthHypothesis, Interaction } from '../domain';
import { ContactStatus, ContactType, HypothesisCategory, HypothesisRisk, HypothesisStatus } from '@prisma/client';

export class PrismaGtmRepository {
  /**
   * Fetches GTM Strategy for a user.
   */
  async getGtmStrategy(userId: string): Promise<GoToMarketStrategy | null> {
    const record = await prisma.gtmStrategy.findUnique({
      where: { userId },
    });

    if (!record) return null;

    return {
      sbHero: record.sbHero || '',
      sbProblem: record.sbProblem || '',
      sbGuide: record.sbGuide || '',
      oaAlternatives: record.oaAlternatives || '',
      oaUniqueAttributes: record.oaUniqueAttributes || '',
      oaValue: record.oaValue || '',
      ompTarget: record.ompTarget || '',
      ompMessage: record.ompMessage || '',
      ompMedia: record.ompMedia || '',
      csAtomicNetwork: record.csAtomicNetwork || '',
      owCadence: record.owCadence || '',
    };
  }

  /**
   * Creates or updates GTM Strategy for a user.
   */
  async upsertGtmStrategy(userId: string, strategy: Partial<GoToMarketStrategy>): Promise<GoToMarketStrategy> {
    const record = await prisma.gtmStrategy.upsert({
      where: { userId },
      create: {
        userId,
        sbHero: strategy.sbHero,
        sbProblem: strategy.sbProblem,
        sbGuide: strategy.sbGuide,
        oaAlternatives: strategy.oaAlternatives,
        oaUniqueAttributes: strategy.oaUniqueAttributes,
        oaValue: strategy.oaValue,
        ompTarget: strategy.ompTarget,
        ompMessage: strategy.ompMessage,
        ompMedia: strategy.ompMedia,
        csAtomicNetwork: strategy.csAtomicNetwork,
        owCadence: strategy.owCadence,
      },
      update: {
        sbHero: strategy.sbHero,
        sbProblem: strategy.sbProblem,
        sbGuide: strategy.sbGuide,
        oaAlternatives: strategy.oaAlternatives,
        oaUniqueAttributes: strategy.oaUniqueAttributes,
        oaValue: strategy.oaValue,
        ompTarget: strategy.ompTarget,
        ompMessage: strategy.ompMessage,
        ompMedia: strategy.ompMedia,
        csAtomicNetwork: strategy.csAtomicNetwork,
        owCadence: strategy.owCadence,
        updatedAt: new Date(),
      },
    });

    return {
      sbHero: record.sbHero || '',
      sbProblem: record.sbProblem || '',
      sbGuide: record.sbGuide || '',
      oaAlternatives: record.oaAlternatives || '',
      oaUniqueAttributes: record.oaUniqueAttributes || '',
      oaValue: record.oaValue || '',
      ompTarget: record.ompTarget || '',
      ompMessage: record.ompMessage || '',
      ompMedia: record.ompMedia || '',
      csAtomicNetwork: record.csAtomicNetwork || '',
      owCadence: record.owCadence || '',
    };
  }

  /**
   * Fetches contacts for a user.
   */
  async getContacts(userId: string): Promise<Contact[]> {
    const records = await prisma.contact.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    return records.map(r => ({
      id: r.id,
      name: r.name,
      type: (r.type as any) || undefined,
      role: r.role || undefined,
      company: r.company || undefined,
      email: r.email || undefined,
      linkedin: r.linkedin || undefined,
      status: (r.status as any) || 'a_contacter',
      pipelineStage: r.pipelineStage || undefined,
      lastContactDate: r.lastContactDate ? r.lastContactDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      nextActionDate: r.nextActionDate ? r.nextActionDate.toISOString().split('T')[0] : undefined,
      nextActionLabel: r.nextActionLabel || undefined,
      nextAction: r.nextAction || undefined,
      lastInteractionAt: r.lastInteractionAt ? r.lastInteractionAt.toISOString() : undefined,
      waitingOn: r.waitingOn || undefined,
      dealValue: r.dealValue || undefined,
      dormant: r.dormant || false,
      notionId: r.notionId || undefined,
      notes: r.notes || undefined,
      tags: r.tags || [],
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  /**
   * Creates a contact.
   */
  async createContact(userId: string, data: Partial<Contact>): Promise<Contact> {
    const record = await prisma.contact.create({
      data: {
        id: data.id,
        userId,
        name: data.name || 'Unnamed Contact',
        type: data.type as ContactType || null,
        role: data.role,
        company: data.company,
        email: data.email,
        linkedin: data.linkedin,
        status: (data.status as ContactStatus) || 'a_contacter',
        pipelineStage: data.pipelineStage,
        lastContactDate: data.lastContactDate ? new Date(data.lastContactDate) : new Date(),
        nextActionDate: data.nextActionDate ? new Date(data.nextActionDate) : null,
        nextActionLabel: data.nextActionLabel,
        nextAction: data.nextAction,
        waitingOn: data.waitingOn,
        dealValue: data.dealValue,
        dormant: data.dormant || false,
        notionId: data.notionId,
        notes: data.notes,
        tags: data.tags || [],
      },
    });

    return {
      id: record.id,
      name: record.name,
      type: (record.type as any) || undefined,
      role: record.role || undefined,
      company: record.company || undefined,
      email: record.email || undefined,
      linkedin: record.linkedin || undefined,
      status: (record.status as any) || 'a_contacter',
      pipelineStage: record.pipelineStage || undefined,
      lastContactDate: record.lastContactDate ? record.lastContactDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      nextActionDate: record.nextActionDate ? record.nextActionDate.toISOString().split('T')[0] : undefined,
      nextActionLabel: record.nextActionLabel || undefined,
      nextAction: record.nextAction || undefined,
      notes: record.notes || undefined,
      tags: record.tags || [],
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  /**
   * Updates a contact.
   */
  async updateContact(userId: string, contactId: string, data: Partial<Contact>): Promise<void> {
    await prisma.contact.update({
      where: { id: contactId, userId },
      data: {
        name: data.name,
        type: data.type as ContactType || undefined,
        role: data.role,
        company: data.company,
        email: data.email,
        linkedin: data.linkedin,
        status: data.status as ContactStatus || undefined,
        pipelineStage: data.pipelineStage,
        lastContactDate: data.lastContactDate ? new Date(data.lastContactDate) : undefined,
        nextActionDate: data.nextActionDate ? new Date(data.nextActionDate) : null,
        nextActionLabel: data.nextActionLabel,
        nextAction: data.nextAction,
        waitingOn: data.waitingOn,
        dealValue: data.dealValue,
        dormant: data.dormant,
        notes: data.notes,
        tags: data.tags,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Deletes a contact.
   */
  async deleteContact(userId: string, contactId: string): Promise<void> {
    await prisma.contact.delete({
      where: { id: contactId, userId },
    });
  }

  /**
   * Fetches growth hypotheses for a user.
   */
  async getHypotheses(userId: string): Promise<GrowthHypothesis[]> {
    const records = await prisma.hypothesis.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return records.map(r => ({
      id: r.id,
      statement: r.statement,
      category: r.category as HypothesisCategory,
      riskLevel: r.riskLevel as HypothesisRisk,
      testMethod: r.testMethod,
      successCriteria: r.successCriteria,
      deadline: r.deadline ? r.deadline.toISOString().split('T')[0] : undefined,
      cost: r.cost || 0,
      measureNotes: r.measureNotes || undefined,
      status: r.status as HypothesisStatus,
      actualResult: r.actualResult || undefined,
      learnings: r.learnings || undefined,
      nextAction: r.nextAction || undefined,
      pivotedFromId: r.pivotedFromId || undefined,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  /**
   * Creates a growth hypothesis.
   */
  async createHypothesis(userId: string, data: Partial<GrowthHypothesis>): Promise<GrowthHypothesis> {
    const record = await prisma.hypothesis.create({
      data: {
        id: data.id,
        userId,
        statement: data.statement || '',
        category: (data.category as HypothesisCategory) || 'problem',
        riskLevel: (data.riskLevel as HypothesisRisk) || 'medium',
        testMethod: data.testMethod || '',
        successCriteria: data.successCriteria || '',
        deadline: data.deadline ? new Date(data.deadline) : null,
        cost: data.cost || 0,
        status: (data.status as HypothesisStatus) || 'draft',
      },
    });

    return {
      id: record.id,
      statement: record.statement,
      category: record.category as HypothesisCategory,
      riskLevel: record.riskLevel as HypothesisRisk,
      testMethod: record.testMethod,
      successCriteria: record.successCriteria,
      deadline: record.deadline ? record.deadline.toISOString().split('T')[0] : undefined,
      cost: record.cost || 0,
      status: record.status as HypothesisStatus,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  /**
   * Updates a growth hypothesis.
   */
  async updateHypothesis(userId: string, hypothesisId: string, data: Partial<GrowthHypothesis>): Promise<void> {
    await prisma.hypothesis.update({
      where: { id: hypothesisId, userId },
      data: {
        statement: data.statement,
        category: data.category as HypothesisCategory || undefined,
        riskLevel: data.riskLevel as HypothesisRisk || undefined,
        testMethod: data.testMethod,
        successCriteria: data.successCriteria,
        deadline: data.deadline ? new Date(data.deadline) : null,
        cost: data.cost,
        measureNotes: data.measureNotes,
        status: data.status as HypothesisStatus || undefined,
        actualResult: data.actualResult,
        learnings: data.learnings,
        nextAction: data.nextAction,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Deletes a growth hypothesis.
   */
  async deleteHypothesis(userId: string, hypothesisId: string): Promise<void> {
    await prisma.hypothesis.delete({
      where: { id: hypothesisId, userId },
    });
  }

  /**
   * Records an interaction for a contact.
   */
  async recordInteraction(userId: string, contactId: string, type: string, content: string): Promise<Interaction> {
    const record = await prisma.interaction.create({
      data: {
        userId,
        contactId,
        type,
        content,
      },
    });

    await prisma.contact.update({
      where: { id: contactId, userId },
      data: {
        lastInteractionAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return {
      id: record.id,
      contactId: record.contactId,
      type: record.type as any,
      content: record.content,
      createdAt: record.createdAt.toISOString(),
    };
  }
}
