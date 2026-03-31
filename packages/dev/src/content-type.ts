import { typeByExtension } from "@std/media-types";

export function getContentType(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();
  if (!ext) return "application/octet-stream";
  return typeByExtension(ext) ?? "application/octet-stream";
}
