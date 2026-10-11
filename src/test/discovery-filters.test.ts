import { describe, expect, it } from "vitest";
import { matchesAge, matchesVerification, QUICK_SPORTS } from "../lib/discovery-filters";
import { DEMO_PEOPLE } from "../data/demo";

describe("Scout discovery rules", () => {
  it("never describes a coach as a scout", () => { const coaches = DEMO_PEOPLE.filter((p) => p.kind === "coach"); expect(coaches.every((p) => p.headline.toLowerCase().includes("coach") && !p.headline.toLowerCase().includes("scout"))).toBe(true); });
  it("keeps portraits distinct within each profession", () => { for (const kind of ["athlete", "coach", "scout"]) { const people = DEMO_PEOPLE.filter((p) => p.kind === kind); expect(new Set(people.map((p) => p.image)).size).toBe(people.length); } });
  it("provides Football, Cricket, Basketball and Athletics", () => { expect(QUICK_SPORTS).toEqual(["Football", "Cricket", "Basketball", "Athletics"]); });
  it("U14 excludes athletes aged 14", () => { expect(matchesAge(13, "u14")).toBe(true); expect(matchesAge(14, "u14")).toBe(false); });
  it("U16 excludes athletes aged 16", () => { expect(matchesAge(15, "u16")).toBe(true); expect(matchesAge(16, "u16")).toBe(false); });
  it("U19 excludes athletes aged 19", () => { expect(matchesAge(18, "u19")).toBe(true); expect(matchesAge(19, "u19")).toBe(false); });
  it("age filters exclude missing ages", () => { expect(matchesAge(null, "u14")).toBe(false); expect(matchesAge(null, "any")).toBe(true); });
  it("verified-only excludes unverified profiles", () => { expect(matchesVerification(false, true)).toBe(false); expect(matchesVerification(true, true)).toBe(true); expect(matchesVerification(false, false)).toBe(true); });
  it("includes three ADIS verified school showcases in the requested positions", () => {
    const students = DEMO_PEOPLE.filter((p) => ["d-adis-striker", "d-adis-bowler", "d-adis-point-guard"].includes(p.id));
    expect(students).toHaveLength(3);
    expect(students.map((p) => [p.sport, p.position])).toEqual([["Football", "Striker"], ["Cricket", "Fast bowler"], ["Basketball", "Point guard"]]);
    expect(students.every((p) => p.verified && p.location === "Abu Dhabi" && (p.stats?.length ?? 0) === 4)).toBe(true);
    expect(new Set(students.map((p) => p.image)).size).toBe(3);
  });
  it("adds athletics, swimming and badminton students with appropriate metrics", () => {
    const students = DEMO_PEOPLE.filter((p) => ["d-adis-sprinter", "d-adis-swimmer", "d-adis-badminton"].includes(p.id));
    expect(students.map((p) => [p.sport, p.age])).toEqual([["Athletics", 16], ["Swimming", 15], ["Badminton", 13]]);
    expect(students.every((p) => p.kind === "athlete" && p.verifiedSchool === "Abu Dhabi Indian School" && p.location === "Abu Dhabi" && p.stats?.length === 4)).toBe(true);
    expect(students[0]?.stats?.[0]).toEqual({ label: "100m personal best", value: "13.24 s" });
    expect(students[1]?.stats?.[0]).toEqual({ label: "50m freestyle best", value: "28.42 s" });
    expect(students[2]?.stats?.[0]).toEqual({ label: "Singles wins", value: "11 / 16" });
  });
});
