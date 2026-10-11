import combat from "@/assets/combat.jpg";
import team from "@/assets/team.jpg";
import racket from "@/assets/racket.jpg";
import strength from "@/assets/strength.jpg";
import aquatic from "@/assets/aquatic.jpg";

export type Category = "strength" | "combat" | "team" | "racket" | "aquatic";

export const FILTERS: { id: Category | "all"; label: string }[] = [
  { id: "all", label: "All Sports" },
  { id: "strength", label: "Gyms & Fitness" },
  { id: "combat", label: "Combat" },
  { id: "team", label: "Football / Team" },
  { id: "racket", label: "Racket" },
];

export const CATEGORY_LABEL: Record<Category, string> = {
  strength: "Gym", combat: "Combat", team: "Ball Sports", racket: "Racket", aquatic: "Aquatic",
};
export const CATEGORY_EMOJI: Record<Category, string> = {
  strength: "🏋️", combat: "🥊", team: "⚽", racket: "🎾", aquatic: "🏊",
};
export const CATEGORY_IMAGE: Record<Category, string> = { combat, team, racket, strength, aquatic };

export type Venue = {
  id: string;
  name: string;
  category: Category;
  sports: string[];
  lat: number;
  lng: number;
  address: string;
  phone?: string | undefined;
  website?: string | undefined;
  hours?: string | undefined;
  /** Pitches, courts, pools, halls etc. belonging to this club. */
  facilities?: string[] | undefined;
  /** Openly licensed photo URL from OSM tags, when available. */
  photo?: string | undefined;
  /** Wikimedia Commons file title (e.g. "File:X.jpg"), resolved lazily with attribution. */
  commons?: string | undefined;
  /** Primary facility type from OSM tags: sports_centre | sports_hall | club | gym | fitness_station. */
  facilityType?: string | undefined;
  /** Lower-cased brand/operator/sport/leisure/amenity/club/address text for local search. */
  searchText?: string | undefined;
  /** Small popularity boost used only to break near-equal distance ties. */
  score?: number | undefined;
  source: "osm" | "local";
};

export const ABU_DHABI = { lat: 24.4539, lng: 54.3773 };

/** Hand-picked UAE staples shown instantly and whenever the live map data is slow or offline. Coordinates are approximate. */
export const FALLBACK_VENUES: Venue[] = [
  { id: "local-baniyas", name: "Baniyas Sports & Cultural Club", category: "team", sports: ["Football", "BJJ", "Padel", "Volleyball", "Gym"], lat: 24.3498, lng: 54.6857, address: "Al Shamkha / Baniyas, Abu Dhabi", source: "local" },
  { id: "local-adrenagy", name: "Adrenagy Fitness", category: "strength", sports: ["Gym", "Group Classes"], lat: 24.4545, lng: 54.3515, address: "Al Bateen, Abu Dhabi", source: "local" },
  { id: "local-ff-adm", name: "Fitness First — Abu Dhabi Mall", category: "strength", sports: ["Gym", "Group Classes"], lat: 24.4960, lng: 54.3833, address: "Abu Dhabi Mall, Tourist Club Area", source: "local" },
  { id: "local-vogue", name: "Vogue Fitness Abu Dhabi", category: "strength", sports: ["CrossFit", "Olympic Lifting"], lat: 24.4467, lng: 54.3417, address: "Al Bateen, Abu Dhabi", source: "local" },
  { id: "local-ufc", name: "UFC Gym Abu Dhabi", category: "combat", sports: ["MMA", "Boxing", "BJJ", "Gym"], lat: 24.4206, lng: 54.5770, address: "Khalifa City, Abu Dhabi", source: "local" },
  { id: "local-palms", name: "Palms Sports BJJ Academy", category: "combat", sports: ["BJJ", "Judo", "Wrestling"], lat: 24.4247, lng: 54.5640, address: "Khalifa City, Abu Dhabi", source: "local" },
  { id: "local-boxing", name: "Abu Dhabi Boxing & Muay Thai Club", category: "combat", sports: ["Boxing", "Muay Thai", "Kickboxing"], lat: 24.4870, lng: 54.3700, address: "Al Khalidiyah, Abu Dhabi", source: "local" },
  { id: "local-jazira", name: "Al Jazira Club", category: "team", sports: ["Football", "Basketball", "Volleyball"], lat: 24.4532, lng: 54.3925, address: "Al Nahyan, Abu Dhabi", source: "local" },
  { id: "local-wahda", name: "Al Wahda Sports Club", category: "team", sports: ["Football", "Basketball", "Handball"], lat: 24.4405, lng: 54.3910, address: "Al Wahda, Abu Dhabi", source: "local" },
  { id: "local-zsc", name: "Zayed Sports City", category: "team", sports: ["Football", "Tennis", "Ice Hockey", "Bowling"], lat: 24.4166, lng: 54.4536, address: "Zayed Sports City, Abu Dhabi", source: "local" },
  { id: "local-adcc", name: "Abu Dhabi Country Club", category: "racket", sports: ["Tennis", "Padel", "Squash", "Swimming"], lat: 24.4600, lng: 54.4060, address: "Al Mushrif, Abu Dhabi", source: "local" },
  { id: "local-hamdan", name: "Hamdan Sports Complex", category: "aquatic", sports: ["Swimming", "Diving"], lat: 25.0464, lng: 55.3189, address: "Al Hebiah, Dubai", source: "local" },
  { id: "local-ff-dxb", name: "Fitness First — Dubai Mall", category: "strength", sports: ["Gym", "Group Classes"], lat: 25.1975, lng: 55.2796, address: "Downtown Dubai", source: "local" },
];

const COMBAT = ["martial_arts", "karate", "judo", "taekwondo", "boxing", "mma", "kickboxing", "muay_thai", "jiu-jitsu", "jiu_jitsu", "bjj", "wrestling", "fencing", "aikido", "kung_fu"];
const TEAM = ["soccer", "football", "basketball", "volleyball", "beachvolleyball", "rugby", "rugby_union", "cricket", "handball", "american_football", "hockey", "field_hockey", "ice_hockey", "baseball", "futsal"];
const RACKET = ["tennis", "padel", "badminton", "squash", "table_tennis", "pickleball"];
const AQUATIC = ["swimming", "athletics", "running", "diving", "water_polo"];

const pretty = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function categorize(tags: Record<string, string>): { category: Category; sports: string[] } {
  const sports = (tags["sport"] ?? "").split(";").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const has = (list: string[]) => sports.some((s) => list.includes(s));
  let category: Category = "strength";
  if (has(COMBAT)) category = "combat";
  else if (has(RACKET)) category = "racket";
  else if (has(TEAM)) category = "team";
  else if (has(AQUATIC)) category = "aquatic";
  else if (tags["leisure"] === "pitch" || tags["leisure"] === "stadium") category = "team";
  const labels = sports.map(pretty);
  if (!labels.length) labels.push(tags["leisure"] === "fitness_centre" ? "Gym" : pretty(tags["leisure"] ?? "Sports"));
  return { category, sports: labels };
}
