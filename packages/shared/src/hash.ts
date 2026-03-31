/**
 * File hashing utilities.
 *
 * @module
 */

import { createHash } from "node:crypto";

export async function hashFile(filePath: string): Promise<string> {
  const file = await Deno.open(filePath, { read: true });
  const hash = createHash("sha256");
  const buffer = new Uint8Array(64 * 1024);

  try {
    while (true) {
      const bytesRead = await file.read(buffer);
      if (bytesRead === null) break;
      hash.update(buffer.subarray(0, bytesRead));
    }
    return hash.digest("hex");
  } finally {
    file.close();
  }
}
