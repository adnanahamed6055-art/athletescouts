CREATE TABLE public.athlete_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  kind text NOT NULL CHECK (kind IN ('school','academy','coach')),
  org_name text NOT NULL CHECK (char_length(org_name) BETWEEN 2 AND 120),
  emirate text NOT NULL DEFAULT '',
  athlete_ref text NOT NULL DEFAULT '',
  sport text NOT NULL DEFAULT '',
  team_grade text NOT NULL DEFAULT '',
  document_paths text[] NOT NULL DEFAULT '{}' CHECK (cardinality(document_paths) BETWEEN 1 AND 2),
  guardian_consent boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','under_review','more_info','rejected','approved')),
  review_note text NOT NULL DEFAULT '',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.athlete_verifications TO authenticated;
GRANT UPDATE (status, review_note, reviewed_by, reviewed_at) ON public.athlete_verifications TO authenticated;
GRANT ALL ON public.athlete_verifications TO service_role;
ALTER TABLE public.athlete_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner or admin reads" ON public.athlete_verifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owner submits" ON public.athlete_verifications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'submitted' AND reviewed_by IS NULL AND reviewed_at IS NULL AND review_note = '');
CREATE POLICY "Owner withdraws pending" ON public.athlete_verifications FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND status IN ('submitted','under_review','more_info'));
CREATE POLICY "Admins review" ON public.athlete_verifications FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.athlete_verification_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.reviewed_by = auth.uid();
    NEW.reviewed_at = now();
    INSERT INTO notifications(user_id, actor_id, type, entity_id)
    VALUES (NEW.user_id, auth.uid(), 'verification_' || NEW.status, NEW.id);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER athlete_verifications_review BEFORE UPDATE ON public.athlete_verifications
  FOR EACH ROW EXECUTE FUNCTION public.athlete_verification_review();

CREATE OR REPLACE FUNCTION public.athlete_verified_badges()
RETURNS TABLE(user_id uuid, kind text, org_name text, reviewed_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT ON (user_id) user_id, kind, org_name, reviewed_at
  FROM public.athlete_verifications WHERE status = 'approved'
  ORDER BY user_id, reviewed_at DESC
$$;
GRANT EXECUTE ON FUNCTION public.athlete_verified_badges() TO authenticated;