CREATE TABLE public.event_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  target_id text NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('tournament','trial')),
  target_name text NOT NULL DEFAULT '',
  position text NOT NULL DEFAULT '' CHECK (char_length(position) <= 80),
  message text NOT NULL DEFAULT '' CHECK (char_length(message) <= 600),
  status text NOT NULL DEFAULT 'requested',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_id, target_type)
);
GRANT SELECT, INSERT, DELETE ON public.event_enrollments TO authenticated;
GRANT ALL ON public.event_enrollments TO service_role;
ALTER TABLE public.event_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own enrollments read" ON public.event_enrollments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Enroll as self" ON public.event_enrollments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'requested');
CREATE POLICY "Withdraw own enrollment" ON public.event_enrollments FOR DELETE TO authenticated USING (auth.uid() = user_id);