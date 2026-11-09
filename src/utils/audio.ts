/** Decodes a base64 string into raw bytes. */
export function decodeBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Converts raw little-endian 16 bit PCM into an AudioBuffer.
 *
 * The previous implementation used `new Int16Array(data.buffer)`, which silently
 * breaks when the underlying buffer is a view with a byte offset, and it relied on
 * the host endianness. A DataView makes both explicit.
 */
export function pcm16ToAudioBuffer(
  data: Uint8Array,
  context: BaseAudioContext,
  sampleRate: number,
  channelCount: number,
): AudioBuffer {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const frameCount = Math.floor(data.byteLength / (2 * channelCount));
  const buffer = context.createBuffer(channelCount, frameCount, sampleRate);

  for (let channel = 0; channel < channelCount; channel += 1) {
    const channelData = buffer.getChannelData(channel);
    for (let frame = 0; frame < frameCount; frame += 1) {
      const offset = (frame * channelCount + channel) * 2;
      channelData[frame] = view.getInt16(offset, true) / 32768;
    }
  }
  return buffer;
}
