import { describe, expect, it } from 'vitest';

import { decodeBase64, pcm16ToAudioBuffer } from './audio';

/** Minimal stand-in for the parts of AudioContext this helper uses. */
function createFakeContext(): { context: BaseAudioContext; channels: Float32Array[] } {
  const channels: Float32Array[] = [];
  const context = {
    createBuffer(channelCount: number, length: number) {
      const data: Float32Array[] = [];
      for (let index = 0; index < channelCount; index += 1) {
        data.push(new Float32Array(length));
      }
      channels.push(...data);
      return {
        length,
        getChannelData: (index: number) => data[index] as Float32Array,
      };
    },
  } as unknown as BaseAudioContext;
  return { context, channels };
}

describe('decodeBase64', () => {
  it('decodes a base64 string back into bytes', () => {
    expect(Array.from(decodeBase64('aGVsbG8='))).toEqual([104, 101, 108, 108, 111]);
  });
});

describe('pcm16ToAudioBuffer', () => {
  it('converts little endian 16 bit samples into normalised floats', () => {
    const { context, channels } = createFakeContext();
    const samples = new Int16Array([0, 32767, -32768, 16384]);
    const bytes = new Uint8Array(samples.buffer);

    pcm16ToAudioBuffer(bytes, context, 24000, 1);

    expect(channels[0]?.length).toBe(4);
    expect(channels[0]?.[0]).toBe(0);
    expect(channels[0]?.[1]).toBeCloseTo(32767 / 32768, 5);
    expect(channels[0]?.[2]).toBeCloseTo(-1, 5);
    expect(channels[0]?.[3]).toBeCloseTo(0.5, 5);
  });

  it('splits interleaved stereo samples per channel', () => {
    const { context, channels } = createFakeContext();
    const samples = new Int16Array([1000, 2000, 3000, 4000]);
    const bytes = new Uint8Array(samples.buffer);

    pcm16ToAudioBuffer(bytes, context, 24000, 2);

    expect(channels[0]?.length).toBe(2);
    expect(channels[0]?.[0]).toBeCloseTo(1000 / 32768, 5);
    expect(channels[1]?.[0]).toBeCloseTo(2000 / 32768, 5);
    expect(channels[0]?.[1]).toBeCloseTo(3000 / 32768, 5);
    expect(channels[1]?.[1]).toBeCloseTo(4000 / 32768, 5);
  });

  it('reads the samples from the correct offset of a view', () => {
    const { context, channels } = createFakeContext();
    const backing = new Int16Array([0, 0, 1000, 2000]);
    const view = new Uint8Array(backing.buffer, 4, 4);

    pcm16ToAudioBuffer(view, context, 24000, 1);

    expect(channels[0]?.[0]).toBeCloseTo(1000 / 32768, 5);
    expect(channels[0]?.[1]).toBeCloseTo(2000 / 32768, 5);
  });
});
