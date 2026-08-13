import { describe, it, expect, vi } from 'vitest';
import {
  createDefaultICPProfile,
  validateICPProfile,
  calculateICPFitScore,
  createEmptyGtmStrategy,
  calculateStrategyCompleteness,
  calculateLeadScore,
  calculateICEScore,
  canTransitionHypothesisStatus,
  GrowthHypothesisService,
  LeadScoringService,
  CampaignWorkflowService,
  GtmStrategyService,
  ICPAnalyzerService,
} from '../index';
import {
  EmailCrmAdapter,
  PrismaGtmRepository,
  PrismaContactRepository,
} from '../infrastructure';

describe('GTM Module - Domain & Application Tests', () => {
  describe('ICP Domain & ICP Analyzer Service', () => {
    it('creates default ICP profile with complete fields', () => {
      const profile = createDefaultICPProfile();
      expect(profile.name).toBe('Solo Founders & Indie Hackers');
      expect(profile.painPoints.length).toBeGreaterThan(0);

      const validation = validateICPProfile(profile);
      expect(validation.isValid).toBe(true);
      expect(validation.score).toBe(100);
    });

    it('detects missing fields in incomplete ICP profile', () => {
      const incomplete = createDefaultICPProfile({ name: '', painPoints: [] });
      const validation = validateICPProfile(incomplete);
      expect(validation.isValid).toBe(false);
      expect(validation.missingFields).toContain('name');
      expect(validation.missingFields).toContain('painPoints');
    });

    it('calculates ICP fit score for prospect alignment', () => {
      const profile = createDefaultICPProfile();
      const fitScore = calculateICPFitScore(profile, {
        role: 'Founder & CEO',
        tags: ['Solo founders'],
      });
      expect(fitScore).toBeGreaterThan(60);
    });

    it('ICPAnalyzerService analyzes profile and evaluates prospect fit', () => {
      const service = new ICPAnalyzerService();
      const report = service.analyzeICPProfile({ name: 'Tech Founders', painPoints: ['Scaling'] });
      expect(report.profile.name).toBe('Tech Founders');
      expect(report.recommendations.length).toBeGreaterThan(0);

      const prospectFit = service.evaluateProspectFit(report.profile, {
        role: 'Founder',
        tags: ['Tech Founders'],
      });
      expect(prospectFit.fitScore).toBeGreaterThanOrEqual(50);
      expect(prospectFit.tier).toBeDefined();
    });
  });

  describe('GTM Strategy Domain & Service', () => {
    it('evaluates completeness score across GTM pillars', () => {
      const emptyStrategy = createEmptyGtmStrategy();
      let completeness = calculateStrategyCompleteness(emptyStrategy);
      expect(completeness.score).toBe(0);

      const fullStrategy = createEmptyGtmStrategy({
        ompTarget: 'Solo founders',
        oaAlternatives: 'Spreadsheets',
        sbHero: 'Unified dashboard',
        sbProblem: 'Siloed tools',
        ompMedia: 'LinkedIn',
        owCadence: 'Weekly',
        csAtomicNetwork: 'Indie Hackers',
        oaValue: 'Saved 10h/week',
      });
      completeness = calculateStrategyCompleteness(fullStrategy);
      expect(completeness.score).toBe(100);
      expect(completeness.completedPillars).toBe(5);
    });

    it('GtmStrategyService handles strategy initialization and ICP sharpening', () => {
      const service = new GtmStrategyService();
      const strategy = service.getOrInitializeStrategy(null);
      expect(strategy.sbHero).toBe('');

      const sharpened = service.sharpenICP({ name: 'B2B Founders' });
      expect(sharpened.profile.name).toBe('B2B Founders');
      expect(sharpened.validation).toBeDefined();
    });
  });

  describe('Contact & Lead Scoring Domain', () => {
    it('calculates lead score and tier correctly', () => {
      const contact = {
        id: 'c1',
        name: 'Jane Founder',
        status: 'Qualifié' as const,
        dealValue: 6000,
        lastContactDate: new Date().toISOString().split('T')[0],
        email: 'jane@startup.co',
        company: 'Acme Corp',
      };

      const scoreInfo = calculateLeadScore(contact, 4);
      expect(scoreInfo.tier).toBe('hot');
      expect(scoreInfo.score).toBeGreaterThanOrEqual(70);
      expect(scoreInfo.reasons.length).toBeGreaterThan(0);
    });

    it('LeadScoringService scores contact and analyzes pipeline', () => {
      const service = new LeadScoringService();
      const contact = {
        id: 'c2',
        name: 'John Prospect',
        status: 'À contacter' as const,
        lastContactDate: '2026-07-01',
      };

      const scored = service.scoreContact(contact);
      expect(scored.needsFollowUp).toBe(true);

      const summary = service.analyzePipeline([contact]);
      expect(summary.totalContacts).toBe(1);
      expect(summary.byStatus['À contacter']).toBe(1);

      const prompt = service.buildFollowUpPrompt(contact);
      expect(prompt).toContain('John Prospect');
    });
  });

  describe('Growth Hypothesis Domain & Service', () => {
    it('calculates ICE score and priority tier', () => {
      const iceResult = calculateICEScore(8, 9, 7);
      expect(iceResult.iceScore).toBe(8.0);
      expect(iceResult.priorityTier).toBe('P1');
    });

    it('validates state transitions', () => {
      expect(canTransitionHypothesisStatus('draft', 'testing')).toBe(true);
      expect(canTransitionHypothesisStatus('testing', 'validated')).toBe(true);
      expect(canTransitionHypothesisStatus('validated', 'draft')).toBe(false);
    });

    it('handles hypothesis lifecycle, pivoting, and metrics via service', () => {
      const service = new GrowthHypothesisService();
      const hyp = service.createHypothesis({
        statement: 'Test LinkedIn Ads for founder acquisition',
        category: 'channel',
        riskLevel: 'high',
        testMethod: 'Run $100 test campaign',
        successCriteria: '10 signups',
      });

      expect(hyp.status).toBe('draft');

      const testingHyp = service.transitionStatus(hyp, 'testing');
      expect(testingHyp.status).toBe('testing');

      const pivotResult = service.pivotHypothesis(testingHyp, 'Test Reddit Ads instead', 'Run $100 Reddit test');
      expect(pivotResult.original.status).toBe('pivoted');
      expect(pivotResult.pivoted.statement).toBe('Test Reddit Ads instead');
      expect(pivotResult.pivoted.pivotedFromId).toBe(hyp.id);

      const metrics = service.calculateMetrics([testingHyp, pivotResult.pivoted]);
      expect(metrics.total).toBe(2);

      const sorted = service.sortByPriority([hyp]);
      expect(sorted.length).toBe(1);
    });
  });

  describe('Campaign Workflow & Infrastructure Adapters', () => {
    it('generates campaign sequences and content ideas', () => {
      const workflowService = new CampaignWorkflowService();
      const sequence = workflowService.generateCampaignSequence('LinkedIn', 'B2B Founders');
      expect(sequence.length).toBe(4);

      const contentIdeas = workflowService.suggestContentIdeas('LinkedIn', 'B2B Founders');
      expect(contentIdeas.length).toBe(3);
    });

    it('parses and exports contacts via CSV adapter', () => {
      const adapter = new EmailCrmAdapter();
      const csv = `Name,Email,Company,Status\nJohn Doe,john@test.com,TestCo,À contacter`;
      const result = adapter.parseContactsCSV(csv);

      expect(result.importedCount).toBe(1);
      expect(result.contacts[0].name).toBe('John Doe');

      const exported = adapter.exportContactsCSV([{
        id: 'c1',
        name: 'Jane Doe',
        email: 'jane@test.com',
        status: 'Client',
        lastContactDate: '2026-07-29',
      }]);
      expect(exported).toContain('Jane Doe');
      expect(exported).toContain('jane@test.com');

      const mailto = adapter.createMailtoLink({ id: 'c1', name: 'Jane Doe', email: 'jane@test.com', status: 'Client', lastContactDate: '2026-07-29' });
      expect(mailto).toContain('mailto:jane@test.com');
    });

    it('instantiates repositories correctly', () => {
      const gtmRepo = new PrismaGtmRepository();
      const contactRepo = new PrismaContactRepository();
      expect(gtmRepo).toBeDefined();
      expect(contactRepo).toBeDefined();
    });
  });
});
