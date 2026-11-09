/** Encodes raw bytes as base64. */
export function bytesToBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  let binary = '';
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

/** Reads a Blob as a base64 string (without the `data:` prefix). */
export async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  return bytesToBase64(new Uint8Array(buffer));
}

export function isSupportedImage(file: File): boolean {
  return file.type.startsWith('image/');
}

/** Guard against uploading a source image that is too large for the API. */
export const MAX_SOURCE_IMAGE_BYTES = 10 * 1024 * 1024;

export function isImageWithinSizeLimit(file: File): boolean {
  return file.size <= MAX_SOURCE_IMAGE_BYTES;
}
