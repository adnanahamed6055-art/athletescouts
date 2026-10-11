CREATE POLICY "Verification docs owner or admin read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'verification-docs' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "Verification docs owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'verification-docs' AND (storage.foldername(name))[1] = auth.uid()::text);