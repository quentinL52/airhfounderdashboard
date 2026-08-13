import { prisma } from '@/lib/prisma';
import { memory } from '@/lib/ai/memory/obsidian-memory';

export interface WatchScope {
  competitors: string[];
  queries: string[];
}

export interface ScanItem {
  id?: string;
  title: string;
  url?: string;
  content?: string;
  snippet?: string;
  source?: string;
}

export interface ScanDiffResult {
  newItems: ScanItem[];
  removedItems: ScanItem[];
  unchangedCount: number;
  hasChanges: boolean;
}

/**
 * Détermine si un rappel de veille (J+7) doit être envoyé.
 * Règle : `remindersEnabled` est vrai, `frequency` n'est pas 'manual', et le dernier scan remonte à au moins 7 jours (ou jamais effectué).
 */
export function shouldSendWatchReminder(
  settings: { frequency: string; remindersEnabled: boolean; lastRunAt: Date | null },
  now: Date = new Date()
): boolean {
  if (!settings.remindersEnabled) return false;
  if (settings.frequency === 'manual') return false;
  if (!settings.lastRunAt) return true;

  const diffMs = now.getTime() - new Date(settings.lastRunAt).getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 7;
}

/**
 * Calcule le diff entre les résultats d'un scan précédent et le scan actuel.
 */
export function calculateScanDiff(
  previousItems: ScanItem[],
  currentItems: ScanItem[]
): ScanDiffResult {
  const prevMap = new Map<string, ScanItem>();
  previousItems.forEach((item) => {
    const key = (item.url || item.title).toLowerCase().trim();
    prevMap.set(key, item);
  });

  const currMap = new Map<string, ScanItem>();
  currentItems.forEach((item) => {
    const key = (item.url || item.title).toLowerCase().trim();
    currMap.set(key, item);
  });

  const newItems: ScanItem[] = [];
  const unchanged: ScanItem[] = [];

  currentItems.forEach((item) => {
    const key = (item.url || item.title).toLowerCase().trim();
    if (prevMap.has(key)) {
      unchanged.push(item);
    } else {
      newItems.push(item);
    }
  });

  const removedItems: ScanItem[] = [];
  previousItems.forEach((item) => {
    const key = (item.url || item.title).toLowerCase().trim();
    if (!currMap.has(key)) {
      removedItems.push(item);
    }
  });

  return {
    newItems,
    removedItems,
    unchangedCount: unchanged.length,
    hasChanges: newItems.length > 0 || removedItems.length > 0,
  };
}

/**
 * Récupère ou initialise la configuration de veille d'un utilisateur.
 */
export async function getWatchSettings(userId: string) {
  let settings = await prisma.watchSettings.findUnique({
    where: { userId },
  });

  if (!settings) {
    settings = await prisma.watchSettings.create({
      data: {
        userId,
        frequency: 'manual',
        scope: { competitors: [], queries: [] },
        remindersEnabled: true,
      },
    });
  }

  return settings;
}

/**
 * Met à jour la configuration de veille d'un utilisateur.
 */
export async function updateWatchSettings(
  userId: string,
  data: { frequency?: string; scope?: WatchScope; remindersEnabled?: boolean }
) {
  return prisma.watchSettings.upsert({
    where: { userId },
    create: {
      userId,
      frequency: data.frequency || 'manual',
      scope: (data.scope || { competitors: [], queries: [] }) as any,
      remindersEnabled: data.remindersEnabled ?? true,
    },
    update: {
      ...(data.frequency !== undefined && { frequency: data.frequency }),
      ...(data.scope !== undefined && { scope: data.scope as any }),
      ...(data.remindersEnabled !== undefined && { remindersEnabled: data.remindersEnabled }),
    },
  });
}

/**
 * Exécute un scan de veille concurrentielle pour un utilisateur.
 */
export async function executeWatchScan(userId: string) {
  const settings = await getWatchSettings(userId);
  const scope = (settings.scope as unknown as WatchScope) || { competitors: [], queries: [] };

  // 1. Récupérer le dernier scan depuis la mémoire vectorielle
  const previousMemory = await memory.search(userId, 'competitive-watch scan', { limit: 1 });
  let previousItems: ScanItem[] = [];
  if (previousMemory.length > 0 && previousMemory[0].content) {
    try {
      const match = previousMemory[0].content.match(/```json\n([\s\S]*?)\n```/);
      if (match && match[1]) {
        previousItems = JSON.parse(match[1]);
      }
    } catch (e) {
      console.warn('[executeWatchScan] Impossible de parser le scan précédent:', e);
    }
  }

  // 2. Simuler/Effectuer la recherche pour les requêtes & concurrents configurés
  const currentItems: ScanItem[] = [];
  
  // Pour chaque concurrent ou requête, on construit la liste des résultats
  const searchTerms = [
    ...(scope.competitors || []).map((c) => `Nouveautés et actualités de ${c}`),
    ...(scope.queries || []),
  ];

  if (searchTerms.length === 0) {
    searchTerms.push('Veille concurrentielle secteur SaaS startup');
  }

  for (const term of searchTerms) {
    // Note: Dans un environnement réel, on appelle l'agent de recherche ou l'API Tavily/Serp.
    currentItems.push({
      title: `Résultat de veille : ${term}`,
      url: `https://search.helmdash.app/results?q=${encodeURIComponent(term)}`,
      snippet: `Signaux récents détectés pour ${term} le ${new Date().toLocaleDateString('fr-FR')}`,
      source: 'web_search',
    });
  }

  // 3. Calculer le diff
  const diff = calculateScanDiff(previousItems, currentItems);

  // 4. Mettre à jour lastRunAt
  const updatedSettings = await prisma.watchSettings.update({
    where: { userId },
    data: { lastRunAt: new Date() },
  });

  // 5. Sauvegarder dans la mémoire vectorielle
  const memoryContent = `Scan de veille concurrentielle (${new Date().toISOString()})
Fréquence : ${settings.frequency}
Changements détectés : ${diff.hasChanges ? 'Oui' : 'Non'} (${diff.newItems.length} nouveaux, ${diff.removedItems.length} retirés)

\`\`\`json
${JSON.stringify(currentItems, null, 2)}
\`\`\``;

  await memory.upsertNote({
    userId,
    content: memoryContent,
    type: 'research',
    tags: ['competitive-watch', 'scan', 'market'],
    source: 'agent',
  });

  return {
    success: true,
    lastRunAt: updatedSettings.lastRunAt,
    diff,
    items: currentItems,
  };
}

/**
 * Job quotidien : Traitement des rappels J+7 de veille.
 */
export async function processDailyWatchReminders() {
  const now = new Date();
  const eligibleSettings = await prisma.watchSettings.findMany({
    where: {
      remindersEnabled: true,
      frequency: { not: 'manual' },
    },
  });

  let reminderCount = 0;

  for (const settings of eligibleSettings) {
    if (shouldSendWatchReminder(settings, now)) {
      // Créer une notification in-app ou log de rappel
      reminderCount++;
    }
  }

  return { processed: eligibleSettings.length, remindersSent: reminderCount };
}
