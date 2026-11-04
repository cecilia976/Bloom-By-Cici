CREATE TABLE IF NOT EXISTS public.customer_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL CHECK (char_length(btrim(customer_name)) BETWEEN 2 AND 80),
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback text NOT NULL CHECK (char_length(btrim(feedback)) BETWEEN 10 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_reviews ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.customer_reviews FROM anon, authenticated;
GRANT SELECT ON public.customer_reviews TO anon, authenticated;
GRANT INSERT (customer_name, rating, feedback) ON public.customer_reviews TO anon, authenticated;
GRANT DELETE ON public.customer_reviews TO authenticated;

CREATE POLICY "public_read_customer_reviews"
  ON public.customer_reviews
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "public_submit_customer_reviews"
  ON public.customer_reviews
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(btrim(customer_name)) BETWEEN 2 AND 80
    AND rating BETWEEN 1 AND 5
    AND char_length(btrim(feedback)) BETWEEN 10 AND 1000
  );

CREATE POLICY "staff_delete_customer_reviews"
  ON public.customer_reviews
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.staff_profiles
      WHERE user_id = auth.uid()
        AND role = 'admin'
    )
  );

CREATE INDEX customer_reviews_created_at_idx
  ON public.customer_reviews (created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'customer_reviews'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_reviews;
  END IF;
END
$$;
