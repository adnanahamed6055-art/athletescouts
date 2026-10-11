ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS organiser_note text NOT NULL DEFAULT '';
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.applications ADD CONSTRAINT applications_status_check CHECK (status IN ('submitted','shortlisted','accepted','declined')) NOT VALID;
ALTER TABLE public.applications ADD CONSTRAINT applications_note_len CHECK (char_length(organiser_note) <= 500);

REVOKE UPDATE ON public.applications FROM authenticated;
GRANT UPDATE (status, organiser_note, updated_at) ON public.applications TO authenticated;

CREATE POLICY "Organiser updates applicant status" ON public.applications FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.opportunities o WHERE o.id = applications.opportunity_id AND o.created_by = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.opportunities o WHERE o.id = applications.opportunity_id AND o.created_by = auth.uid()));

CREATE OR REPLACE FUNCTION public.notify_application_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.updated_at = now();
    INSERT INTO notifications(user_id, actor_id, type, entity_id)
    VALUES (NEW.user_id, auth.uid(), 'application_' || NEW.status, NEW.opportunity_id);
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER applications_status_notify BEFORE UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.notify_application_status();