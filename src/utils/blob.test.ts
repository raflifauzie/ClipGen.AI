import { describe, expect, it } from 'vitest';

import { bytesToBase64, isImageWithinSizeLimit, isSupportedImage } from './blob';

describe('bytesToBase64', () => {
  it('encodes plain bytes', () => {
    expect(bytesToBase64(new Uint8Array([104, 101, 108, 108, 111]))).toBe('aGVsbG8=');
  });

  it('encodes an empty buffer', () => {
    expect(bytesToBase64(new Uint8Array())).toBe('');
  });

  it('encodes binary data without losing bytes', () => {
    const bytes = new Uint8Array(256);
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = index;
    }
    const encoded = bytesToBase64(bytes);
    const decoded = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
    expect(Array.from(decoded)).toEqual(Array.from(bytes));
  });
});

describe('isSupportedImage', () => {
  it('accepts image files', () => {
    expect(isSupportedImage(new File([], 'a.png', { type: 'image/png' }))).toBe(true);
  });

  it('rejects other files', () => {
    expect(isSupportedImage(new File([], 'a.txt', { type: 'text/plain' }))).toBe(false);
  });
});

describe('isImageWithinSizeLimit', () => {
  it('accepts a small file', () => {
    expect(isImageWithinSizeLimit(new File([], 'a.png', { type: 'image/png' }))).toBe(true);
  });
});
