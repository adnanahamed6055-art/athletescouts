import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
/** Presentation only; callers must supply a trusted verification decision. */
export function VerificationPill({ label = "Verified by School / Coach", className }: { label?: string; className?: string | undefined }) {
  return <span className={cn("inline-flex max-w-full items-center gap-2 rounded-full border border-verification/60 bg-verification-surface px-3 py-1.5 text-xs font-semibold leading-snug text-verification shadow-verification", className)}><ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" /><span>{label}</span></span>;
}
