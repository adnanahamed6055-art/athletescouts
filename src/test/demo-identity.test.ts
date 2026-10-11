import { describe, expect, it } from "vitest";
import { DEMO_PEOPLE, demoIdentityIssues } from "@/data/demo";

describe("showcase athlete identity", () => {
  it("has no incomplete athlete records or orphaned posts", () => {
    expect(demoIdentityIssues()).toEqual([]);
  });
  it("Dev Mehta is a cricketer with his own portrait", () => {
    const dev = DEMO_PEOPLE.find((p) => p.name === "Dev Mehta");
    expect(dev?.sport).toBe("Cricket");
    expect(dev?.image).toContain("portrait-dev-mehta");
  });
});
