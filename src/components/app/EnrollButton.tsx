import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export type EnrollType = "tournament" | "trial";
const KEY = ["event_enrollments"] as const;

export const enrollSchema = z.object({
  position: z.string().trim().max(80, "Keep it under 80 characters"),
  message: z.string().trim().max(600, "Keep it under 600 characters"),
});

export function useEnrollments() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from("event_enrollments").select("target_id,target_type");
      if (error) throw error;
      return new Set((data ?? []).map((r) => `${r.target_type}:${r.target_id}`));
    },
    staleTime: 60_000,
  });
}

/** Enroll in a tournament or request a club trial; saved to the member's account. */
export function EnrollButton({ type, id, name, size = "sm", className }: { type: EnrollType; id: string; name: string; size?: "sm" | "default"; className?: string }) {
  const qc = useQueryClient();
  const { data } = useEnrollments();
  const done = data?.has(`${type}:${id}`) ?? false;
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState("");
  const [message, setMessage] = useState("");
  const label = type === "tournament" ? "Enroll" : "Request trial";

  const save = useMutation({
    mutationFn: async () => {
      const parsed = enrollSchema.safeParse({ position, message });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Check your details");
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Please sign in first");
      const { error } = await supabase.from("event_enrollments").insert({ user_id: u.user.id, target_id: id, target_type: type, target_name: name, ...parsed.data });
      if (error && error.code !== "23505") throw error;
    },
    onSuccess: () => { setOpen(false); toast.success(type === "tournament" ? `You're enrolled in ${name}` : `Trial request sent to ${name}`); void qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e) => toast.error((e as Error).message),
  });
  const withdraw = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("event_enrollments").delete().eq("target_id", id).eq("target_type", type);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Withdrawn"); void qc.invalidateQueries({ queryKey: KEY }); },
  });

  if (done) return (
    <Button size={size} variant="secondary" className={className} disabled={withdraw.isPending} onClick={(e) => { e.stopPropagation(); withdraw.mutate(); }} title="Click to withdraw">
      <CheckCircle2 className="text-primary" />{type === "tournament" ? "Enrolled" : "Requested"}
    </Button>
  );
  return (
    <>
      <Button size={size} className={className} onClick={(e) => { e.stopPropagation(); setOpen(true); }}>{label}</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogTitle className="font-display text-2xl">{label} · {name}</DialogTitle>
          <DialogDescription>{type === "tournament" ? "Your entry is saved to your account and shown in Opportunities → My applications." : "Tell the club a little about you. Your request is saved to your account."}</DialogDescription>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
            <Input placeholder={type === "tournament" ? "Team or category (optional)" : "Position / event (optional)"} value={position} maxLength={80} onChange={(e) => setPosition(e.target.value)} />
            <Textarea placeholder="Short note (optional)" value={message} maxLength={600} rows={4} onChange={(e) => setMessage(e.target.value)} />
            <Button type="submit" className="w-full" disabled={save.isPending}>{save.isPending && <Loader2 className="animate-spin" />}{label}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
