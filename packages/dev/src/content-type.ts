import { typeByExtension } from "@std/media-types";

/**
 * Gets the MIME content type for a file based on its extension.
 */
export function getContentType(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();
  if (!ext) return "application/octet-stream";
  return typeByExtension(ext) ?? "application/octet-stream";
}
