/**
 * Infrastructure repository implementing Prisma access for Contact persistence and CRM querying.
 * Modular Monolith Architecture - GTM Module (Infrastructure Layer)
 */

import { prisma } from '@/lib/prisma';
import { Contact } from '../domain/contact';
import { ContactStatus, ContactType } from '@prisma/client';

export class PrismaContactRepository {
  /**
   * Fetches all contacts for a user ordered by last updated date.
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
   * Fetches a single contact by ID for a user.
   */
  async getContactById(userId: string, id: string): Promise<Contact | null> {
    const r = await prisma.contact.findFirst({
      where: { id, userId },
    });

    if (!r) return null;

    return {
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
    };
  }

  /**
   * Creates a new contact in Prisma.
   */
  async createContact(userId: string, data: Partial<Contact>): Promise<Contact> {
    const record = await prisma.contact.create({
      data: {
        id: data.id,
        userId,
        name: data.name || 'Unnamed Contact',
        type: (data.type as ContactType) || null,
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
   * Updates an existing contact in Prisma.
   */
  async updateContact(userId: string, contactId: string, data: Partial<Contact>): Promise<void> {
    await prisma.contact.update({
      where: { id: contactId, userId },
      data: {
        name: data.name,
        type: (data.type as ContactType) || undefined,
        role: data.role,
        company: data.company,
        email: data.email,
        linkedin: data.linkedin,
        status: (data.status as ContactStatus) || undefined,
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
   * Deletes a contact from Prisma.
   */
  async deleteContact(userId: string, contactId: string): Promise<void> {
    await prisma.contact.delete({
      where: { id: contactId, userId },
    });
  }
}
