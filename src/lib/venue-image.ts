import { useEffect, useState } from "react";
import { CATEGORY_IMAGE, type Venue } from "@/data/venues";
import tennis from "@/assets/venue-tennis.jpg";
import padel from "@/assets/venue-padel.jpg";
import boxing from "@/assets/venue-boxing.jpg";
import fitnessStation from "@/assets/venue-fitness-station.jpg";
import sportsHall from "@/assets/venue-sports-hall.jpg";
import sportsCentre from "@/assets/venue-sports-centre.jpg";
import sportsClub from "@/assets/venue-sports-club.jpg";
import football from "@/assets/demo-football.jpg";
import cricket from "@/assets/demo-cricket.jpg";
import basketball from "@/assets/demo-basketball.jpg";
import bjj from "@/assets/demo-bjj.jpg";
import gym2 from "@/assets/venue-gym-2.jpg";

const CLUB_IMG = Object.fromEntries(Object.entries(import.meta.glob<{ default: string }>("@/assets/club-*.jpg", { eager: true })).map(([k, m]) => [Number(k.match(/club-(\d+)\.jpg$/)?.[1]), m.default])) as Record<number, string>;
const FB = Object.values(import.meta.glob<{ default: string }>("@/assets/fbvenue-*.jpg", { eager: true })).map((m) => m.default);
const c = (...n: number[]) => n.map((i) => CLUB_IMG[i]).filter((x): x is string => !!x);

export type Img = { src: string; alt: string; credit?: { text: string; href: string } | undefined };
type ImgVenue = Pick<Venue, "sports" | "name"> & Partial<Pick<Venue, "id" | "facilities" | "photo" | "commons" | "facilityType">>;
const GYM_VARIANTS = [CATEGORY_IMAGE.strength, gym2];
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Ordered by prominence: the first matching sport wins. */
const SPORT_RULES: { re: RegExp; img: Img }[] = [
  { re: /football|soccer|stadium|futsal/, img: { src: football, alt: "Football training facility" } },
  { re: /cricket/, img: { src: cricket, alt: "Cricket ground" } },
  { re: /basketball/, img: { src: basketball, alt: "Basketball court" } },
  { re: /padel/, img: { src: padel, alt: "Padel court" } },
  { re: /tennis/, img: { src: tennis, alt: "Tennis court" } },
  { re: /swim|pool|aquatic/, img: { src: CATEGORY_IMAGE.aquatic, alt: "Swimming pool" } },
  { re: /boxing|kickboxing|muay/, img: { src: boxing, alt: "Boxing gym with ring" } },
  { re: /martial|judo|bjj|jiu|karate|taekwondo|mma|dojo|wrestl/, img: { src: bjj, alt: "Martial arts training dojo" } },
];
const TYPE_IMG: Record<string, Img> = {
  fitness_station: { src: fitnessStation, alt: "Outdoor calisthenics equipment" },
  gym: { src: CATEGORY_IMAGE.strength, alt: "Modern gym interior" },
  sports_hall: { src: sportsHall, alt: "Indoor sports hall" },
  sports_centre: { src: sportsCentre, alt: "Multi-sport facility" },
  club: { src: sportsClub, alt: "Sports club grounds" },
};
const TEXT_TYPE: { re: RegExp; type: string }[] = [
  { re: /fitness station|outdoor fitness|calisthenics/, type: "fitness_station" },
  { re: /\bgym\b|fitness|crossfit|weight|strength/, type: "gym" },
  { re: /sports hall|volleyball|badminton|squash/, type: "sports_hall" },
  { re: /sports centre|sports center|complex/, type: "sports_centre" },
  { re: /\bclub\b/, type: "club" },
];

export const DEFAULT_VENUE_IMAGE: Img = TYPE_IMG["sports_centre"]!;

/** Sport-specific image → facility-type image → generic multi-sport image. */
function baseFallbackImage(v: ImgVenue): Img {
  const hay = [...v.sports, ...(v.facilities ?? []), v.name].join(" | ").toLowerCase();
  const sport = SPORT_RULES.find((r) => r.re.test(hay));
  if (sport) return sport.img;
  // Name keywords ("Rak Gym", "Fitness Centre") beat a broad OSM tag like leisure=sports_centre.
  const nameType = TEXT_TYPE.find((r) => r.re.test(v.name.toLowerCase()))?.type;
  const type = nameType === "gym" || nameType === "fitness_station" ? nameType : v.facilityType ?? nameType ?? TEXT_TYPE.find((r) => r.re.test(hay))?.type;
  if (type === "gym") return { src: GYM_VARIANTS[hash(v.id ?? v.name) % GYM_VARIANTS.length]!, alt: "Modern gym interior" };
  return (type && TYPE_IMG[type]) || DEFAULT_VENUE_IMAGE;
}

/** Sport-matched picture, varied per venue so neighbouring cards don't repeat the same photo. */
export function venueFallbackImage(v: ImgVenue): Img {
  const base = baseFallbackImage(v);
  if (base === DEFAULT_VENUE_IMAGE) return base;
  const pools: [string, string[]][] = [
    [football, [football, ...c(1, 2, 15, 16, 20, 21), ...FB]],
    [cricket, [cricket, ...c(8)]],
    [basketball, [basketball, ...c(9, 3)]],
    [tennis, [tennis, ...c(6)]],
    [padel, [padel, ...c(5)]],
    [boxing, [boxing, ...c(11)]],
    [bjj, [bjj, ...c(10)]],
    [sportsHall, [sportsHall, ...c(19, 3)]],
    [sportsCentre, [sportsCentre, ...c(18, 17, 19)]],
    [sportsClub, [sportsClub, ...c(18, 2, 16)]],
    [gym2, [gym2, CATEGORY_IMAGE.strength, ...c(12)]],
    [CATEGORY_IMAGE.strength, [gym2, CATEGORY_IMAGE.strength, ...c(12)]],
  ];
  const pool = pools.find(([k]) => k === base.src)?.[1];
  if (!pool || pool.length < 2) return base;
  return { ...base, src: pool[hash(v.id ?? v.name) % pool.length]! };
}

/** OSM `image` tag → direct image URL (only https links to image files). */
export function osmPhoto(tags: Record<string, string>): string | undefined {
  const i = tags["image"]?.trim();
  return i && /^https:\/\/[^\s]+\.(jpe?g|png|webp|gif)(\?[^\s]*)?$/i.test(i) ? i : undefined;
}
/** OSM `wikimedia_commons` tag → "File:…" title (categories are ignored). */
export function osmCommons(tags: Record<string, string>): string | undefined {
  const c = tags["wikimedia_commons"]?.trim();
  return c && /^File:.+\.(jpe?g|png|webp|gif|tiff?)$/i.test(c) ? c : undefined;
}
export function osmFacilityType(t: Record<string, string>): string | undefined {
  if (t["leisure"] === "fitness_station") return "fitness_station";
  if (t["leisure"] === "fitness_centre" || t["amenity"] === "gym") return "gym";
  if (t["building"] === "sports_hall") return "sports_hall";
  if (t["leisure"] === "sports_centre" || t["building"] === "sports_centre") return "sports_centre";
  if (t["club"] === "sport") return "club";
  return undefined;
}

const strip = (html = "") => html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
const commonsCache = new Map<string, Promise<Img | null>>();

/** Resolve a Commons file via the Wikimedia API (free, CORS-enabled) with author + licence attribution. Cached per file. */
export function resolveCommons(file: string): Promise<Img | null> {
  let p = commonsCache.get(file);
  if (!p) {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=800&titles=${encodeURIComponent(file)}`;
    p = fetch(url).then((r) => (r.ok ? r.json() : null)).then((j) => {
      const page = j && Object.values((j as { query?: { pages?: Record<string, unknown> } }).query?.pages ?? {})[0] as { imageinfo?: { thumburl?: string; url?: string; descriptionurl?: string; extmetadata?: Record<string, { value?: string }> }[] } | undefined;
      const info = page?.imageinfo?.[0];
      const src = info?.thumburl ?? info?.url;
      if (!src) return null;
      const m = info?.extmetadata ?? {};
      const artist = strip(m["Artist"]?.value) || "Unknown author";
      const licence = strip(m["LicenseShortName"]?.value) || "see licence";
      return { src, alt: strip(m["ImageDescription"]?.value).slice(0, 120) || file.slice(5), credit: { text: `${artist} · ${licence} · Wikimedia Commons`, href: info?.descriptionurl ?? `https://commons.wikimedia.org/wiki/${encodeURIComponent(file)}` } };
    }).catch(() => null);
    commonsCache.set(file, p);
  }
  return p;
}

/** Image for a venue: OSM image → Wikimedia Commons → sport image → facility-type/generic image. `fallback` is used on load errors. */
export function useVenueImage(v: ImgVenue): Img & { fallback: string } {
  const fb = venueFallbackImage(v);
  const [commons, setCommons] = useState<Img | null>(null);
  useEffect(() => {
    setCommons(null);
    if (v.photo || !v.commons) return;
    let live = true;
    void resolveCommons(v.commons).then((r) => { if (live) setCommons(r); });
    return () => { live = false; };
  }, [v.photo, v.commons]);
  if (v.photo) return { src: v.photo, alt: `${v.name} venue photo`, fallback: fb.src };
  if (commons) return { ...commons, alt: commons.alt || `${v.name} venue photo`, fallback: fb.src };
  return { ...fb, fallback: fb.src };
}
