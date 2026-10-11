/** Pure rules shared by the browser and the server for athlete verification & profile completeness. */
export const MAX_DOC_BYTES = 10 * 1024 * 1024;
export const MAX_DOCS = 2;
export const DOC_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/heic": "heic", "image/heif": "heic", "application/pdf": "pdf" } as const;
export const DOC_ACCEPT = ".jpg,.jpeg,.png,.heic,.heif,.pdf,image/jpeg,image/png,image/heic,image/heif,application/pdf";

export type VerificationKind = "school" | "academy" | "coach";
export type VerificationStatus = "submitted" | "under_review" | "more_info" | "rejected" | "approved";

export const KIND_LABEL: Record<VerificationKind, string> = { school: "School verification", academy: "Sports Academy / Club verification", coach: "Coach verification" };
export const VERIFIED_LABEL: Record<VerificationKind, string> = { school: "Verified by School", academy: "Verified by Academy / Club", coach: "Verified by Coach" };

export function statusLabel(status: VerificationStatus | null | undefined, kind?: VerificationKind): string {
  switch (status) {
    case "submitted": return "Verification submitted";
    case "under_review": return "Under review";
    case "more_info": return "More information required";
    case "rejected": return "Rejected";
    case "approved": return kind ? VERIFIED_LABEL[kind] : "Verified";
    default: return "Not verified";
  }
}
export const isPending = (s: VerificationStatus) => s === "submitted" || s === "under_review" || s === "more_info";

/** Detects the real file type from its first bytes; returns null for anything not allowed. */
export function sniffDocType(b: Uint8Array): keyof typeof DOC_TYPES | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => b[i] === v)) return "image/png";
  if (b.length >= 5 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d) return "application/pdf";
  if (b.length >= 12 && String.fromCharCode(b[4]!, b[5]!, b[6]!, b[7]!) === "ftyp") {
    const brand = String.fromCharCode(b[8]!, b[9]!, b[10]!, b[11]!);
    if (["heic", "heix", "hevc", "hevx", "heim", "heis", "mif1", "msf1"].includes(brand)) return "image/heic";
  }
  return null;
}

export function checkDocMeta(files: { name: string; size: number; type: string }[]): string | null {
  if (files.length === 0) return "Add at least one document.";
  if (files.length > MAX_DOCS) return `You can upload up to ${MAX_DOCS} documents.`;
  for (const f of files) {
    if (f.size > MAX_DOC_BYTES) return `${f.name} is larger than 10 MB.`;
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["jpg", "jpeg", "png", "heic", "heif", "pdf"].includes(ext)) return `${f.name}: only JPG, PNG, HEIC or PDF files are allowed.`;
  }
  return null;
}

/** Profile placeholders shown when details are missing. */
export const PLACEHOLDER = {
  name: "Complete your profile",
  sport: "Add your sport and position",
  bio: "Tell scouts about your playing background, strengths, and goals.",
  location: "Abu Dhabi, UAE",
} as const;

export type ProfileFields = { avatar_url?: string | null; full_name?: string | null; dob?: string | null; location?: string | null; region?: string | null; sport?: string | null; position?: string | null; school?: string | null; bio?: string | null };
export const REQUIRED_ATHLETE_FIELDS = ["avatar_url", "full_name", "dob", "location", "sport", "position", "school", "bio"] as const;

export function athleteCompletion(p: ProfileFields | null | undefined) {
  const missing = REQUIRED_ATHLETE_FIELDS.filter((k) => !String((p?.[k] ?? "")).trim());
  const done = REQUIRED_ATHLETE_FIELDS.length - missing.length;
  return { missing, done, total: REQUIRED_ATHLETE_FIELDS.length, percent: Math.round((done / REQUIRED_ATHLETE_FIELDS.length) * 100), complete: missing.length === 0 };
}
