import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import {
  Crosshair, LocateFixed, Loader2, MapPin, Search, Navigation, Phone, Share2, LayoutGrid,
  Map as MapIcon, Clock, Radar, Globe, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/sonner";
import {
  ABU_DHABI, CATEGORY_IMAGE, CATEGORY_LABEL, FALLBACK_VENUES, FILTERS, type Category, type Venue,
} from "@/data/venues";
import { formatKm, haversineKm, type LatLng } from "@/lib/geo";
import { VenueImage } from "@/components/VenueImage";
import { fetchVenues, lastPartial, type Area } from "@/lib/overpass";
import { fetchDirectoryVenues } from "@/lib/venue-directory";
import { normalizeName } from "@/lib/venue-grouping";
import type { Bounds } from "@/components/ClubMap";
import { PageFrame } from "@/components/PageFrame";

const ClubMap = lazy(() => import("@/components/ClubMap"));

export const Route = createFileRoute("/clubs")({
  head: () => ({
    meta: [
      { title: "AthleteScouts — Scout Your Next Training Ground" },
      { name: "description", content: "Find real gyms, dojos, pitches and sports clubs across the UAE, sorted by distance from you." },
      { property: "og:title", content: "AthleteScouts — Scout Your Next Training Ground" },
      { property: "og:description", content: "Live map of training clubs, gyms and academies across the UAE, nearest first." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <PageFrame><Index /></PageFrame>,
});

// Radius slider: 5 km steps from 5 to 50 km.
const RADIUS_MIN = 5, RADIUS_MAX = 50, RADIUS_STEP = 5, RADIUS_DEFAULT = 10;
type Item = Venue & { distance: number };
type Suggestion = { label: string; lat: number; lng: number };
const QUICK = [
  { label: "Abu Dhabi", ...ABU_DHABI },
  { label: "Baniyas / Al Shamkha", lat: 24.3498, lng: 54.6857 },
  { label: "Dubai Marina", lat: 25.0805, lng: 55.1403 },
  { label: "Downtown Dubai", lat: 25.1972, lng: 55.2744 },
  { label: "Sharjah", lat: 25.3463, lng: 55.4209 },
  { label: "Al Ain", lat: 24.2075, lng: 55.7447 },
];
const dirUrl = (v: { lat: number; lng: number }) => `https://www.google.com/maps/dir/?api=1&destination=${v.lat},${v.lng}`;

// Google Maps refuses to load inside frames (e.g. the editor preview), so always
// break out into a real tab/window instead of letting the link load in place.
function openDirections(e: MouseEvent, v: { lat: number; lng: number }) {
  e.preventDefault();
  e.stopPropagation();
  const url = dirUrl(v);
  // Note: passing "noopener" as a feature makes window.open return null even on
  // success, so open plainly and detach the opener afterwards.
  const win = window.open(url, "_blank");
  if (win) { try { win.opener = null; } catch { /* ignore */ } return; }
  const framed = window.self !== window.top;
  if (!framed) { window.location.href = url; return; }
  // Inside a frame Google refuses to load, so never navigate in place.
  void navigator.clipboard?.writeText(url).catch(() => {});
  toast.error("Your browser blocked the new tab", {
    description: "Directions link copied — paste it in a new tab, or open this site in its own tab.",
  });
}
const CACHE_KEY = "as-osm-cache-v3"; // bumped: older caches lack facility/photo data

function Index() {
  const [loc, setLoc] = useState<LatLng>(ABU_DHABI);
  const [locLabel, setLocLabel] = useState("Abu Dhabi");
  const [detecting, setDetecting] = useState(false);
  const [cityQuery, setCityQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSug, setShowSug] = useState(false);
  const [category, setCategory] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");
  const [radiusKm, setRadiusKm] = useState(RADIUS_DEFAULT); // 10 km default
  const radiusM = radiusKm * 1000;
  const radiusRef = useRef(radiusM);
  radiusRef.current = radiusM;
  const [view, setView] = useState<"grid" | "map">("grid");
  const [selected, setSelected] = useState<Item | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [live, setLive] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);
  const [fitKey, setFitKey] = useState("init");
  const abort = useRef<AbortController | null>(null);

  const load = useCallback(async (area: Area) => {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setLoading(true);
    try {
      const v = await fetchVenues(area, ctrl.signal);
      setLive(v);
      if (lastPartial) toast.warning("Some map results didn't load — showing what we found.");
      setOffline(false);
      setFitKey(String(Date.now()));
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(v.slice(0, 1500))); } catch { /* full */ }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      console.error(e);
      setOffline(true);
      toast.error("Live map data is slow right now — showing saved UAE venues.");
    } finally {
      if (abort.current === ctrl) setLoading(false);
    }
  }, []);

  const applyLocation = useCallback((next: LatLng, label: string) => {
    setLoc(next);
    setFocusId(null);
    setLocLabel(label);
    void load({ kind: "around", lat: next.lat, lng: next.lng, radiusM: radiusRef.current });
  }, [load]);

  const detect = useCallback((silent = false) => {
    if (!("geolocation" in navigator)) { if (!silent) toast.error("Geolocation isn't supported in this browser."); return; }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setDetecting(false);
        applyLocation({ lat: p.coords.latitude, lng: p.coords.longitude }, "Your location");
        if (!silent) toast.success("Location locked in");
      },
      (err) => {
        setDetecting(false);
        if (!silent) toast.error(err.code === err.PERMISSION_DENIED ? "Location permission denied — pick an area instead." : "Couldn't detect location — pick an area instead.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [applyLocation]);

  // Startup: show saved results instantly, load Abu Dhabi, then try GPS.
  useEffect(() => {
    try { const c = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "[]") as Venue[]; if (c.length) setLive(c); } catch { /* ignore */ }
    void load({ kind: "around", ...ABU_DHABI, radiusM: radiusRef.current });
    detect(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Radius change re-queries Overpass around the current location.
  const firstRadius = useRef(true);
  useEffect(() => {
    if (firstRadius.current) { firstRadius.current = false; return; }
    const t = setTimeout(() => void load({ kind: "around", lat: loc.lat, lng: loc.lng, radiusM }), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radiusM]);

  // Free place search (OpenStreetMap Nominatim), debounced
  useEffect(() => {
    const q = cityQuery.trim();
    if (q.length < 3) { setSuggestions([]); return; }
    let stale = false;
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=6&countrycodes=ae&q=${encodeURIComponent(q)}`, { headers: { Accept: "application/json" } });
        const j = (await r.json()) as Array<{ display_name: string; lat: string; lon: string }>;
        if (!stale) setSuggestions(j.map((x) => ({ label: x.display_name, lat: +x.lat, lng: +x.lon })));
      } catch (e) { console.error(e); }
    }, 600);
    return () => { stale = true; clearTimeout(t); };
  }, [cityQuery]);

  const pick = (s: Suggestion) => {
    setShowSug(false);
    setSuggestions([]);
    setCityQuery(s.label.split(",")[0] ?? s.label);
    applyLocation({ lat: s.lat, lng: s.lng }, s.label.split(",").slice(0, 2).join(","));
  };

  const [directory, setDirectory] = useState<Venue[]>([]);
  useEffect(() => { void fetchDirectoryVenues().then(setDirectory); }, []);

  const all = useMemo<Item[]>(() => {
    // Directory venues are always listed; every live OSM venue shows too. A venue is
    // only skipped when it is genuinely the SAME place as one already listed —
    // same name within ~550 m (OSM often maps a club and its grounds separately),
    // or within ~90 m regardless of name. Different venues are never hidden.
    const samePlace = (a: Venue, b: Venue) => {
      const dLat = Math.abs(a.lat - b.lat), dLng = Math.abs(a.lng - b.lng);
      if (dLat < 0.0008 && dLng < 0.0008) return true;
      if (normalizeName(a.name) !== normalizeName(b.name)) return false;
      // Directory pins are approximate, so a matching live venue counts as the same
      // place within ~2 km; two live venues must be much closer (~550 m).
      const near = a.source === "local" || b.source === "local" ? 0.02 : 0.005;
      return dLat < near && dLng < near;
    };
    const merged: Venue[] = (directory.length ? directory : FALLBACK_VENUES).slice();
    for (const v of live) {
      if (!merged.some((m) => samePlace(m, v))) merged.push(v);
    }
    return merged.map((v) => ({ ...v, distance: haversineKm(loc, v) }));
  }, [live, loc, directory]);

  const results = useMemo(() => {
    const radius = radiusKm;
    const q = query.trim().toLowerCase();
    return all
      .filter((v) => category === "all" || v.category === category)
      .filter((v) => v.distance <= radius)
      .filter((v) => !q || v.name.toLowerCase().includes(q) || v.sports.some((s) => s.toLowerCase().includes(q)) || v.address.toLowerCase().includes(q) || (v.searchText ?? "").includes(q))
      .sort((a, b) => Math.abs(a.distance - b.distance) < 0.05 ? (b.score ?? 0) - (a.score ?? 0) : a.distance - b.distance);
  }, [all, category, radiusKm, query]);

  const onSearchArea = (b: Bounds) => { setFocusId(null); setLocLabel("Map area"); void load({ kind: "bbox", ...b }); };

  return (
    <div className="min-h-screen bg-background">
      <Toaster />

      <section className="relative overflow-hidden border-b border-border bg-grid">
        <div className="absolute -top-40 left-1/2 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-4 py-20 text-center">
          <Badge variant="outline" className="mb-6 border-primary/40 text-primary"><Radar className="mr-1 h-3 w-3" /> {results.length} venues scouted near {locLabel}</Badge>
          <h1 className="font-display text-5xl font-extrabold uppercase leading-none md:text-7xl">Scout Your Next <span className="text-gradient-neon">Training Ground</span></h1>
          <p className="mx-auto mt-5 max-w-xl text-muted-foreground">Gyms, dojos, pitches, courts and pools — live from OpenStreetMap, ranked by how close they are to you.</p>

          <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-border bg-card p-3 shadow-glow">
            <div className="flex flex-col gap-3 md:flex-row">
              <Button size="lg" onClick={() => detect(false)} disabled={detecting} className="font-semibold">
                {detecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                {detecting ? "Detecting…" : "Auto-Detect Location"}
              </Button>
              <div className="relative flex-1 text-left">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={cityQuery} onChange={(e) => { setCityQuery(e.target.value); setShowSug(true); }}
                  onFocus={() => setShowSug(true)} onBlur={() => setTimeout(() => setShowSug(false), 150)}
                  onKeyDown={(e) => { const f = suggestions[0]; if (e.key === "Enter" && f) pick(f); }}
                  placeholder="Type a street, landmark or neighborhood…" className="h-10 pl-9" autoComplete="off" />
                {showSug && suggestions.length > 0 && (
                  <ul className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border bg-card shadow-glow">
                    {suggestions.map((s) => (
                      <li key={`${s.lat},${s.lng}`}>
                        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(s)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-secondary">
                          <MapPin className="h-4 w-4 shrink-0 text-primary" /><span className="truncate">{s.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
              <div className="flex flex-wrap gap-2">
                {QUICK.map((p) => (
                  <button key={p.label} onClick={() => applyLocation(p, p.label)} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition hover:border-primary hover:text-primary">{p.label}</button>
                ))}
              </div>
              <Badge className="gap-1.5 bg-primary/15 text-primary hover:bg-primary/15">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" /> {locLabel} · {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
              </Badge>
            </div>
          </div>
        </div>
      </section>

      <section id="categories" className="sticky top-16 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map((c) => (
              <button key={c.id} onClick={() => setCategory(c.id)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${category === c.id ? "border-primary bg-primary text-primary-foreground shadow-glow" : "border-border text-muted-foreground hover:border-primary/60 hover:text-foreground"}`}>
                {c.label}
              </button>
            ))}
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_260px_auto] md:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Club name, sport or area…" className="pl-9" />
            </div>
            <div className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-xs text-muted-foreground">Radius <b className="text-foreground">{radiusKm} km</b></span>
              <Slider min={RADIUS_MIN} max={RADIUS_MAX} step={RADIUS_STEP} value={[radiusKm]} onValueChange={(v) => setRadiusKm(v[0] ?? RADIUS_DEFAULT)} />
            </div>
            <Tabs value={view} onValueChange={(v) => setView(v as "grid" | "map")}>
              <TabsList>
                <TabsTrigger value="grid"><LayoutGrid className="mr-1 h-4 w-4" />List</TabsTrigger>
                <TabsTrigger value="map"><MapIcon className="mr-1 h-4 w-4" />Map</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </section>

      <main id="explore" className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{results.length}</span> spots near {locLabel}, nearest first
            {loading && <span className="ml-2 inline-flex items-center gap-1 text-primary"><Loader2 className="h-3 w-3 animate-spin" />scanning live map…</span>}
            {offline && !loading && <span className="ml-2 text-destructive">· offline — showing saved venues</span>}
          </p>
          <Button size="sm" variant="outline" disabled={loading} onClick={() => applyLocation(loc, locLabel)}><RefreshCw className="h-4 w-4" />Refresh</Button>
        </div>

        {view === "map" ? (
          <ClientOnly fallback={<div className="h-[600px] rounded-xl border border-border" />}>
            <Suspense fallback={<div className="grid h-[600px] place-items-center rounded-xl border border-border"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
              <ClubMap center={loc} items={results} fitKey={`${fitKey}|${category}`} onSelect={setSelected} focusId={focusId} onSearchArea={onSearchArea} />
            </Suspense>
          </ClientOnly>
        ) : results.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-16 text-center text-muted-foreground">
            {loading ? "Scanning the map…" : "No venues found — widen the radius or clear filters."}
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((v) => <VenueCard key={v.id} v={v} onFocus={() => { setFocusId(v.id); setView("map"); }} onOpen={() => setSelected(v)} />)}
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © 2026 AthleteScouts · Map data © OpenStreetMap contributors · Train closer. Train harder.
      </footer>

      <VenueDialog v={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function VenueCard({ v, onOpen, onFocus }: { v: Item; onOpen: () => void; onFocus: () => void }) {
  return (
    <article onClick={onFocus} title="Show on map" className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-card transition duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-glow">
      <div className="relative aspect-[16/10] overflow-hidden">
        <VenueImage v={v} showCredit loading="lazy" width={1024} height={656} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent" />
        <Badge className="absolute left-3 top-3 bg-background/80 text-foreground backdrop-blur hover:bg-background/80">{CATEGORY_LABEL[v.category]}</Badge>
        <Badge className="absolute right-3 top-3 gap-1 bg-primary text-primary-foreground hover:bg-primary"><Navigation className="h-3 w-3" />{formatKm(v.distance)}</Badge>
      </div>
      <div className="space-y-3 p-5">
        <h3 className="font-display text-2xl font-bold uppercase leading-tight">{v.name}</h3>
        <p className="text-sm text-accent">{v.sports.slice(0, 5).join(" · ")}</p>
        <p className="flex items-start gap-1 text-sm text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{v.address}</p>
        {v.source === "local" && <Badge variant="outline" className="border-primary/40 text-primary">UAE staple</Badge>}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button variant="outline" asChild onClick={(e) => e.stopPropagation()}>
            <a href={dirUrl(v)} target="_blank" rel="noreferrer"><Navigation className="h-4 w-4" />Get Directions</a>
          </Button>
          <Button onClick={(e) => { e.stopPropagation(); onOpen(); }}>View Details</Button>
        </div>
      </div>
    </article>
  );
}

function VenueDialog({ v, onClose }: { v: Item | null; onClose: () => void }) {
  const share = async () => {
    if (!v) return;
    const text = `${v.name} — ${v.sports.join(", ")}`;
    if (navigator.share) { try { await navigator.share({ title: v.name, text, url: dirUrl(v) }); } catch { /* dismissed */ } }
    else { await navigator.clipboard.writeText(`${text} ${dirUrl(v)}`); toast.success("Link copied"); }
  };
  return (
    <Dialog open={!!v} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0">
        {v && (
          <>
            <div className="relative aspect-[16/7]">
              <VenueImage v={v} showCredit className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background" />
            </div>
            <div className="space-y-5 px-6 pb-6">
              <DialogHeader>
                <DialogTitle className="font-display text-3xl font-extrabold uppercase">{v.name}</DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-3">
                  <Badge variant="secondary">{CATEGORY_LABEL[v.category]}</Badge>
                  <span className="flex items-center gap-1"><Navigation className="h-4 w-4" />{formatKm(v.distance)}</span>
                </DialogDescription>
              </DialogHeader>
              <p className="flex items-start gap-1 text-sm text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{v.address}</p>
              <div className="flex flex-wrap gap-2">{v.sports.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}</div>
              {v.facilities && v.facilities.length > 0 && (
                <div>
                  <h4 className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">Facilities</h4>
                  <ul className="grid gap-1.5 text-sm sm:grid-cols-2">{v.facilities.map((f) => <li key={f} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" />{f}</li>)}</ul>
                </div>
              )}
              {v.hours && <p className="flex items-start gap-1 text-sm"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{v.hours}</p>}
              <Button asChild size="lg" className="w-full font-semibold"><a href={dirUrl(v)} target="_blank" rel="noreferrer"><Navigation className="h-4 w-4" />Get Directions</a></Button>
              <div className="grid grid-cols-3 gap-2">
                {v.phone ? <Button variant="secondary" asChild><a href={`tel:${v.phone.replace(/\s/g, "")}`}><Phone className="h-4 w-4" />Call</a></Button> : <Button variant="secondary" disabled><Phone className="h-4 w-4" />No phone</Button>}
                {v.website ? <Button variant="secondary" asChild><a href={v.website} target="_blank" rel="noreferrer"><Globe className="h-4 w-4" />Website</a></Button> : <Button variant="secondary" disabled><Globe className="h-4 w-4" />No website</Button>}
                <Button variant="outline" onClick={share}><Share2 className="h-4 w-4" />Share</Button>
              </div>
              <p className="text-[11px] text-muted-foreground">{v.source === "osm" ? "Data © OpenStreetMap contributors." : "Featured UAE venue — location approximate."}</p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
