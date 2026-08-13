import { metricsAggregationService } from '@/modules/finances/application/metrics-aggregation';

export async function recalculateRunway(userId: string) {
  return metricsAggregationService.recalculateUserRunway(userId);
}
