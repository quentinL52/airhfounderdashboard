/**
 * Application service for managing and refining GTM Strategy & ICP definitions.
 * Modular Monolith Architecture - GTM Module (Application Layer)
 */

import {
  GoToMarketStrategy,
  createEmptyGtmStrategy,
  calculateStrategyCompleteness,
  StrategyCompleteness,
} from '../domain/strategy';
import {
  ICPProfile,
  createDefaultICPProfile,
  validateICPProfile,
  ICPValidationResult,
} from '../domain/icp';

export class GtmStrategyService {
  /**
   * Initializes or returns complete GTM strategy with defaults for missing values.
   */
  getOrInitializeStrategy(existingStrategy?: Partial<GoToMarketStrategy> | null): GoToMarketStrategy {
    if (!existingStrategy) {
      return createEmptyGtmStrategy();
    }
    return createEmptyGtmStrategy(existingStrategy);
  }

  /**
   * Computes strategy completeness and missing action items.
   */
  evaluateCompleteness(strategy: Partial<GoToMarketStrategy>): StrategyCompleteness {
    return calculateStrategyCompleteness(strategy);
  }

  /**
   * Sharpen ICP settings and validate against target criteria.
   */
  sharpenICP(profile: Partial<ICPProfile>): { profile: ICPProfile; validation: ICPValidationResult } {
    const completeProfile = createDefaultICPProfile(profile);
    const validation = validateICPProfile(completeProfile);
    return {
      profile: completeProfile,
      validation,
    };
  }
}
