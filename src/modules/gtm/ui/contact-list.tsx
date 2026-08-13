'use client';

import React from 'react';
import { Contact, calculateLeadScore } from '../domain/contact';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Mail, Edit2, Trash2, ExternalLink } from 'lucide-react';

interface ContactListProps {
  contacts: Contact[];
  onEdit?: (contact: Contact) => void;
  onDelete?: (id: string) => void;
  onFollowUp?: (contact: Contact) => void;
}

export function ContactList({ contacts, onEdit, onDelete, onFollowUp }: ContactListProps) {
  if (!contacts || contacts.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed rounded-md text-sm text-muted-foreground">
        No contacts available in GTM CRM pipeline.
      </div>
    );
  }

  return (
    <div className="border border-border rounded-md overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="text-xs font-semibold">Contact Name</TableHead>
            <TableHead className="text-xs font-semibold">Company / Role</TableHead>
            <TableHead className="text-xs font-semibold">Status</TableHead>
            <TableHead className="text-xs font-semibold">Lead Score</TableHead>
            <TableHead className="text-xs font-semibold">Last Contact</TableHead>
            <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => {
            const scoreInfo = calculateLeadScore(contact);
            const badgeVariant = scoreInfo.tier === 'hot' ? 'default' : scoreInfo.tier === 'warm' ? 'secondary' : 'outline';

            return (
              <TableRow key={contact.id} className="hover:bg-muted/40">
                <TableCell className="font-medium text-xs">
                  <div>{contact.name}</div>
                  {contact.email && <div className="text-[10px] text-muted-foreground">{contact.email}</div>}
                </TableCell>
                <TableCell className="text-xs">
                  <div>{contact.company || '-'}</div>
                  <div className="text-[10px] text-muted-foreground">{contact.role || ''}</div>
                </TableCell>
                <TableCell className="text-xs">
                  <Badge variant="outline" className="capitalize text-[10px]">
                    {contact.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">
                  <Badge variant={badgeVariant} className="text-[10px]">
                    {scoreInfo.tier.toUpperCase()} ({scoreInfo.score})
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {contact.lastContactDate || '-'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {onFollowUp && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onFollowUp(contact)} title="Follow up">
                        <Mail className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {onEdit && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(contact)} title="Edit">
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(contact.id)} title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
