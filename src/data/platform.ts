import type { Database } from "@/integrations/supabase/types";

export type AccountRole = Exclude<Database["public"]["Enums"]["app_role"], "admin">;

export const ROLES: { id: AccountRole; label: string; blurb: string; emoji: string }[] = [
  { id: "athlete", label: "Athlete / Student", blurb: "Showcase verified stats and get direct lines to trials, tournaments and scholarships.", emoji: "🏃" },
  { id: "coach", label: "Coach / School Admin", blurb: "Build long-term athletic records and sign off on stats with verified portal keys.", emoji: "📋" },
  { id: "club_manager", label: "Club / Academy Manager", blurb: "Broadcast tryouts and role vacancies to a pool of qualified UAE youth athletes.", emoji: "🏟️" },
  { id: "scout", label: "Scout / Recruiter", blurb: "Replace unverified social reels with structured data sorted by athletic parameters.", emoji: "🔭" },
];

export const SPORTS = ["Football", "Cricket", "Basketball", "Athletics", "Swimming", "Volleyball", "Tennis", "Padel", "Rugby", "Handball", "Martial Arts", "Other"];

export const GCC_REGIONS = ["UAE — Abu Dhabi", "UAE — Dubai", "UAE — Sharjah & Northern Emirates", "UAE — Al Ain", "Saudi Arabia", "Qatar", "Kuwait", "Bahrain", "Oman", "GCC-wide"];

export const METRICS: { id: string; label: string; unit: string; lowerIsBetter?: boolean }[] = [
  { id: "sprint_40m", label: "40m Sprint", unit: "s", lowerIsBetter: true },
  { id: "vertical_jump", label: "Vertical Jump", unit: "cm" },
  { id: "beep_test", label: "Beep Test Level", unit: "lvl" },
  { id: "top_speed", label: "Top Speed", unit: "km/h" },
  { id: "matches_played", label: "Matches Played", unit: "" },
  { id: "goals_points", label: "Goals / Points", unit: "" },
];

/** Turns a YouTube/Vimeo link into an embeddable URL, or null if unsupported. */
export function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (host === "youtube.com") {
      if (u.pathname.startsWith("/shorts/")) return `https://www.youtube.com/embed/${u.pathname.split("/")[2]}`;
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "vimeo.com") return `https://player.vimeo.com/video/${u.pathname.slice(1)}`;
    return null;
  } catch {
    return null;
  }
}

export function ageFrom(dob: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob), n = new Date();
  let a = n.getFullYear() - d.getFullYear();
  if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--;
  return a;
}
