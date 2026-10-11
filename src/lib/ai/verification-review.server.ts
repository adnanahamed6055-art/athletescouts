import { createOpenAI } from "@ai-sdk/openai";
import { NoObjectGeneratedError, Output, streamText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayRunIdFetch } from "./run-id";

export const REVIEW_MODEL = "openai/gpt-6-astra";

const match = z.enum(["match", "partial_match", "mismatch", "not_found"]);
const schema = z.object({
  documentType: z.enum(["school_id", "academy_card", "club_card", "official_letter", "roster", "coach_letter", "unknown"]),
  documentReadability: z.enum(["clear", "partial", "poor", "unreadable"]),
  extractedName: z.string().nullable(),
  extractedOrganization: z.string().nullable(),
  extractedAthleteReference: z.string().nullable(),
  extractedSport: z.string().nullable(),
  extractedTeamOrGrade: z.string().nullable(),
  extractedExpiryOrAcademicYear: z.string().nullable(),
  profileNameMatch: match,
  organizationMatch: match,
  sportMatch: match,
  athleteReferenceMatch: match,
  confidence: z.enum(["high", "medium", "low"]),
  reviewFlags: z.array(z.string()),
  adminSummary: z.string(),
});
export type AiReview = z.infer<typeof schema>;

export type ReviewDoc = { mime: string; bytes: Uint8Array };
export type ReviewContext = { kind: string; profileName: string; profileSport: string; orgName: string; athleteRef: string; sport: string; teamGrade: string };

const INSTRUCTIONS = `You are ScoutAI's document review assistant for AthleteScouts athlete verification. You help a human admin; you never decide.
Read the uploaded document(s) and extract only visible, legible text: person name, organisation, student/athlete/membership ID, sport/team/grade, expiry date or academic year, and document type. Rate readability.
Compare against the submitted details after normalising case, spacing, punctuation and formatting. Allow middle names, initials and Arabic/English transliteration variants (treat these as partial_match or match, never mismatch). Use not_found when a field is not visible or not submitted.
Strict rules: do NOT use or comment on faces, photos of people, apparent gender, ethnicity, nationality, clothing, age or name origin. No biometric matching. Never say a document is authentic or that the athlete is verified, and never recommend automatic approval or rejection.
reviewFlags: short snake_case flags such as document_unreadable, name_partial_match, organization_mismatch, student_id_not_visible, unsupported_document_type, document_expired, manual_review_required. Always include manual_review_required when anything is a mismatch, uncertain, or confidence is low.
adminSummary: 1-3 short factual, uncertainty-aware sentences. Mask any ID number to its last 4 characters (e.g. ••••1234) in the summary.`;

function toB64(b: Uint8Array) { let s = ""; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000)); return btoa(s); }

/** Runs one AI-assisted review. Returns null-safe result or throws for the caller to record as failed. */
export async function runVerificationReview(docs: ReviewDoc[], ctx: ReviewContext, apiKey: string): Promise<AiReview> {
  const parts: ({ type: "text"; text: string } | { type: "file"; filename: string; data: string; mediaType: string })[] = [
    { type: "text", text: `Verification type: ${ctx.kind}\nProfile name: ${ctx.profileName || "(blank)"}\nProfile sport: ${ctx.profileSport || "(blank)"}\nSubmitted organisation: ${ctx.orgName}\nSubmitted athlete/student ID: ${ctx.athleteRef || "(none)"}\nSubmitted sport: ${ctx.sport || "(none)"}\nSubmitted team/grade: ${ctx.teamGrade || "(none)"}` },
  ];
  let unsupported = 0;
  docs.forEach((d, i) => {
    if (d.mime === "application/pdf") parts.push({ type: "file", filename: `proof-${i + 1}.pdf`, data: toB64(d.bytes), mediaType: "application/pdf" });
    else if (d.mime === "image/jpeg" || d.mime === "image/png") parts.push({ type: "file", filename: `proof-${i + 1}`, data: toB64(d.bytes), mediaType: d.mime });
    else unsupported++;
  });
  if (unsupported) parts.push({ type: "text", text: `${unsupported} document(s) were in a format that could not be shown to you (e.g. HEIC); flag manual_review_required.` });

  const runId = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({ baseURL: "https://ai.gateway.lovable.dev/v1", apiKey, headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" }, fetch: runId.fetch });
  const result = streamText({
    model: provider.responses(REVIEW_MODEL),
    system: INSTRUCTIONS,
    messages: [{ role: "user", content: parts }],
    output: Output.object({ schema }),
    providerOptions: { openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] } },
  });
  try {
    const out = await result.output;
    // Safety net: never let a weak or mismatched result look clean.
    const weak = out.confidence === "low" || [out.profileNameMatch, out.organizationMatch].includes("mismatch") || out.documentReadability !== "clear";
    if ((weak || unsupported) && !out.reviewFlags.includes("manual_review_required")) out.reviewFlags.push("manual_review_required");
    return out;
  } catch (e) {
    if (NoObjectGeneratedError.isInstance(e)) throw new Error("AI returned an unreadable result");
    throw e;
  }
}

export async function sha256Hex(b: Uint8Array) {
  const h = await crypto.subtle.digest("SHA-256", b as unknown as ArrayBuffer);
  return Array.from(new Uint8Array(h)).map((x) => x.toString(16).padStart(2, "0")).join("");
}
