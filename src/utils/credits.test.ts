import { describe, expect, it } from 'vitest';

import { CREDIT_COST } from '../constants';
import { creditCostFor, videosPerPack } from './credits';

describe('creditCostFor', () => {
  it('matches the price list', () => {
    expect(creditCostFor('720p')).toBe(CREDIT_COST['720p']);
    expect(creditCostFor('1080p')).toBe(CREDIT_COST['1080p']);
  });
});

describe('videosPerPack', () => {
  it('uses the cheapest resolution as the reference', () => {
    expect(videosPerPack(600)).toBe(6);
    expect(videosPerPack(1500)).toBe(15);
  });

  it('rounds down', () => {
    expect(videosPerPack(250)).toBe(2);
  });

  it('can be calculated for a higher resolution', () => {
    expect(videosPerPack(1500, '1080p')).toBe(10);
  });
});
