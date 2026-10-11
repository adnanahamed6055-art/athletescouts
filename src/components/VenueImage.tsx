import { useState, type ImgHTMLAttributes } from "react";
import { useVenueImage } from "@/lib/venue-image";
import type { Venue } from "@/data/venues";

type Props = { v: Venue; showCredit?: boolean } & Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt">;

/** Venue photo with automatic category fallback (never shows a broken image) and licence credit when required. */
export function VenueImage({ v, showCredit = false, ...rest }: Props) {
  const img = useVenueImage(v);
  const [failed, setFailed] = useState<string | null>(null);
  const broken = failed === img.src;
  return (
    <>
      <img {...rest} src={broken ? img.fallback : img.src} alt={img.alt} onError={() => { if (!broken) setFailed(img.src); }} />
      {showCredit && img.credit && !broken && (
        <a href={img.credit.href} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
          className="absolute bottom-1 right-1 z-10 max-w-[90%] truncate rounded bg-media-overlay px-1.5 py-0.5 text-[9px] text-media-foreground">
          Photo: {img.credit.text}
        </a>
      )}
    </>
  );
}
