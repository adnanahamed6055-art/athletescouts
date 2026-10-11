CREATE TABLE public.verification_ai_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id uuid NOT NULL REFERENCES public.athlete_verifications(id) ON DELETE CASCADE,
  run_key text NOT NULL UNIQUE,
  model text NOT NULL,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running','done','failed')),
  result jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE INDEX verification_ai_reviews_vid ON public.verification_ai_reviews(verification_id, created_at DESC);
GRANT SELECT ON public.verification_ai_reviews TO authenticated;
GRANT ALL ON public.verification_ai_reviews TO service_role;
ALTER TABLE public.verification_ai_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read AI reviews" ON public.verification_ai_reviews FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));