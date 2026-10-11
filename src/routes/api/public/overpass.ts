import { createFileRoute } from "@tanstack/react-router";

// Free Overpass mirrors; called server-side so browser CORS blocks don't matter.
const MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

export const Route = createFileRoute("/api/public/overpass")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const form = new URLSearchParams(await request.text());
        const data = form.get("data") ?? "";
        // Only read-only JSON venue queries of reasonable size are forwarded.
        if (!data.startsWith("[out:json]") || data.length > 4000) return new Response("Bad query", { status: 400 });
        const start = Math.abs(Number(form.get("start") ?? 0) || 0) % MIRRORS.length;
        const order = MIRRORS.map((_, k) => MIRRORS[(start + k) % MIRRORS.length]!);
        // Race all mirrors in parallel; first valid JSON wins.
        const attempt = async (url: string) => {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "AthleteScouts/1.0 (venue finder)", Accept: "application/json" },
            body: new URLSearchParams({ data }),
            signal: AbortSignal.timeout(20000),
          });
          const text = await res.text();
          if (!res.ok || !text.trimStart().startsWith("{")) throw new Error(`mirror ${res.status}`);
          return text;
        };
        try {
          const text = await Promise.any(order.map(attempt));
          return new Response(text, { headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=300" } });
        } catch {
          // All mirrors busy: answer with an empty result + remark so the client falls back gracefully (no 5xx).
          return Response.json({ elements: [], remark: "Overpass unavailable" }, { headers: { "Cache-Control": "no-store" } });
        }
      },
    },
  },
});
