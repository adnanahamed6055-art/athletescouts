import { createFileRoute } from "@tanstack/react-router";
import { handleScoutAI } from "@/lib/ai/scoutai.server";

export const Route = createFileRoute("/api/scoutai")({
  server: { handlers: { POST: ({ request }) => handleScoutAI(request) } },
});
