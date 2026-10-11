import { BadgeCheck } from "lucide-react";
import { useVerifiedCoaches } from "@/hooks/useVerifiedCoaches";
import { useAthleteBadge } from "@/hooks/useAthleteBadges";
import { VerificationPill } from "@/components/app/VerificationPill";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { KIND_LABEL } from "@/lib/verification-rules";
import { cn } from "@/lib/utils";

/** Shows a "Verified coach" tick when this member's coach credentials were approved. */
export function VerifiedBadge({ userId, label = false, className }: { userId: string; label?: boolean; className?: string }) {
  const verified = useVerifiedCoaches();
  if (!verified.has(userId)) return null;
  if (label) return <VerificationPill label="Verified coach" className={className} />;
  return (
    <span title="Verified coach — credentials checked by AthleteScouts" className={cn("inline-flex shrink-0 items-center gap-0.5 text-primary", className)}>
      <BadgeCheck className="h-4 w-4" aria-label="Verified coach" />
    </span>
  );
}

/** Green shield pill shown only after an admin approved the athlete's verification request. */
export function AthleteBadgePill({ userId }: { userId: string }) {
  const badge = useAthleteBadge(userId);
  if (!badge) return null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="max-w-full rounded-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <VerificationPill label={`Verified by ${badge.org_name}`} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 text-sm">
        <div className="font-semibold">{KIND_LABEL[badge.kind]}</div>
        <div className="text-muted-foreground">{badge.org_name}</div>
        {badge.reviewed_at && <div className="mt-1 text-xs text-muted-foreground">Approved {new Date(badge.reviewed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>}
        <p className="mt-2 text-xs text-muted-foreground">Reviewed by the AthleteScouts team. Documents stay private.</p>
      </PopoverContent>
    </Popover>
  );
}
