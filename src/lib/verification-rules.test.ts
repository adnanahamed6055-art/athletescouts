import { describe, expect, it } from "vitest";
import { athleteCompletion, checkDocMeta, sniffDocType, statusLabel, PLACEHOLDER, MAX_DOC_BYTES } from "./verification-rules";

describe("verification rules", () => {
  it("only an approved request reads as verified", () => {
    expect(statusLabel("submitted", "school")).toBe("Verification submitted");
    expect(statusLabel("under_review", "school")).toBe("Under review");
    expect(statusLabel(null)).toBe("Not verified");
    expect(statusLabel("approved", "school")).toBe("Verified by School");
    expect(statusLabel("approved", "academy")).toBe("Verified by Academy / Club");
  });
  it("allows at most 2 documents", () => {
    const f = { name: "id.jpg", size: 1000, type: "image/jpeg" };
    expect(checkDocMeta([f, f])).toBeNull();
    expect(checkDocMeta([f, f, f])).toMatch(/up to 2/);
  });
  it("rejects files over 10 MB", () => {
    expect(checkDocMeta([{ name: "id.pdf", size: MAX_DOC_BYTES + 1, type: "application/pdf" }])).toMatch(/10 MB/);
    expect(checkDocMeta([{ name: "id.pdf", size: MAX_DOC_BYTES, type: "application/pdf" }])).toBeNull();
  });
  it("rejects other file types", () => {
    expect(checkDocMeta([{ name: "id.gif", size: 10, type: "image/gif" }])).toMatch(/only JPG/);
  });
  it("detects real file types from content, not the name", () => {
    expect(sniffDocType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffDocType(new TextEncoder().encode("%PDF-1.7"))).toBe("application/pdf");
    expect(sniffDocType(new TextEncoder().encode("<html>evil"))).toBeNull();
  });
  it("profile placeholders match the brief", () => {
    expect(PLACEHOLDER.name).toBe("Complete your profile");
    expect(PLACEHOLDER.location).toBe("Abu Dhabi, UAE");
  });
  it("a new account is incomplete until all 8 fields are filled", () => {
    expect(athleteCompletion({}).complete).toBe(false);
    expect(athleteCompletion({ avatar_url: "a", full_name: "b", dob: "2010-01-01", location: "Dubai", sport: "Football", position: "ST", school: "ADIS", bio: "x" }).complete).toBe(true);
  });
});
