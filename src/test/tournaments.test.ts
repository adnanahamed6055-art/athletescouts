import { describe, expect, it } from "vitest";
import { canManageOpportunity, validRegistrationUrl } from "@/lib/tournaments";
import { DEMO_PEOPLE, DEMO_CLUBS, DEMO_TOURNAMENTS } from "@/data/demo";

describe("tournaments", () => {
  it("only the event owner can manage it", () => {
    expect(canManageOpportunity("club-a", "club-a")).toBe(true);
    expect(canManageOpportunity("club-b", "club-a")).toBe(false);
    expect(canManageOpportunity("club-a", null)).toBe(false);
  });
  it("accepts https registration links and rejects unsafe links", () => {
    expect(validRegistrationUrl("https://club.example/register?event=7")).toBe(true);
    expect(validRegistrationUrl("javascript:alert(1)")).toBe(false);
    expect(validRegistrationUrl("http://club.example/register")).toBe(false);
    expect(validRegistrationUrl("")).toBe(true);
  });
  it("provides 25 original entries per category plus six student athletes", () => {
    for (const kind of ["athlete", "coach", "scout"]) {
      expect(DEMO_PEOPLE.filter((p) => p.kind === kind)).toHaveLength(kind === "athlete" ? 31 : 25);
    }
    expect(DEMO_CLUBS).toHaveLength(25);
    expect(DEMO_TOURNAMENTS).toHaveLength(25);
  });
});
import { APPLICATION_STATUSES, isApplicationStatus } from "@/lib/tournaments";
describe("application statuses", () => {
  it("organisers can only pick submitted, shortlisted, accepted or declined", () => {
    expect([...APPLICATION_STATUSES]).toEqual(["submitted", "shortlisted", "accepted", "declined"]);
    expect(isApplicationStatus("approved")).toBe(false);
  });
});
