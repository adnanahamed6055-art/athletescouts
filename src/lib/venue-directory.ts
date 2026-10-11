import { supabase } from "@/integrations/supabase/client";
import type { Category, Venue } from "@/data/venues";

/** Curated UAE venues from our own database — instant, free, no outside services. */
export async function fetchDirectoryVenues(): Promise<Venue[]> {
  const { data, error } = await supabase.from("venues").select("*");
  if (error || !data) return [];
  return data.map((r) => ({
    id: `dir-${r.id}`,
    name: r.name,
    category: r.category as Category,
    sports: r.sports,
    lat: r.lat,
    lng: r.lng,
    address: [r.address, r.city].filter(Boolean).join(", "),
    phone: r.phone ?? undefined,
    website: r.website ?? undefined,
    hours: r.hours ?? undefined,
    facilities: r.facilities,
    searchText: `${r.name} ${r.city} ${r.sports.join(" ")}`.toLowerCase(),
    source: "local" as const,
  }));
}
