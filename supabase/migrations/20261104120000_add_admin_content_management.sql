ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

ALTER TABLE public.products
  ALTER COLUMN price DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.site_content (
  content_key text PRIMARY KEY,
  content_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path text NOT NULL,
  image_url text NOT NULL,
  caption text NOT NULL DEFAULT '',
  display_order integer NOT NULL DEFAULT 0,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.site_content FROM anon, authenticated;
REVOKE ALL ON public.gallery_items FROM anon, authenticated;
GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT SELECT ON public.gallery_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.gallery_items TO authenticated;

CREATE POLICY "public_read_site_content"
  ON public.site_content FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "admin_manage_site_content"
  ON public.site_content FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "public_read_gallery"
  ON public.gallery_items FOR SELECT TO anon, authenticated
  USING (is_public = true OR EXISTS (
    SELECT 1
    WHERE (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  ));

CREATE POLICY "admin_manage_gallery"
  ON public.gallery_items FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE INDEX IF NOT EXISTS gallery_items_display_order_idx
  ON public.gallery_items (display_order, created_at DESC);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('bloom-assets', 'bloom-assets', true, 8388608, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 8388608,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS "public_read_bloom_assets" ON storage.objects;
CREATE POLICY "public_read_bloom_assets"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'bloom-assets');

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
