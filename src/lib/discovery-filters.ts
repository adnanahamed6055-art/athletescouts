export const QUICK_SPORTS = ["Football", "Cricket", "Basketball", "Athletics"] as const;
export const AGE_GROUPS = [
  { id: "any", label: "Any age" },
  { id: "u14", label: "U14", max: 13 },
  { id: "u16", label: "U16", max: 15 },
  { id: "u19", label: "U19", max: 18 },
  { id: "u21", label: "U21", max: 20 },
  { id: "senior", label: "21+", min: 21 },
];
export function matchesAge(age: number | null | undefined, bracket: string) {
  const group = AGE_GROUPS.find((g) => g.id === bracket);
  if (!group || group.id === "any") return true;
  if (age == null) return false;
  return (!("max" in group) || age <= group.max) && (!("min" in group) || age >= group.min);
}
export function matchesVerification(verified: boolean, only: boolean) { return !only || verified; }
