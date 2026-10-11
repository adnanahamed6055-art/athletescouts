import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CATEGORY_EMOJI, CATEGORY_IMAGE, type Venue } from "@/data/venues";
import { VenueImage } from "@/components/VenueImage";
import { formatKm, type LatLng } from "@/lib/geo";

export type Bounds = { south: number; west: number; north: number; east: number };
type Item = Venue & { distance: number };

const userIcon = L.divIcon({ className: "", html: '<div class="as-me-wrap"><div class="as-me"></div></div>', iconSize: [0, 0] });
const iconCache = new Map<string, L.DivIcon>();
const pin = (emoji: string) => {
  let i = iconCache.get(emoji);
  if (!i) {
    i = L.divIcon({ className: "", html: `<div class="as-neon-pin"><span>${emoji}</span></div>`, iconSize: [38, 46], iconAnchor: [19, 44], popupAnchor: [0, -40] });
    iconCache.set(emoji, i);
  }
  return i;
};

function Fit({ center, items, fitKey }: { center: LatLng; items: Item[]; fitKey: string }) {
  const map = useMap();
  useEffect(() => {
    const pts = items.slice(0, 200).map((c) => [c.lat, c.lng] as [number, number]);
    pts.push([center.lat, center.lng]);
    map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 14 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);
  return null;
}

function Focus({ item, markers }: { item: Item | undefined; markers: React.MutableRefObject<Map<string, L.Marker>> }) {
  const map = useMap();
  useEffect(() => {
    if (!item) return;
    const t = setTimeout(() => { map.setView([item.lat, item.lng], 16); markers.current.get(item.id)?.openPopup(); }, 150);
    return () => clearTimeout(t);
  }, [item, map, markers]);
  return null;
}

function MoveWatcher({ onMove }: { onMove: () => void }) {
  useMapEvents({ dragend: onMove, zoomend: (e) => { if ((e as unknown as { originalEvent?: Event }).originalEvent !== undefined) onMove(); } });
  return null;
}

function AreaButton({ onSearch }: { onSearch: (b: Bounds) => void }) {
  const map = useMap();
  return (
    <button type="button" onClick={() => { const b = map.getBounds(); onSearch({ south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() }); }}
      className="absolute left-1/2 top-4 z-[1000] -translate-x-1/2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-glow">
      🔄 Search this area of the map
    </button>
  );
}

export default function ClubMap({ center, items, fitKey, onSelect, onSearchArea, focusId }: {
  center: LatLng; items: Item[]; fitKey: string; onSelect: (v: Item) => void; focusId?: string | null; onSearchArea: (b: Bounds) => void;
}) {
  const [moved, setMoved] = useState(false);
  const markers = useRef(new Map<string, L.Marker>());
  const focused = useMemo(() => items.find((c) => c.id === focusId), [items, focusId]);
  const shown = useMemo(() => {
    const s = items.slice(0, 400);
    return focused && !s.includes(focused) ? [...s, focused] : s;
  }, [items, focused]);
  return (
    <div className="relative z-0 isolate h-[600px] w-full overflow-hidden rounded-xl border border-border">
      <MapContainer center={[center.lat, center.lng]} zoom={12} className="h-full w-full" style={{ background: "var(--background)" }}>
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} className="as-dark-tiles"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> ' />
        {!focused && <Fit center={center} items={shown} fitKey={fitKey} />}
        <Focus item={focused} markers={markers} />
        <MoveWatcher onMove={() => setMoved(true)} />
        {moved && <AreaButton onSearch={(b) => { setMoved(false); onSearchArea(b); }} />}
        <Marker position={[center.lat, center.lng]} icon={userIcon} zIndexOffset={1000} />
        {shown.map((c) => (
          <Marker key={c.id} ref={(m) => { if (m) markers.current.set(c.id, m); else markers.current.delete(c.id); }} position={[c.lat, c.lng]} icon={pin(CATEGORY_EMOJI[c.category])}>
            <Popup>
              <div className="as-pop">
                <div style={{ position: "relative" }}><VenueImage v={c} showCredit loading="lazy" /></div>
                <div className="as-pop-body">
                  <h4>{c.name}</h4>
                  <p>{c.sports.slice(0, 3).join(" · ")} · {formatKm(c.distance)}</p>
                  {c.facilities && c.facilities.length > 0 && <p>{c.facilities.slice(0, 4).join(" · ")}{c.facilities.length > 4 ? ` +${c.facilities.length - 4}` : ""}</p>}
                  <button type="button" onClick={() => onSelect(c)}>View Details</button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
