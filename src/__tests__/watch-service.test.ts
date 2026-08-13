import { describe, it, expect } from 'vitest';
import { shouldSendWatchReminder, calculateScanDiff, ScanItem } from '../services/watch.service';

describe('WatchService Unit Tests', () => {
  describe('shouldSendWatchReminder', () => {
    const now = new Date('2026-07-21T12:00:00Z');

    it('returns false if reminders are disabled', () => {
      const result = shouldSendWatchReminder({
        frequency: 'weekly',
        remindersEnabled: false,
        lastRunAt: new Date('2026-07-10T12:00:00Z'),
      }, now);
      expect(result).toBe(false);
    });

    it('returns false if frequency is manual', () => {
      const result = shouldSendWatchReminder({
        frequency: 'manual',
        remindersEnabled: true,
        lastRunAt: new Date('2026-07-10T12:00:00Z'),
      }, now);
      expect(result).toBe(false);
    });

    it('returns true if lastRunAt is null', () => {
      const result = shouldSendWatchReminder({
        frequency: 'weekly',
        remindersEnabled: true,
        lastRunAt: null,
      }, now);
      expect(result).toBe(true);
    });

    it('returns true if lastRunAt is 8 days ago (J-8)', () => {
      const lastRunAt = new Date('2026-07-13T12:00:00Z'); // 8 days prior to 2026-07-21
      const result = shouldSendWatchReminder({
        frequency: 'weekly',
        remindersEnabled: true,
        lastRunAt,
      }, now);
      expect(result).toBe(true);
    });

    it('returns false if lastRunAt is 3 days ago', () => {
      const lastRunAt = new Date('2026-07-18T12:00:00Z'); // 3 days prior to 2026-07-21
      const result = shouldSendWatchReminder({
        frequency: 'weekly',
        remindersEnabled: true,
        lastRunAt,
      }, now);
      expect(result).toBe(false);
    });
  });

  describe('calculateScanDiff', () => {
    it('detects new items, removed items, and unchanged count correctly', () => {
      const previousItems: ScanItem[] = [
        { title: 'Concurrent A - Feature X', url: 'https://comp-a.com/x' },
        { title: 'Concurrent B - Prix', url: 'https://comp-b.com/pricing' },
      ];

      const currentItems: ScanItem[] = [
        { title: 'Concurrent A - Feature X', url: 'https://comp-a.com/x' },
        { title: 'Concurrent C - Lancement', url: 'https://comp-c.com/launch' },
      ];

      const diff = calculateScanDiff(previousItems, currentItems);

      expect(diff.hasChanges).toBe(true);
      expect(diff.unchangedCount).toBe(1);
      expect(diff.newItems).toHaveLength(1);
      expect(diff.newItems[0].title).toBe('Concurrent C - Lancement');
      expect(diff.removedItems).toHaveLength(1);
      expect(diff.removedItems[0].title).toBe('Concurrent B - Prix');
    });

    it('handles empty previous or current items', () => {
      const currentItems: ScanItem[] = [
        { title: 'Signal 1', url: 'https://example.com/1' },
      ];

      const diffFromScratch = calculateScanDiff([], currentItems);
      expect(diffFromScratch.hasChanges).toBe(true);
      expect(diffFromScratch.newItems).toHaveLength(1);
      expect(diffFromScratch.removedItems).toHaveLength(0);
      expect(diffFromScratch.unchangedCount).toBe(0);
    });
  });
});
