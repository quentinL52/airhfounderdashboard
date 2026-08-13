/**
 * Infrastructure adapters for Email Outreach & CRM external sync (Google, Notion, CSV).
 * Modular Monolith Architecture - GTM Module (Infrastructure Layer)
 */

import { Contact } from '../domain/contact';

export interface CSVImportResult {
  importedCount: number;
  skippedCount: number;
  contacts: Partial<Contact>[];
  errors: string[];
}

export class EmailCrmAdapter {
  /**
   * Generates a mailto: link for quick outreach from the UI.
   */
  createMailtoLink(contact: Contact, subject?: string, body?: string): string {
    if (!contact.email) return '#';
    const encodedSubject = encodeURIComponent(subject || `Following up - ${contact.name}`);
    const encodedBody = encodeURIComponent(body || `Hi ${contact.name},\n\nI wanted to follow up on our previous conversation.\n\nBest regards,`);
    return `mailto:${contact.email}?subject=${encodedSubject}&body=${encodedBody}`;
  }

  /**
   * Parses CSV string into structured contacts array.
   */
  parseContactsCSV(csvContent: string): CSVImportResult {
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      return { importedCount: 0, skippedCount: 0, contacts: [], errors: ['CSV file is empty or missing headers'] };
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));
    const contacts: Partial<Contact>[] = [];
    const errors: string[] = [];
    let skippedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        const row: Record<string, string> = {};

        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });

        const name = row['name'] || row['nom'] || row['full name'] || row['contact name'];
        if (!name) {
          skippedCount++;
          continue;
        }

        const email = row['email'] || row['mail'] || row['e-mail'];
        const company = row['company'] || row['entreprise'] || row['organization'];
        const role = row['role'] || row['title'] || row['position'] || row['poste'];
        const linkedin = row['linkedin'] || row['linkedin url'];

        contacts.push({
          name,
          email: email || undefined,
          company: company || undefined,
          role: role || undefined,
          linkedin: linkedin || undefined,
          status: 'À contacter',
          lastContactDate: new Date().toISOString().split('T')[0],
        });
      } catch (err: any) {
        errors.push(`Row ${i + 1}: ${err?.message || 'Failed to parse row'}`);
        skippedCount++;
      }
    }

    return {
      importedCount: contacts.length,
      skippedCount,
      contacts,
      errors,
    };
  }

  /**
   * Exports contacts to CSV string format.
   */
  exportContactsCSV(contacts: Contact[]): string {
    const headers = ['Name', 'Email', 'Company', 'Role', 'Status', 'LastContactDate', 'DealValue', 'LinkedIn', 'Notes'];
    const rows = contacts.map(c => [
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      `"${(c.company || '').replace(/"/g, '""')}"`,
      `"${(c.role || '').replace(/"/g, '""')}"`,
      `"${(c.status || '').replace(/"/g, '""')}"`,
      `"${c.lastContactDate || ''}"`,
      `"${c.dealValue || ''}"`,
      `"${(c.linkedin || '').replace(/"/g, '""')}"`,
      `"${(c.notes || '').replace(/"/g, '""')}"`,
    ].join(','));

    return [headers.join(','), ...rows].join('\n');
  }
}
