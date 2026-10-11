import { describe, expect, it } from "vitest";
import { groupVenues } from "@/lib/venue-grouping";

const club = { type: "way", id: 1, center: { lat: 24.45, lon: 54.38 }, tags: { leisure: "sports_centre", name: "Al Jazira Club", sport: "soccer" } };
describe("venue grouping", () => {
  it("shows a club once with its pitches, pool and gym as facilities", () => {
    const v = groupVenues([
      club,
      { type: "way", id: 2, center: { lat: 24.4505, lon: 54.3805 }, tags: { leisure: "pitch", sport: "soccer", name: "Football Pitch" } },
      { type: "way", id: 3, center: { lat: 24.4502, lon: 54.3801 }, tags: { leisure: "swimming_pool", name: "Al Jazira Club Swimming Pool" } },
      { type: "node", id: 4, lat: 24.4501, lon: 54.3802, tags: { leisure: "fitness_centre", name: "Al Jazira Club Gym" } },
      { type: "way", id: 5, center: { lat: 24.4503, lon: 54.3803 }, tags: { leisure: "pitch", sport: "basketball" } },
    ]);
    expect(v).toHaveLength(1);
    expect(v[0]!.name).toBe("Al Jazira Club");
    expect(v[0]!.facilities).toEqual(expect.arrayContaining(["Soccer pitch", "Swimming pool", "Gym", "Basketball pitch"]));
  });
  it("keeps separate, distinctly named clubs apart", () => {
    const v = groupVenues([club, { type: "node", id: 9, lat: 24.4501, lon: 54.3801, tags: { leisure: "fitness_centre", name: "Fitness First" } }]);
    expect(v.map((x) => x.name).sort()).toEqual(["Al Jazira Club", "Fitness First"]);
  });
  it("keeps unnamed courts with no parent nearby as their own venue", () => {
    expect(groupVenues([{ type: "way", id: 7, center: { lat: 25, lon: 55 }, tags: { leisure: "pitch", sport: "tennis" } }])).toHaveLength(1);
  });
});

import { venueFallbackImage, DEFAULT_VENUE_IMAGE } from "@/lib/venue-image";
describe("venue images", () => {
  it("football beats swimming as the main sport", () => {
    expect(venueFallbackImage({ name: "X", sports: ["Swimming", "Football"] }).alt).toBe("Football training facility");
  });
  it("boxing and padel get their own images", () => {
    expect(venueFallbackImage({ name: "Y", sports: ["Boxing"] }).alt).toBe("Boxing gym with ring");
    expect(venueFallbackImage({ name: "Z", sports: ["Padel"] }).alt).toBe("Padel court");
  });
  it("unknown venues use the multi-sport image", () => {
    expect(venueFallbackImage({ name: "Q", sports: [] })).toBe(DEFAULT_VENUE_IMAGE);
  });
});

import { osmPhoto, osmCommons } from "@/lib/venue-image";
describe("venue image priority", () => {
  it("accepts only direct https image links from the OSM image tag", () => {
    expect(osmPhoto({ image: "https://example.org/a.jpg" })).toBe("https://example.org/a.jpg");
    expect(osmPhoto({ image: "https://example.org/page" })).toBeUndefined();
  });
  it("reads Commons files but ignores categories", () => {
    expect(osmCommons({ wikimedia_commons: "File:Club.jpg" })).toBe("File:Club.jpg");
    expect(osmCommons({ wikimedia_commons: "Category:Clubs" })).toBeUndefined();
  });
  it("gyms, sports halls and generic clubs each get their own picture", () => {
    const gym = venueFallbackImage({ name: "A", sports: [], facilityType: "gym" }).alt;
    const hall = venueFallbackImage({ name: "B", sports: [], facilityType: "sports_hall" }).alt;
    const club = venueFallbackImage({ name: "C", sports: [], facilityType: "club" }).alt;
    expect(new Set([gym, hall, club]).size).toBe(3);
  });
});
