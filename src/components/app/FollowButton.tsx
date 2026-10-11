import { useFollows } from "@/hooks/useFollows";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FollowButton({ me, id, size = "sm", className }: { me: string; id: string; size?: "xs" | "sm"; className?: string }) {
  const { following, toggle } = useFollows(me);
  if (me === id) return null;
  const on = following.has(id);
  return (
    <Button variant="ghost" size="sm" type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(id); }}
      className={cn("rounded-full font-bold transition-all active:scale-95",
        size === "xs" ? "px-3 py-1 text-[11px]" : "px-4 py-1.5 text-sm",
        on ? "border border-border text-muted-foreground hover:border-destructive hover:text-destructive" : "bg-primary text-primary-foreground hover:shadow-glow", className)}>
      {on ? "Following" : "Follow"}
    </Button>
  );
}
