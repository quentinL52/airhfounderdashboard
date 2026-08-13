/**
 * Domain module for GTM Strategy types and framework models.
 * Modular Monolith Architecture - GTM Module (Domain Layer)
 */

export interface HeroMessagingFramework {
  sbHero: string;      // Hook / Value prop
  sbProblem: string;   // Core problem resolved
  sbGuide: string;     // Authority & credibility
}

export interface PositioningFramework {
  oaAlternatives: string;      // Current competitive alternatives
  oaUniqueAttributes: string;  // Differentiating capabilities
  oaValue: string;             // Delivered business value
}

export interface TargetChannelsPlan {
  ompTarget: string;   // ICP Target segment
  ompMessage: string;  // Value proposition message
  ompMedia: string;    // Preferred distribution channels
}

export interface AtomicNetworkFramework {
  csAtomicNetwork: string; // Initial dense user group / atomic network
}

export interface ContentStrategy {
  owCadence: string;   // Publication cadence and channels
}

export interface GoToMarketStrategy {
  // Hero Messaging
  sbHero: string;
  sbProblem: string;
  sbGuide: string;
  
  // Positioning & ICP
  oaAlternatives: string;
  oaUniqueAttributes: string;
  oaValue: string;
  
  // Target & Channels
  ompTarget: string;
  ompMessage: string;
  ompMedia: string;
  
  // Atomic Network
  csAtomicNetwork: string;
  
  // Content Cadence
  owCadence: string;
}

export interface StrategyCompleteness {
  score: number; // 0 - 100
  completedPillars: number; // 0 - 5
  totalPillars: number;
  pillarDetails: {
    positioning: boolean;
    messaging: boolean;
    channels: boolean;
    launch: boolean;
    measure: boolean;
  };
}

/**
 * Creates an empty or partial GTM Strategy with default structure.
 */
export function createEmptyGtmStrategy(partial?: Partial<GoToMarketStrategy>): GoToMarketStrategy {
  return {
    sbHero: partial?.sbHero || '',
    sbProblem: partial?.sbProblem || '',
    sbGuide: partial?.sbGuide || '',
    oaAlternatives: partial?.oaAlternatives || '',
    oaUniqueAttributes: partial?.oaUniqueAttributes || '',
    oaValue: partial?.oaValue || '',
    ompTarget: partial?.ompTarget || '',
    ompMessage: partial?.ompMessage || '',
    ompMedia: partial?.ompMedia || '',
    csAtomicNetwork: partial?.csAtomicNetwork || '',
    owCadence: partial?.owCadence || '',
  };
}

/**
 * Evaluates the completeness score of a GoToMarketStrategy across its 5 core pillars.
 */
export function calculateStrategyCompleteness(strategy: Partial<GoToMarketStrategy>): StrategyCompleteness {
  const positioning = Boolean(strategy.ompTarget && strategy.oaAlternatives);
  const messaging = Boolean(strategy.sbHero && strategy.sbProblem);
  const channels = Boolean(strategy.ompMedia && strategy.owCadence);
  const launch = Boolean(strategy.csAtomicNetwork || strategy.ompMessage);
  const measure = Boolean(strategy.oaValue || strategy.sbGuide);

  const pillars = [positioning, messaging, channels, launch, measure];
  const completedPillars = pillars.filter(Boolean).length;
  const score = Math.round((completedPillars / pillars.length) * 100);

  return {
    score,
    completedPillars,
    totalPillars: 5,
    pillarDetails: {
      positioning,
      messaging,
      channels,
      launch,
      measure,
    },
  };
}
