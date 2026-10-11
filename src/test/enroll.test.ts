import { describe, expect, it } from "vitest";
import { enrollSchema } from "@/components/app/EnrollButton";
describe("enrollment form", () => {
  it("accepts a note up to 600 characters", () => { expect(enrollSchema.safeParse({ position: "", message: "a".repeat(600) }).success).toBe(true); });
  it("rejects notes over 600 characters", () => { expect(enrollSchema.safeParse({ position: "", message: "a".repeat(601) }).success).toBe(false); });
  it("rejects positions over 80 characters", () => { expect(enrollSchema.safeParse({ position: "a".repeat(81), message: "" }).success).toBe(false); });
});
