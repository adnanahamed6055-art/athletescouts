import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sniffDocType } from "@/lib/verification-rules";

/**
 * Background ScoutAI document review for a verification request. Admin-only output; never changes status.
 * Callable by the request owner (right after submitting) or an admin. Idempotent per request + document hashes.
 */
export const reviewVerificationWithAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { verificationId: string }) => {
    if (typeof input?.verificationId !== "string" || !/^[0-9a-f-]{36}$/i.test(input.verificationId)) throw new Error("Invalid request");
    return input;
  })
  .handler(async ({ data, context }) => {
    // RLS: owner or admin can read the request; anyone else gets nothing.
    const { data: req } = await context.supabase.from("athlete_verifications").select("*").eq("id", data.verificationId).maybeSingle();
    if (!req) throw new Error("Not found");
    if (req.user_id !== context.userId) {
      const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
      if (!isAdmin) throw new Error("Forbidden");
    }
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ok: false };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { runVerificationReview, sha256Hex, REVIEW_MODEL } = await import("@/lib/ai/verification-review.server");
    const docs: { mime: string; bytes: Uint8Array }[] = [];
    for (const path of req.document_paths.slice(0, 2)) {
      if (!path.startsWith(`${req.user_id}/`)) continue;
      const { data: blob } = await supabaseAdmin.storage.from("verification-docs").download(path);
      if (!blob) continue;
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const mime = sniffDocType(bytes);
      if (mime && bytes.byteLength <= 10 * 1024 * 1024) docs.push({ mime, bytes });
    }
    const hashes = await Promise.all(docs.map((d) => sha256Hex(d.bytes)));
    const runKey = `${req.id}:${hashes.join(",")}`;
    const { data: run, error: insErr } = await supabaseAdmin.from("verification_ai_reviews").insert({ verification_id: req.id, run_key: runKey, model: REVIEW_MODEL }).select("id").single();
    if (insErr || !run) return { ok: true, duplicate: true }; // unique run_key → already reviewed

    const { data: prof } = await supabaseAdmin.from("profiles").select("full_name, sport").eq("id", req.user_id).maybeSingle();
    try {
      if (!docs.length) throw new Error("No readable documents");
      const result = await runVerificationReview(docs, { kind: req.kind, profileName: prof?.full_name ?? "", profileSport: prof?.sport ?? "", orgName: req.org_name, athleteRef: req.athlete_ref ?? "", sport: req.sport ?? "", teamGrade: req.team_grade ?? "" }, apiKey);
      await supabaseAdmin.from("verification_ai_reviews").update({ status: "done", result: { verificationId: req.id, ...result }, finished_at: new Date().toISOString() }).eq("id", run.id);
    } catch (e) {
      console.error("verification AI review failed", e);
      await supabaseAdmin.from("verification_ai_reviews").update({ status: "failed", error: e instanceof Error ? e.message.slice(0, 300) : "failed", finished_at: new Date().toISOString() }).eq("id", run.id);
    }
    return { ok: true };
  });
