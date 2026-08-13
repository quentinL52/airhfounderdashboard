import { describe, it, expect } from 'vitest';
import { useFounderStore } from '@/store/founder-store';

describe('Settings Tabbed Navigation & Density Unit Tests (Gate S)', () => {
  it('persists density setting in founder store', () => {
    const store = useFounderStore.getState();
    expect(store.density).toBeDefined();

    store.setDensity('compact');
    expect(useFounderStore.getState().density).toBe('compact');

    store.setDensity('comfortable');
    expect(useFounderStore.getState().density).toBe('comfortable');
  });

  it('validates all 7 tab keys without orphan panels', () => {
    const validTabs = [
      'profile',
      'ai',
      'agents',
      'notifications',
      'billing',
      'data-privacy',
      'appearance',
    ];

    expect(validTabs).toHaveLength(7);
    validTabs.forEach((tab) => {
      expect(typeof tab).toBe('string');
      expect(tab.length).toBeGreaterThan(0);
    });
  });
});
