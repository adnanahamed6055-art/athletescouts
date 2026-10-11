import type { Venue } from "@/data/venues";
import { groupVenues, type OsmEl as El } from "@/lib/venue-grouping";

const ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];

export type Area =
  | { kind: "around"; lat: number; lng: number; radiusM: number }
  | { kind: "bbox"; south: number; west: number; north: number; east: number };

const filterFor = (area: Area) => area.kind === "around"
  ? `(around:${Math.round(area.radiusM)},${area.lat},${area.lng})` // radiusM is meters (10 km -> around:10000)
  : `(${area.south},${area.west},${area.north},${area.east})`;

/** Three smaller queries (gyms, clubs/centres, sports facilities) avoid timeouts of one huge query. */
const GROUPS: string[][] = [
  ['nwr["leisure"="fitness_centre"]', 'nwr["amenity"="gym"]', 'nwr["leisure"="fitness_station"]'],
  ['nwr["club"="sport"]', 'nwr["leisure"="sports_centre"]', 'nwr["leisure"="sports_hall"]', 'nwr["building"="sports_centre"]', 'nwr["building"="sports_hall"]'],
  ['nwr["sport"]', 'nwr["leisure"="stadium"]', 'nwr["leisure"="pitch"]', 'nwr["building"="stadium"]'],
];
const buildQuery = (area: Area, group: string[]) => `[out:json][timeout:30];(${group.map((g) => g + filterFor(area) + ";").join("")});out center tags;`;

/** Query live sports venues from OpenStreetMap via the free Overpass API (no key). */
// Overpass allows ~2 concurrent requests per visitor; parallel duplicates get 429/504 and the list fell back to saved venues.
// So identical requests share one call, results are cached briefly, and calls run one at a time.
const memo = new Map<string, { at: number; p: Promise<Venue[]> }>();
let queue: Promise<unknown> = Promise.resolve();

export function fetchVenues(area: Area, signal?: AbortSignal): Promise<Venue[]> {
  const key = JSON.stringify(area);
  const hit = memo.get(key);
  if (hit && Date.now() - hit.at < 5 * 60_000) return withAbort(hit.p, signal);
  const p = queue.then(() => runFetch(area)).catch((e) => { memo.delete(key); throw e; });
  queue = p.catch(() => undefined);
  memo.set(key, { at: Date.now(), p });
  return withAbort(p, signal);
}

function withAbort<T>(p: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return p;
  return new Promise<T>((res, rej) => {
    if (signal.aborted) return rej(new DOMException("Aborted", "AbortError"));
    signal.addEventListener("abort", () => rej(new DOMException("Aborted", "AbortError")), { once: true });
    p.then(res, rej);
  });
}

async function fetchGroup(area: Area, group: string[], start: number): Promise<El[]> {
  const body = new URLSearchParams({ data: buildQuery(area, group) });
  let lastErr: unknown;
  // Our own server relay first (no CORS, tries every mirror), then direct mirrors as backup.
  const tries = ["/api/public/overpass", ...ENDPOINTS.map((_, k) => ENDPOINTS[(start + k) % ENDPOINTS.length]!)];
  for (const url of tries) {
    try {
      const b = url.startsWith("/") ? new URLSearchParams({ data: body.get("data")!, start: String(start) }) : body;
      const res = await fetch(url, { method: "POST", body: b, signal: AbortSignal.timeout(url.startsWith("/") ? 60000 : 30000) });
      const text = await res.text();
      if (!res.ok || !text.trimStart().startsWith("{")) throw new Error(`Overpass ${res.status}`);
      const json = JSON.parse(text) as { elements: El[]; remark?: string };
      if (json.remark && json.elements.length === 0) throw new Error(json.remark);
      return json.elements;
    } catch (e) { lastErr = e; }
  }
  throw lastErr ?? new Error("Overpass unavailable");
}

/** Runs the three queries in parallel on different mirrors; keeps whatever succeeds and dedupes by element id. */
async function runFetch(area: Area): Promise<Venue[]> {
  const settled = await Promise.allSettled(GROUPS.map((g, i) => fetchGroup(area, g, i)));
  // Busy mirrors often recover within seconds: retry each failed group up to 3 times
  // with growing waits (1.5s, 4s, 8s), rotating across mirrors each attempt.
  const waits = [1500, 4000, 8000];
  for (let attempt = 0; attempt < waits.length && settled.some((r) => r.status === "rejected"); attempt++) {
    await new Promise((r) => setTimeout(r, waits[attempt]!));
    await Promise.all(settled.map(async (r, i) => {
      if (r.status === "rejected") {
        try { settled[i] = { status: "fulfilled", value: await fetchGroup(area, GROUPS[i]!, i + attempt + 1) }; } catch { /* keep partial */ }
      }
    }));
  }
  const ok = settled.filter((r): r is PromiseFulfilledResult<El[]> => r.status === "fulfilled");
  if (!ok.length) throw (settled[0] as PromiseRejectedResult).reason;
  const byId = new Map<string, El>();
  for (const r of ok) for (const el of r.value) byId.set(`${el.type}-${el.id}`, el);
  const venues = groupVenues([...byId.values()]);
  lastPartial = ok.length < GROUPS.length;
  return venues;
}

/** True when the last search only got some of the three result sets. */
export let lastPartial = false;
