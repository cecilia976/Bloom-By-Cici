ALTER TABLE public.customer_reviews
  ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT false;

REVOKE ALL ON public.customer_reviews FROM anon, authenticated;
GRANT SELECT ON public.customer_reviews TO anon, authenticated;
GRANT INSERT (customer_name, rating, feedback) ON public.customer_reviews TO anon, authenticated;
GRANT UPDATE (is_approved) ON public.customer_reviews TO authenticated;
GRANT DELETE ON public.customer_reviews TO authenticated;

DROP POLICY IF EXISTS "public_read_customer_reviews" ON public.customer_reviews;
DROP POLICY IF EXISTS "public_read_approved_customer_reviews" ON public.customer_reviews;
CREATE POLICY "public_read_approved_customer_reviews"
  ON public.customer_reviews FOR SELECT TO anon, authenticated
  USING (
    is_approved = true
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

DROP POLICY IF EXISTS "public_submit_customer_reviews" ON public.customer_reviews;
CREATE POLICY "public_submit_customer_reviews"
  ON public.customer_reviews FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(btrim(customer_name)) BETWEEN 2 AND 80
    AND rating BETWEEN 1 AND 5
    AND char_length(btrim(feedback)) BETWEEN 10 AND 1000
    AND is_approved = false
  );

DROP POLICY IF EXISTS "staff_delete_customer_reviews" ON public.customer_reviews;
DROP POLICY IF EXISTS "admin_moderate_customer_reviews" ON public.customer_reviews;
CREATE POLICY "admin_moderate_customer_reviews"
  ON public.customer_reviews FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "admin_delete_customer_reviews" ON public.customer_reviews;
CREATE POLICY "admin_delete_customer_reviews"
  ON public.customer_reviews FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "staff_insert_products" ON public.products;
DROP POLICY IF EXISTS "admin_insert_products" ON public.products;
CREATE POLICY "admin_insert_products"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "staff_update_products" ON public.products;
DROP POLICY IF EXISTS "admin_update_products" ON public.products;
CREATE POLICY "admin_update_products"
  ON public.products FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "staff_delete_products" ON public.products;
DROP POLICY IF EXISTS "admin_delete_products" ON public.products;
CREATE POLICY "admin_delete_products"
  ON public.products FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "public_read_active_products" ON public.products;
CREATE POLICY "public_read_active_products"
  ON public.products FOR SELECT TO anon, authenticated
  USING (
    active = true
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

DROP POLICY IF EXISTS "staff_read_inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "admin_read_inquiries" ON public.inquiries;
CREATE POLICY "admin_read_inquiries"
  ON public.inquiries FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "staff_update_inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "admin_update_inquiries" ON public.inquiries;
CREATE POLICY "admin_update_inquiries"
  ON public.inquiries FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "staff_manage_site_content" ON public.site_content;
DROP POLICY IF EXISTS "admin_manage_site_content" ON public.site_content;
CREATE POLICY "admin_manage_site_content"
  ON public.site_content FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "staff_manage_gallery" ON public.gallery_items;
DROP POLICY IF EXISTS "admin_manage_gallery" ON public.gallery_items;
CREATE POLICY "admin_manage_gallery"
  ON public.gallery_items FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "public_read_gallery" ON public.gallery_items;
CREATE POLICY "public_read_gallery"
  ON public.gallery_items FOR SELECT TO anon, authenticated
  USING (
    is_public = true
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

DROP POLICY IF EXISTS "staff_upload_bloom_assets" ON storage.objects;
DROP POLICY IF EXISTS "admin_upload_bloom_assets" ON storage.objects;
CREATE POLICY "admin_upload_bloom_assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'bloom-assets'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

DROP POLICY IF EXISTS "staff_update_bloom_assets" ON storage.objects;
DROP POLICY IF EXISTS "admin_update_bloom_assets" ON storage.objects;
CREATE POLICY "admin_update_bloom_assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'bloom-assets'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    bucket_id = 'bloom-assets'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

DROP POLICY IF EXISTS "staff_delete_bloom_assets" ON storage.objects;
DROP POLICY IF EXISTS "admin_delete_bloom_assets" ON storage.objects;
CREATE POLICY "admin_delete_bloom_assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'bloom-assets'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
