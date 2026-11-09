import { beforeEach, describe, expect, it } from 'vitest';

import { clearStoredApiKey, readStoredApiKey, resolveApiKey, writeStoredApiKey } from './apiKey';

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe('api key storage', () => {
  beforeEach(() => {
    globalThis.sessionStorage = new MemoryStorage() as unknown as Storage;
  });

  it('stores the key for the session', () => {
    writeStoredApiKey('  secret-key  ');
    expect(readStoredApiKey()).toBe('secret-key');
    expect(resolveApiKey()).toBe('secret-key');
  });

  it('forgets the key', () => {
    writeStoredApiKey('secret-key');
    clearStoredApiKey();
    expect(readStoredApiKey()).toBeNull();
  });

  it('ignores an empty key', () => {
    writeStoredApiKey('   ');
    expect(readStoredApiKey()).toBeNull();
  });
});
