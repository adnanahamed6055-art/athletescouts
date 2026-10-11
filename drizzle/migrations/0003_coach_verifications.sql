CREATE TABLE public.coach_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  license_no text NOT NULL,
  issuing_body text NOT NULL,
  organisation text NOT NULL DEFAULT '',
  document_path text,
  note text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  review_note text NOT NULL DEFAULT '',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.coach_verifications TO authenticated;
GRANT ALL ON public.coach_verifications TO service_role;
ALTER TABLE public.coach_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own or admin reads verification" ON public.coach_verifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Coaches request verification" ON public.coach_verifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending' AND reviewed_by IS NULL AND public.has_role(auth.uid(), 'coach'));
CREATE POLICY "Coaches resubmit own" ON public.coach_verifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status <> 'approved')
  WITH CHECK (auth.uid() = user_id AND status = 'pending' AND reviewed_by IS NULL);
CREATE POLICY "Admins review" ON public.coach_verifications FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Public, safe list of verified coaches (no licence details exposed)
CREATE OR REPLACE FUNCTION public.verified_coach_ids()
RETURNS TABLE(user_id uuid) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT user_id FROM public.coach_verifications WHERE status = 'approved'
$$;
GRANT EXECUTE ON FUNCTION public.verified_coach_ids() TO authenticated;

CREATE TRIGGER coach_verifications_touch BEFORE UPDATE ON public.coach_verifications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();