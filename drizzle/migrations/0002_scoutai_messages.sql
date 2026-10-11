CREATE TABLE public.scoutai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  message_id text NOT NULL,
  role text NOT NULL,
  parts jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, message_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scoutai_messages TO authenticated;
GRANT ALL ON public.scoutai_messages TO service_role;
ALTER TABLE public.scoutai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own scoutai read" ON public.scoutai_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own scoutai insert" ON public.scoutai_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own scoutai update" ON public.scoutai_messages FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own scoutai delete" ON public.scoutai_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX scoutai_messages_user_idx ON public.scoutai_messages (user_id, created_at);