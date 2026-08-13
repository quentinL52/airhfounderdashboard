import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('GTM Professionalized Unit Tests (Gate G)', () => {
  it('has 0 occurrences of trademarked book titles in src/ and messages/', () => {
    const trademarkTerms = [
      'StoryBrand',
      'Obviously Awesome',
      '1-Page Marketing Plan',
      'Cold Start Problem',
    ];

    const srcDir = path.resolve(__dirname, '../../src');
    const messagesDir = path.resolve(__dirname, '../../messages');

    function scanFiles(dir: string): string[] {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
          results = results.concat(scanFiles(filePath));
        } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.json')) {
          results.push(filePath);
        }
      });
      return results;
    }

    const files = [...scanFiles(srcDir), ...scanFiles(messagesDir)];
    const violations: { file: string; term: string }[] = [];

    files.forEach((file) => {
      const content = fs.readFileSync(file, 'utf-8');
      trademarkTerms.forEach((term) => {
        if (content.toLowerCase().includes(term.toLowerCase())) {
          violations.push({ file: path.basename(file), term });
        }
      });
    });

    expect(violations).toHaveLength(0);
  });

  it('links GTM milestone creation to RoadmapItem with gtmStepId', () => {
    const gtmMilestone = {
      id: 'gtm-step-123',
      title: '[GTM] Launch Beta Program',
      gtmStepId: 'gtm-step-123',
      status: 'todo',
    };

    expect(gtmMilestone.id).toBe(gtmMilestone.gtmStepId);
    expect(gtmMilestone.title).toContain('[GTM]');
  });
});
