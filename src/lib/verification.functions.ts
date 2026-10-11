import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DOC_TYPES, MAX_DOC_BYTES, sniffDocType } from "@/lib/verification-rules";

/** Uploads one verification document after checking its real type and size on the server. */
export const uploadVerificationDoc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { base64: string }) => {
    if (typeof input?.base64 !== "string" || input.base64.length > Math.ceil(MAX_DOC_BYTES / 3) * 4 + 8) throw new Error("File is larger than 10 MB.");
    return input;
  })
  .handler(async ({ data, context }) => {
    const bin = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    if (bin.byteLength === 0 || bin.byteLength > MAX_DOC_BYTES) throw new Error("File must be under 10 MB.");
    const type = sniffDocType(bin);
    if (!type) throw new Error("Only JPG, PNG, HEIC or PDF documents are accepted.");
    const path = `${context.userId}/${crypto.randomUUID()}.${DOC_TYPES[type]}`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage.from("verification-docs").upload(path, bin, { contentType: type, upsert: false });
    if (error) throw new Error("Upload failed. Please try again.");
    return { path };
  });
