'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useFounderStore } from '@/store/founder-store';
import { Contact, ContactStatus, LeadScoringService } from '@/modules/gtm';
import { ContactDialog } from '@/components/crm/contact-dialog';
import { generateFollowUp } from '@/lib/ai-service';
import { getGoogleProviderToken, fetchGoogleContacts } from '@/lib/google-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Plus, Search, Edit2, Trash2, Mail, Users, Linkedin, RefreshCw, DownloadCloud, Pencil } from 'lucide-react';
import { translations } from '@/lib/translations';
import { AgentTriggerButton } from '@/components/dashboard/agent-trigger-button';
import { Network } from 'lucide-react';
import { PageAgent } from '@/components/agent/PageAgent';
import { createClient } from '@/utils/supabase/client';

const STATUS_COLORS: Record<ContactStatus, string> = {
    'À contacter': 'border-primary/50 text-primary',
    'En discussion': 'border-warning/50 text-warning',
    'Qualifié': 'border-cyan-500/50 text-cyan-400',
    'Client': 'border-success/50 text-success',
    'Perdu': 'border-danger/50 text-danger',
};

export default function CRMPage() {
    const [userId, setUserId] = useState<string | null>(null);
    const { contacts, addContact, deleteContact, goToMarket } = useFounderStore();
    const language = useFounderStore(s => s.language);
    const t = (translations[language] as any).crm || {};
    const common = translations[language].common;

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            if (data?.user) setUserId(data.user.id);
        });
    }, []);

    const pageContext = contacts?.length
        ? `${contacts.length} contacts, ${contacts.filter(c => c.status === 'À contacter' || c.status === 'En discussion').length} en cours.`
        : 'Aucun contact pour le moment.';

    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [importLoading, setImportLoading] = useState(false);

    const filteredContacts = useMemo(() => contacts.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.role?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [contacts, searchTerm]);

    const handleEdit = useCallback((contact: Contact) => {
        setSelectedContact(contact);
        setIsDialogOpen(true);
    }, []);

    const handleNew = useCallback(() => {
        setSelectedContact(null);
        setIsDialogOpen(true);
    }, []);

    const handleGenerateFollowUp = useCallback(async (contact: Contact) => {
        if (!contact.notes) {
            alert('Ajoutez d\'abord des notes pour générer un message pertinent.');
            return;
        }
        setAiLoading(true);
        try {
            const draft = await generateFollowUp(contact);
            setSelectedContact({ ...contact, lastContactDate: new Date().toISOString() });
            alert('Brouillon généré :\n\n' + draft);
        } catch (error) {
            console.error(error);
            alert('Erreur lors de la génération. Vérifiez vos clés API.');
        } finally {
            setAiLoading(false);
        }
    }, []);

    const handleGoogleImport = async () => {
        setImportLoading(true);
        try {
            const token = await getGoogleProviderToken();
            if (!token) {
                alert("Impossible d'obtenir le token Google. L'utilisateur doit se connecter avec Google.");
                setImportLoading(false);
                return;
            }

            const googleContacts = await fetchGoogleContacts(token);
            let importedCount = 0;
            
            for (const gc of googleContacts) {
                const name = gc.names?.[0]?.displayName || 'Inconnu';
                const email = gc.emailAddresses?.[0]?.value;
                const company = gc.organizations?.[0]?.name;
                const role = gc.organizations?.[0]?.title;

                if (!contacts.some(c => c.email === email && email !== undefined)) {
                    addContact({
                        name,
                        email,
                        company,
                        role,
                        status: 'À contacter',
                        notes: 'Importé depuis Google Contacts',
                        lastContactDate: new Date().toISOString(),
                    });
                    importedCount++;
                }
            }
            alert(`${importedCount} contact(s) importé(s) avec succès !`);
        } catch (error) {
            console.error("Erreur d'import", error);
            alert("Erreur lors de l'importation. Avez-vous accepté les permissions Google Contacts ?");
        } finally {
            setImportLoading(false);
        }
    };

    const locale = language === 'fr' ? 'fr-FR' : 'en-US';

    return (
        <div className="h-full flex flex-col p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-pixel text-blue-500 flex items-center gap-3">
                        <Users className="w-8 h-8" />
                        {t.title || 'CRM Lite'}
                    </h1>
                    <p className="text-muted-foreground mt-2">{t.subtitle || 'Gérez vos prospects et contacts'}</p>
                </div>
                <div className="flex gap-2">
                    <AgentTriggerButton 
                        agentId="relationship-manager"
                        label="ANALYSER LE RÉSEAU"
                        endpoint="/api/ai/agents/crm"
                        icon={<Network className="w-4 h-4 mr-2" />}
                        getContext={(store) => ({
                            contacts: store.contacts
                        })}
                        variant="secondary"
                        className="font-pixel text-[10px] bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border border-blue-500/20 shadow-[2px_2px_0px_0px_rgba(59,130,246,0.3)]"
                    />
                    <Button
                        variant="outline"
                        onClick={handleGoogleImport}
                        disabled={importLoading}
                        className="border-border text-foreground hover:bg-muted"
                    >
                        <DownloadCloud className={`mr-2 h-4 w-4 ${importLoading ? 'animate-pulse text-primary' : ''}`} />
                        {importLoading ? 'Import en cours...' : 'Import Google'}
                    </Button>
                    <Button
                        onClick={handleNew}
                    >
                        <Plus className="mr-2 h-4 w-4" /> {t.addContact || 'Ajouter un contact'}
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t.searchPlaceholder || "Rechercher un contact..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-card border-border text-foreground focus:ring-primary"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
                <Table>
                    <TableHeader className="bg-card">
                        <TableRow className="border-border hover:bg-card">
                            <TableHead className="text-muted-foreground">{t.columns?.name || 'Nom'}</TableHead>
                            <TableHead className="text-muted-foreground">{t.columns?.roleCompany || 'Rôle & Entreprise'}</TableHead>
                            <TableHead className="text-muted-foreground">{t.columns?.status || common.status}</TableHead>
                            <TableHead className="text-muted-foreground">{t.columns?.lastContact || 'Dernier contact'}</TableHead>
                            <TableHead className="text-muted-foreground">Contact prévu</TableHead>
                            <TableHead className="text-right text-muted-foreground">{t.columns?.actions || 'Actions'}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredContacts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    {t.noContacts || 'Aucun contact trouvé.'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredContacts.map((contact) => (
                                <TableRow key={contact.id} className="border-border hover:bg-muted/50 group">

                                    {/* Nom + icônes mail/linkedin dynamiques */}
                                    <TableCell className="font-medium text-foreground">
                                        <div className="flex flex-col gap-1">
                                            <span>{contact.name}</span>
                                            {(contact.email || contact.linkedin) && (
                                                <div className="flex items-center gap-2">
                                                    {contact.email && (
                                                        <a
                                                            href={`mailto:${contact.email}`}
                                                            title={contact.email}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <Mail className="w-3.5 h-3.5 text-muted-foreground hover:text-cyan-400 transition-colors" />
                                                        </a>
                                                    )}
                                                    {contact.linkedin && (
                                                        <a
                                                            href={contact.linkedin}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            title="LinkedIn"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <Linkedin className="w-3.5 h-3.5 text-muted-foreground hover:text-blue-500 transition-colors" />
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>

                                    {/* Rôle & Entreprise */}
                                    <TableCell className="text-foreground">
                                        <div className="flex flex-col">
                                            {contact.type && (
                                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80 mb-1">
                                                    {contact.type}
                                                </span>
                                            )}
                                            <span>{contact.role || '-'}</span>
                                            {contact.company && <span className="text-xs text-muted-foreground">{contact.company}</span>}
                                        </div>
                                    </TableCell>

                                     {/* Statut & Qualification ICP */}
                                     <TableCell>
                                         <div className="flex flex-col gap-1 items-start">
                                             <Badge variant="outline" className={`capitalize font-medium border ${STATUS_COLORS[contact.status] || 'border-border'}`}>
                                                 {t.statuses?.[contact.status] || contact.status}
                                             </Badge>
                                             {(() => {
                                                 const target = (goToMarket?.ompTarget || '').toLowerCase();
                                                 if (!target) return null;
                                                 const text = `${contact.role || ''} ${contact.company || ''} ${contact.type || ''} ${contact.notes || ''}`.toLowerCase();
                                                 const isMatch = target.split(/\s+/).some(word => word.length > 3 && text.includes(word));
                                                 return isMatch ? (
                                                     <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px] px-1.5 py-0">
                                                         ICP Match
                                                     </Badge>
                                                 ) : (
                                                     <Badge variant="outline" className="text-[9px] text-muted-foreground opacity-60 px-1.5 py-0">
                                                         No Match
                                                     </Badge>
                                                 );
                                             })()}
                                         </div>
                                     </TableCell>
                                    {/* Dernier contact */}
                                    <TableCell className="text-muted-foreground text-sm">
                                        {contact.lastContactDate ? new Date(contact.lastContactDate).toLocaleDateString(locale) : '—'}
                                    </TableCell>

                                    {/* Contact prévu */}
                                    <TableCell className="text-sm">
                                        {contact.nextActionDate ? (
                                            <div className="flex flex-col">
                                                <span className="text-primary">
                                                    {new Date(contact.nextActionDate).toLocaleDateString(locale)}
                                                </span>
                                                {contact.nextActionLabel && (
                                                    <span className="text-xs text-muted-foreground truncate max-w-[120px]" title={contact.nextActionLabel}>
                                                        {contact.nextActionLabel}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </TableCell>

                                    {/* Actions */}
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">

                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                onClick={() => handleGenerateFollowUp(contact)}
                                                disabled={aiLoading}
                                                title={t.generateFollowUp || "Générer un suivi IA"}
                                            >
                                                <RefreshCw className={`h-4 w-4 ${aiLoading ? 'animate-spin' : ''}`} />
                                            </Button>

                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                onClick={() => handleEdit(contact)}
                                                title={common.edit}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-muted-foreground hover:text-red-400"
                                                onClick={() => deleteContact(contact.id)}
                                                title={common.delete}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <ContactDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                contactToEdit={selectedContact}
            />

            {userId && (
                <PageAgent userId={userId} pageLabel="CRM" pageContext={pageContext} />
            )}
        </div>
    );
}
