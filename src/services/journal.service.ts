import { prisma } from '@/lib/prisma';

export interface DistressCheckResult {
  isDistress: boolean;
  message?: string;
}

export interface CorrelationResult {
  showCorrelation: boolean;
  correlationScore?: number;
  message?: string;
}

const DISTRESS_KEYWORDS = [
  'suicide',
  'envie de mourir',
  'idées sombres',
  'idees sombres',
  'plus envie de vivre',
  'épuisement total',
  'epuisement total',
  'dépression profonde',
  'depression profonde',
  'burnout grave',
  'bout du rouleau',
  'end it all',
  'want to die',
];

/**
 * Garde-fou statique : détecte les signaux de détresse psychologique.
 * En cas de détresse, renvoie un message statique d'orientation sans aucun coaching émotionnel génératif.
 */
export function detectDistress(text: string): DistressCheckResult {
  if (!text || typeof text !== 'string') return { isDistress: false };

  const lower = text.toLowerCase();
  const hasDistress = DISTRESS_KEYWORDS.some((kw) => lower.includes(kw));

  if (hasDistress) {
    return {
      isDistress: true,
      message:
        "Si vous traversez un moment particulièrement difficile ou un besoin d'écoute, sachez que des professionnels qualifiés sont à votre disposition de manière confidentielle et gratuite :\n- Numéro National de Prévention du Suicide : 3114 (24h/24, 7j/7)\n- SOS Amitié : 09 72 39 40 50\n- En cas d'urgence médicale : 15 (SAMU) ou 112.",
    };
  }

  return { isDistress: false };
}

/**
 * Calcule la corrélation humeur / discipline (streak).
 * Règle : Affichée UNIQUEMENT si l'utilisateur possède au moins 4 semaines (28 jours) de données.
 */
export function calculateMoodStreakCorrelation(
  moodEntries: Array<{ date: Date | string; mood: number }>,
  streakActiveDaysCount: number = 0
): CorrelationResult {
  if (!moodEntries || moodEntries.length === 0) {
    return { showCorrelation: false };
  }

  // Trier par date
  const timestamps = moodEntries
    .map((e) => new Date(e.date).getTime())
    .filter((t) => !isNaN(t))
    .sort((a, b) => a - b);

  if (timestamps.length < 2) {
    return { showCorrelation: false };
  }

  const firstDate = timestamps[0];
  const lastDate = timestamps[timestamps.length - 1];
  const timespanDays = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)) + 1;

  // Si < 28 jours (4 semaines), la corrélation est masquee
  if (timespanDays < 28) {
    return { showCorrelation: false };
  }

  // Calcul basique de corrélation
  const avgMood = moodEntries.reduce((acc, curr) => acc + curr.mood, 0) / moodEntries.length;
  const score = Math.min(1, Math.max(-1, (avgMood - 3) * 0.5 + (streakActiveDaysCount > 10 ? 0.3 : 0)));

  let message = 'Humeur stable corrélée à la régularité.';
  if (score > 0.3) {
    message = 'La régularité de vos streaks a un impact positif mesurable sur votre niveau d\'énergie.';
  } else if (score < -0.3) {
    message = 'Les périodes d\'interruption semblent coïncider avec une baisse de tonus.';
  }

  return {
    showCorrelation: true,
    correlationScore: parseFloat(score.toFixed(2)),
    message,
  };
}

/**
 * Récupère le contexte récent du journal (7 derniers jours) pour le Barreur.
 * Respecte strictement l'opt-in de l'utilisateur (`journalOptIn`).
 * Si opt-out (`journalOptIn === false`), retourne `null`.
 */
export async function getRecentJournalContext(userId: string): Promise<string | null> {
  const session = await prisma.onboardingSession.findUnique({
    where: { userId },
    select: { journalOptIn: true },
  });

  // Si l'utilisateur n'a pas donné son accord ou est en opt-out -> 0 citation
  if (session && session.journalOptIn === false) {
    return null;
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const moodEntries = await prisma.moodEntry.findMany({
    where: {
      userId,
      date: { gte: sevenDaysAgo },
    },
    orderBy: { date: 'desc' },
    take: 7,
  });

  if (moodEntries.length === 0) {
    return null;
  }

  const formattedEntries = moodEntries
    .map((e) => `- ${new Date(e.date).toLocaleDateString('fr-FR')} : Humeur ${e.moodType}${e.note ? ` ("${e.note}")` : ''}`)
    .join('\n');

  return `Journal des 7 derniers jours (opt-in actif) :\n${formattedEntries}`;
}

/**
 * Résumé hebdo de l'humeur ("Mood of the week").
 */
export async function getWeeklyMoodSummary(userId: string) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const moodEntries = await prisma.moodEntry.findMany({
    where: {
      userId,
      date: { gte: sevenDaysAgo },
    },
  });

  if (moodEntries.length === 0) {
    return {
      averageMood: 'N/A',
      moodCount: 0,
      summaryLine: 'Mood of the week: Pas d\'entrée cette semaine',
    };
  }

  // Convert mood types to numeric scale 1-5
  const moodScale: Record<string, number> = {
    very_sad: 1,
    sad: 2,
    neutral: 3,
    happy: 4,
    very_happy: 5,
  };

  const totalScore = moodEntries.reduce((sum, e) => sum + (moodScale[e.moodType] || 3), 0);
  const avg = totalScore / moodEntries.length;

  let moodLabel = 'Neutre';
  if (avg >= 4.5) moodLabel = 'Excellent';
  else if (avg >= 3.5) moodLabel = 'Bon';
  else if (avg >= 2.5) moodLabel = 'Neutre';
  else if (avg >= 1.5) moodLabel = 'Bas';
  else moodLabel = 'Très bas';

  return {
    averageMood: moodLabel,
    moodCount: moodEntries.length,
    summaryLine: `Mood of the week: ${moodLabel} (${avg.toFixed(1)}/5, ${moodEntries.length} entrée${moodEntries.length > 1 ? 's' : ''})`,
  };
}
