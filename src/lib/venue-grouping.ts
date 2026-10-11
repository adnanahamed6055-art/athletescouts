import { categorize, type Venue } from "@/data/venues";
import { osmPhoto, osmCommons, osmFacilityType } from "@/lib/venue-image";

export type OsmEl = { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };

const GENERIC = /^(the )?(football|soccer|cricket|tennis|basketball|padel|volleyball|netball|squash|badminton|multi[- ]?sport|sports?|training|practice|futsal|rugby|hockey|swimming|kids)?\s*(pitch|pitches|court|courts|field|fields|ground|grounds|area|pool|hall|gym|track|station|centre|center|facility|playground|club)?s?\s*\d*$/i;
const SUB_SUFFIX = /\s*[-–—,:]?\s*(\b(main|outdoor|indoor|ladies|men'?s|women'?s|kids|junior|training|practice|football|soccer|cricket|tennis|basketball|padel|volleyball|squash|swimming|fitness|multi[- ]?sport)\b\s*)*(pitch|pitches|court|courts|field|fields|ground|grounds|area|pool|hall|gym|track|station)\s*(\d+|[a-z])?\s*$/i;

const isGeneric = (n: string | undefined) => !n || !n.trim() || GENERIC.test(n.trim());
export const normalizeName = (n: string) =>
  n.toLowerCase().replace(SUB_SUFFIX, "").replace(/[^a-z0-9\u0600-\u06ff ]+/g, " ").replace(/\s+/g, " ").trim();

const pretty = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Human facility label for one OSM element, e.g. "Football pitch", "Swimming pool". */
export function facilityLabel(tags: Record<string, string>): string {
  const sport = (tags["sport"] ?? "").split(";")[0]?.trim();
  const sp = sport ? pretty(sport) + " " : "";
  const l = tags["leisure"], b = tags["building"], a = tags["amenity"];
  if (l === "pitch") return `${sp}pitch`.trim().replace(/^Pitch$/, "Sports pitch");
  if (l === "swimming_pool" || sport === "swimming") return "Swimming pool";
  if (l === "fitness_station") return "Outdoor fitness station";
  if (l === "fitness_centre" || a === "gym" || sport === "fitness") return "Gym";
  if (l === "track") return `${sp}track`.trim();
  if (b === "sports_hall") return sport ? `${pretty(sport)} hall` : "Sports hall";
  if (l === "stadium") return "Stadium";
  if (sport) return `${pretty(sport)} training`;
  if (l === "sports_centre" || b === "sports_centre") return "Sports centre";
  return "Training area";
}

const SUB_LEISURE = new Set(["pitch", "track", "swimming_pool", "fitness_station"]);
const PARENT_RANK = (t: Record<string, string>) =>
  t["club"] === "sport" || t["leisure"] === "sports_centre" || t["leisure"] === "stadium" ? 3
  : t["leisure"] === "fitness_centre" || t["amenity"] === "gym" || t["building"] === "sports_centre" ? 2 : 1;

type Raw = { el: OsmEl; tags: Record<string, string>; lat: number; lng: number; name?: string | undefined; sub: boolean; facility: string };

const distM = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const k = 111320, dx = (a.lng - b.lng) * k * Math.cos((a.lat * Math.PI) / 180), dy = (a.lat - b.lat) * k;
  return Math.hypot(dx, dy);
};

/** Groups Overpass elements so each club / sports centre appears once, with its pitches, courts, pools etc. as `facilities`. */
export function groupVenues(elements: OsmEl[], attachRadiusM = 450): Venue[] {
  const seen = new Set<string>();
  const raws: Raw[] = [];
  for (const el of elements) {
    const key = `${el.type}-${el.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const lat = el.lat ?? el.center?.lat, lng = el.lon ?? el.center?.lon;
    if (typeof lat !== "number" || typeof lng !== "number" || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const tags = el.tags ?? {};
    const own = tags["name:en"] ?? tags["name"];
    const name = !isGeneric(own) ? own!.trim() : !isGeneric(tags["operator"]) ? tags["operator"]!.trim() : !isGeneric(tags["brand"]) ? tags["brand"]!.trim() : undefined;
    const sub = SUB_LEISURE.has(tags["leisure"] ?? "") || tags["building"] === "sports_hall" || !name;
    raws.push({ el, tags, lat, lng, name, sub, facility: facilityLabel(tags) });
  }

  // 1. Parents: named elements, merged by normalized name (best-ranked element supplies location & details).
  const groups = new Map<string, Raw[]>();
  for (const r of raws) {
    if (!r.name) continue;
    const k = normalizeName(r.name);
    if (!k) continue;
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  // A named sub-feature only becomes its own venue if it isn't just "<parent> pitch"-style and there's no parent nearby.
  const parents: { key: string; primary: Raw; members: Raw[] }[] = [];
  for (const [key, members] of groups) {
    const primary = [...members].sort((a, b) => Number(a.sub) - Number(b.sub) || PARENT_RANK(b.tags) - PARENT_RANK(a.tags))[0]!;
    parents.push({ key, primary, members });
  }
  const standalone = parents.filter((p) => !p.members.every((m) => m.sub));
  const subOnly = parents.filter((p) => p.members.every((m) => m.sub));

  const nearestParent = (r: Raw) => {
    let best: (typeof standalone)[number] | undefined, bestD = attachRadiusM;
    for (const p of standalone) { const d = distM(r, p.primary); if (d <= bestD) { bestD = d; best = p; } }
    return best;
  };
  // 2. Named-but-sub-only groups attach to a nearby parent; otherwise they stand alone under their (non-generic) name.
  for (const p of subOnly) {
    const parent = nearestParent(p.primary);
    if (parent) parent.members.push(...p.members); else standalone.push(p);
  }
  // 3. Unnamed / generic elements attach to the nearest parent; orphans stay as their own venue (never dropped).
  for (const r of raws) if (!r.name) {
    const p = nearestParent(r);
    if (p) p.members.push(r);
    else standalone.push({ key: `${r.el.type}-${r.el.id}`, primary: { ...r, name: (r.tags["name:en"] ?? r.tags["name"])?.trim() || r.facility.replace(/^./, (c) => c.toUpperCase()) }, members: [r] });
  }

  return standalone.map(({ primary, members }) => {
    const t = primary.tags;
    const allTags = members.map((m) => m.tags);
    const sportsSet = new Set<string>();
    let category = categorize(t).category;
    for (const tg of allTags) for (const s of categorize(tg).sports) sportsSet.add(s);
    if (sportsSet.size === 0) category = categorize(t).category;
    const facilities = [...new Set(members.filter((m) => m !== primary || members.length === 1).map((m) => m.facility))];
    const pick = (k: string) => allTags.map((x) => x[k]).find(Boolean);
    const street = [t["addr:housenumber"], t["addr:street"]].filter(Boolean).join(" ");
    const address = [street, t["addr:suburb"] ?? pick("addr:suburb"), t["addr:city"] ?? pick("addr:city")].filter(Boolean).join(", ") || `${primary.lat.toFixed(4)}, ${primary.lng.toFixed(4)}`;
    return {
      id: `osm-${primary.el.type}-${primary.el.id}`,
      name: primary.name!, category, sports: [...sportsSet], lat: primary.lat, lng: primary.lng, address,
      phone: t["phone"] ?? t["contact:phone"] ?? pick("phone") ?? pick("contact:phone"),
      website: t["website"] ?? t["contact:website"] ?? pick("website") ?? pick("contact:website"),
      hours: t["opening_hours"] ?? pick("opening_hours"),
      facilities,
      photo: osmPhoto(t) ?? allTags.map(osmPhoto).find(Boolean),
      commons: osmCommons(t) ?? allTags.map(osmCommons).find(Boolean),
      facilityType: osmFacilityType(t),
      searchText: [...new Set(allTags.flatMap((x) => ["name", "name:en", "name:ar", "brand", "operator", "sport", "leisure", "amenity", "club", "shop", "addr:street", "addr:city", "addr:suburb"].map((k) => x[k]).filter(Boolean)))].join(" ").replace(/_/g, " ").toLowerCase(),
      score: (t["name"] ? 1 : 0) + (pick("brand") || pick("operator") ? 1 : 0) + (pick("website") || pick("contact:website") ? 1 : 0) + (pick("opening_hours") ? 1 : 0) + (pick("phone") || pick("contact:phone") ? 1 : 0) + (allTags.some((x) => osmPhoto(x) || osmCommons(x)) ? 1 : 0) + (sportsSet.size > 1 ? 1 : 0),
      source: "osm" as const,
    };
  });
}
