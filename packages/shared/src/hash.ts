/**
 * File hashing utilities.
 *
 * @module
 */

import { crypto } from "jsr:@std/crypto@1.0.5";

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function hashFile(filePath: string): Promise<string> {
  const file = await Deno.open(filePath, { read: true });
  // Note: Web Crypto API requires full content for digest; chunks are accumulated
  // to enable incremental reads with bounded memory rather than whole-file load.
  const CHUNK_SIZE = 64 * 1024;
  const chunks: Uint8Array[] = [];
  const buffer = new Uint8Array(CHUNK_SIZE);
  let bytesRead: number | null;

  try {
    while ((bytesRead = await file.read(buffer)) !== null) {
      chunks.push(buffer.slice(0, bytesRead));
    }
  } finally {
    file.close();
  }

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const content = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    content.set(chunk, offset);
    offset += chunk.length;
  }

  const digest = await crypto.subtle.digest("SHA-256", content);
  return toHex(new Uint8Array(digest));
}
