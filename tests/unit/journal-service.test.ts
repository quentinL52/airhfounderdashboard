import { describe, it, expect, vi } from 'vitest';
import { detectDistress, calculateMoodStreakCorrelation, getRecentJournalContext } from '@/services/journal.service';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    onboardingSession: {
      findUnique: vi.fn(),
    },
    moodEntry: {
      findMany: vi.fn(),
    },
  },
}));

describe('JournalService Unit Tests (Gate J)', () => {
  describe('detectDistress (Safety Guardrail)', () => {
    it('detects distress keywords and returns static helpline message', () => {
      const result = detectDistress("Je suis en burnout grave et je n'ai plus la force d'avancer.");
      expect(result.isDistress).toBe(true);
      expect(result.message).toContain('3114');
      expect(result.message).toContain('SOS Amitié');
    });

    it('returns isDistress false for normal journal notes', () => {
      const result = detectDistress('Bonne journée de travail, les objectifs du jour sont atteints.');
      expect(result.isDistress).toBe(false);
      expect(result.message).toBeUndefined();
    });
  });

  describe('calculateMoodStreakCorrelation', () => {
    it('hides correlation if data timespan is less than 4 weeks (14 days fixture)', () => {
      const twoWeeksData = [
        { date: '2026-07-01T10:00:00Z', mood: 4 },
        { date: '2026-07-14T10:00:00Z', mood: 3 },
      ];
      const result = calculateMoodStreakCorrelation(twoWeeksData, 5);
      expect(result.showCorrelation).toBe(false);
    });

    it('shows correlation if data timespan is at least 4 weeks (35 days / 5 weeks fixture)', () => {
      const fiveWeeksData = [
        { date: '2026-06-01T10:00:00Z', mood: 4 },
        { date: '2026-06-15T10:00:00Z', mood: 3 },
        { date: '2026-07-05T10:00:00Z', mood: 5 },
      ];
      const result = calculateMoodStreakCorrelation(fiveWeeksData, 15);
      expect(result.showCorrelation).toBe(true);
      expect(result.correlationScore).toBeDefined();
      expect(result.message).toBeDefined();
    });
  });

  describe('getRecentJournalContext (Opt-In / Opt-Out)', () => {
    it('returns null when journalOptIn is false (Opt-Out strict)', async () => {
      (prisma.onboardingSession.findUnique as any).mockResolvedValue({
        journalOptIn: false,
      });

      const result = await getRecentJournalContext('test-user-id');
      expect(result).toBeNull();
      expect(prisma.moodEntry.findMany).not.toHaveBeenCalled();
    });

    it('returns formatted journal context when journalOptIn is true', async () => {
      (prisma.onboardingSession.findUnique as any).mockResolvedValue({
        journalOptIn: true,
      });
      (prisma.moodEntry.findMany as any).mockResolvedValue([
        { date: new Date('2026-07-20'), moodType: 'happy', note: 'Excellente séance' },
      ]);

      const result = await getRecentJournalContext('test-user-id');
      expect(result).not.toBeNull();
      expect(result).toContain('happy');
      expect(result).toContain('Excellente séance');
    });
  });
});
