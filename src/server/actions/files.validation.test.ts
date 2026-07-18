import { describe, expect, it } from "vitest";
import { exceedsMaxUploadSize, isAllowedMimeType, sanitizeFileName } from "./files.validation";

describe("isAllowedMimeType", () => {
  it("accepts common document and image types", () => {
    expect(isAllowedMimeType("application/pdf")).toBe(true);
    expect(isAllowedMimeType("image/png")).toBe(true);
  });

  it("rejects unlisted or dangerous types", () => {
    expect(isAllowedMimeType("application/x-msdownload")).toBe(false);
    expect(isAllowedMimeType("text/html")).toBe(false);
    expect(isAllowedMimeType("")).toBe(false);
  });
});

describe("exceedsMaxUploadSize", () => {
  it("allows files under the configured limit", () => {
    expect(exceedsMaxUploadSize(5 * 1024 * 1024, "20")).toBe(false);
  });

  it("rejects files over the configured limit", () => {
    expect(exceedsMaxUploadSize(21 * 1024 * 1024, "20")).toBe(true);
  });

  it("falls back to 20MB when unset", () => {
    expect(exceedsMaxUploadSize(19 * 1024 * 1024, undefined)).toBe(false);
    expect(exceedsMaxUploadSize(21 * 1024 * 1024, undefined)).toBe(true);
  });
});

describe("sanitizeFileName", () => {
  it("keeps safe characters untouched", () => {
    expect(sanitizeFileName("relatorio-final_v2.pdf")).toBe("relatorio-final_v2.pdf");
  });

  it("replaces unsafe characters", () => {
    expect(sanitizeFileName("contrato (final)/v2 ó.pdf")).toBe("contrato__final__v2__.pdf");
  });

  it("truncates very long names keeping the tail (extension)", () => {
    const long = `${"a".repeat(200)}.pdf`;
    const result = sanitizeFileName(long);
    expect(result.length).toBe(140);
    expect(result.endsWith(".pdf")).toBe(true);
  });
});
