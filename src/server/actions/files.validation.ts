const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/csv",
  "text/plain",
  "application/zip",
]);

export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

export function maxUploadBytes(maxUploadSizeMb: string | undefined): number {
  const mb = Number(maxUploadSizeMb || "20");
  return mb * 1024 * 1024;
}

export function exceedsMaxUploadSize(
  sizeBytes: number,
  maxUploadSizeMb: string | undefined,
): boolean {
  return sizeBytes > maxUploadBytes(maxUploadSizeMb);
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-140);
}
