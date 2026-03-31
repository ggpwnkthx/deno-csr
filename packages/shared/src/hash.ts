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
  const content = await Deno.readFile(filePath);
  const digest = await crypto.subtle.digest("SHA-256", content);
  return toHex(new Uint8Array(digest));
}
