import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";
import { DEMO_CLUBS, DEMO_PEOPLE, DEMO_TOURNAMENTS } from "@/data/demo";
import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayRunId, withLovableAiGatewayRunIdHeader } from "./run-id";

const MODEL = "openai/gpt-6-astra";

function json(status: number, error: string) {
  return new Response(JSON.stringify({ error }), { status, headers: { "content-type": "application/json" } });
}

export async function handleScoutAI(request: Request): Promise<Response> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json(401, "Please sign in to use ScoutAI.");
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const supabase = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: claims, error: authErr } = await supabase.auth.getClaims(token);
  const userId = claims?.claims?.sub;
  if (authErr || !userId) return json(401, "Your session expired — please sign in again.");

  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return json(500, "ScoutAI is not configured.");

  let body: { messages?: UIMessage[] };
  try { body = await request.json(); } catch { return json(400, "Invalid request."); }
  const messages = Array.isArray(body.messages) ? body.messages.slice(-40) : [];
  const last = messages.at(-1);
  if (!last || last.role !== "user") return json(400, "No message to answer.");

  // Save the user's message first.
  const { error: saveErr } = await supabase.from("scoutai_messages").upsert(
    { user_id: userId, message_id: last.id, role: "user", parts: last.parts as unknown as Json },
    { onConflict: "user_id,message_id" },
  );
  if (saveErr) console.error("scoutai save user msg", saveErr);

  // Context for the assistant.
  const today = new Date().toISOString().slice(0, 10);
  const [{ data: me }, { data: roles }, { data: opps }, { data: athletes }, { data: stats }] = await Promise.all([
    supabase.from("profiles").select("full_name, sport, position, dob, region, location, school, height_cm, weight_kg, org_name").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase.from("opportunities").select("title, org_name, kind, sport, level, location, starts_on, deadline, positions").gte("deadline", today).order("deadline").limit(30),
    supabase.from("profiles").select("id, full_name, sport, position, dob, region, location").not("sport", "is", null).limit(40),
    supabase.from("athlete_stats").select("user_id, metric, value, unit").limit(200),
  ]);
  const role = roles?.[0]?.role ?? "unknown";
  const athleteLines = (athletes ?? []).filter((a) => a.id !== userId).map((a) => {
    const s = (stats ?? []).filter((x) => x.user_id === a.id).map((x) => `${x.metric}=${x.value}${x.unit}`).join(", ");
    return `- ${a.full_name ?? "Member"} | ${a.sport} ${a.position ?? ""} | born ${a.dob ?? "?"} | ${a.location || a.region || ""}${s ? ` | ${s}` : ""}`;
  });

  const instructions = `You are ScoutAI, the AthleteScouts assistant for sport in the UAE and GCC.
Today is ${today}. The member is a "${role}". Their profile: ${JSON.stringify(me ?? {})}.
For athletes: recommend relevant trials, tryouts, camps and tournaments that fit their sport, age, position and region; explain why each fits and mention deadlines. Give practical next steps (verify stats, update Passport, contact organiser).
For scouts, coaches and clubs: give useful talent insights — shortlist athletes matching their criteria, compare stats, flag what to verify, and suggest which events to attend.
Only use the data below; never invent people, clubs or events that are not listed. Present every listed item as a normal platform listing — never call anything demo, sample, fictional or "not real", and never add disclaimers about the data. If nothing matches, say so briefly and suggest the closest listed options. Keep answers concise with markdown lists.

Open opportunities:
${(opps ?? []).map((o) => `- ${o.title} — ${o.org_name} | ${o.kind}, ${o.sport}, ${o.level} | ${o.location} | starts ${o.starts_on}, deadline ${o.deadline}${o.positions.length ? ` | positions: ${o.positions.join(", ")}` : ""}`).join("\n") || "none"}

Members with sport profiles:
${athleteLines.join("\n") || "none yet"}

More tournaments:
${DEMO_TOURNAMENTS.map((t) => `- ${t.name} | ${t.sport} | ${t.ageGroup} | ${t.location} | ${t.dates} | deadline ${t.deadline} | ${t.fee}`).join("\n")}
Clubs:
${DEMO_CLUBS.map((c) => `- ${c.name} | ${c.sports.join("/")} | ${c.location} | ${c.level}`).join("\n")}
Athletes:
${DEMO_PEOPLE.filter((p) => p.kind === "athlete").map((p) => `- ${p.name} | ${p.sport} ${p.position} | age ${p.age} | ${p.location} | ${p.stats?.map((s) => `${s.label} ${s.value}`).join(", ")}`).join("\n")}`;

  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  const result = streamText({
    model: provider.responses(MODEL),
    system: instructions,
    messages: await convertToModelMessages(messages),
    abortSignal: request.signal,
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  const response = result.toUIMessageStreamResponse({
    originalMessages: messages,
    sendReasoning: true,
    onError: (e) => {
      console.error("scoutai stream", e);
      const status = (e as { statusCode?: number })?.statusCode;
      if (status === 429) return "ScoutAI is busy right now — please try again in a moment.";
      if (status === 402) return "AI credits have run out. Add credits in Settings → Plans & credits.";
      return "ScoutAI couldn't answer that. Please try again.";
    },
    onFinish: async ({ responseMessage }) => {
      const { error } = await supabase.from("scoutai_messages").upsert(
        { user_id: userId, message_id: responseMessage.id, role: "assistant", parts: responseMessage.parts.filter((p) => p.type === "text") as unknown as Json },
        { onConflict: "user_id,message_id" },
      );
      if (error) console.error("scoutai save assistant msg", error);
    },
  });
  return withLovableAiGatewayRunIdHeader(response, runIdFetch);
}
