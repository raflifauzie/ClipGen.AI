import { CREDIT_COST } from '../constants';
import type { Resolution } from '../types';

/** Credits consumed by one generated video at the given resolution. */
export function creditCostFor(resolution: Resolution): number {
  return CREDIT_COST[resolution];
}

/**
 * How many videos a credit pack buys. Uses the cheapest resolution as the
 * reference so the estimate matches the price list instead of a magic number.
 */
export function videosPerPack(credits: number, resolution: Resolution = '720p'): number {
  return Math.floor(credits / creditCostFor(resolution));
}
