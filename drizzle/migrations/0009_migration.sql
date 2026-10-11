CREATE OR REPLACE FUNCTION public.has_opportunity_link(_opp uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM applications a WHERE a.opportunity_id = _opp AND a.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM saved_opportunities s WHERE s.opportunity_id = _opp AND s.user_id = auth.uid())
$$;
DROP POLICY IF EXISTS "Read open or own opportunities" ON public.opportunities;
CREATE POLICY "Read open or own opportunities" ON public.opportunities FOR SELECT TO authenticated USING (
  auth.uid() = created_by OR deadline >= CURRENT_DATE OR public.has_opportunity_link(id));