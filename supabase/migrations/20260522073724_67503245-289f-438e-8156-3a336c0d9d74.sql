
-- 1. Product images: restrict UPDATE/DELETE to file owner
CREATE POLICY "product-images owner update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "product-images owner delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 2. Re-assert column-level revokes on offers sponsor commercial data
REVOKE SELECT (sponsor_name, sponsor_paid_eur) ON public.offers FROM authenticated, anon;
