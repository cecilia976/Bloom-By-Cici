/*
# Create Bloom By Cici store data

1. New tables
- `products`: public catalog records with title, category, price, description, image URLs, stock status, occasion tags, and size variants.
- `inquiries`: customer custom-order requests, including contact details, event date, budget, description, optional reference images, and workflow status.

2. Security
- Products are publicly readable so the storefront works before sign-in.
- Product writes and private inquiry access are restricted to the authorized administrator.
- Administrator authorization uses the trusted Supabase Auth `app_metadata.role` claim.
- Row-level security is enabled on every table and grants are limited to the operations used by the app.

3. Important notes
- Set `app_metadata.role` to `admin` for the administrator account through a trusted Supabase administrative channel.
- Product image URLs are stored as text so the initial catalog can use replaceable hosted photography.
*/

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('Fresh & Preserved Bouquets', 'Vases & Floral Arrangements', 'Mirror & Wall Floral Decor')),
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  description text NOT NULL,
  images text[] NOT NULL DEFAULT '{}',
  stock_status text NOT NULL DEFAULT 'In stock' CHECK (stock_status IN ('In stock', 'Low stock', 'Out of stock')),
  stock_count integer NOT NULL DEFAULT 0 CHECK (stock_count >= 0),
  occasions text[] NOT NULL DEFAULT '{}',
  sizes text[] NOT NULL DEFAULT '{Standard}',
  featured boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  event_date date NOT NULL,
  budget_range text NOT NULL,
  description text NOT NULL,
  image_urls text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'In Progress', 'Completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT INSERT ON public.inquiries TO anon, authenticated;
GRANT SELECT, UPDATE ON public.inquiries TO authenticated;

DROP POLICY IF EXISTS "public_read_active_products" ON public.products;
CREATE POLICY "public_read_active_products" ON public.products FOR SELECT TO anon, authenticated USING (active = true OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
DROP POLICY IF EXISTS "staff_insert_products" ON public.products;
DROP POLICY IF EXISTS "admin_insert_products" ON public.products;
CREATE POLICY "admin_insert_products" ON public.products FOR INSERT TO authenticated WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
DROP POLICY IF EXISTS "staff_update_products" ON public.products;
DROP POLICY IF EXISTS "admin_update_products" ON public.products;
CREATE POLICY "admin_update_products" ON public.products FOR UPDATE TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
DROP POLICY IF EXISTS "staff_delete_products" ON public.products;
DROP POLICY IF EXISTS "admin_delete_products" ON public.products;
CREATE POLICY "admin_delete_products" ON public.products FOR DELETE TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "public_submit_inquiries" ON public.inquiries;
CREATE POLICY "public_submit_inquiries" ON public.inquiries FOR INSERT TO anon, authenticated WITH CHECK (status = 'New');
DROP POLICY IF EXISTS "staff_read_inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "admin_read_inquiries" ON public.inquiries;
CREATE POLICY "admin_read_inquiries" ON public.inquiries FOR SELECT TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
DROP POLICY IF EXISTS "staff_update_inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "admin_update_inquiries" ON public.inquiries;
CREATE POLICY "admin_update_inquiries" ON public.inquiries FOR UPDATE TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

INSERT INTO public.products (title, category, price, description, images, stock_status, stock_count, occasions, sizes, featured)
SELECT * FROM (VALUES
('The Softly Said Bouquet', 'Fresh & Preserved Bouquets', 68.00, 'A romantic, cloud-soft arrangement of blush roses, lilac blooms, and gathered greenery. Wrapped by hand in our signature paper.', ARRAY['https://images.pexels.com/photos/15290973/pexels-photo-15290973.jpeg?auto=compress&cs=tinysrgb&h=650&w=940','https://images.pexels.com/photos/4639529/pexels-photo-4639529.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'], 'In stock', 12, ARRAY['Just because','Birthday'], ARRAY['Petite','Medium','Deluxe'], true),
('Sunday Morning Stems', 'Fresh & Preserved Bouquets', 54.00, 'Golden stems, happy faces, and that just-picked feeling. A sunny bouquet for making an ordinary morning feel special.', ARRAY['https://images.pexels.com/photos/11503395/pexels-photo-11503395.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'], 'Low stock', 4, ARRAY['Birthday','Thank you'], ARRAY['Petite','Medium','Deluxe'], true),
('The Keepsake Vase', 'Vases & Floral Arrangements', 92.00, 'A sculptural ceramic vase filled with preserved blooms in warm, sandy tones. Designed to stay lovely long after the day.', ARRAY['https://images.pexels.com/photos/9957266/pexels-photo-9957266.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'], 'In stock', 8, ARRAY['Housewarming','Just because'], ARRAY['Standard','Deluxe'], true),
('Pink Hour Arrangement', 'Vases & Floral Arrangements', 84.00, 'A lush little arrangement of pink roses and airy fillers, finished in a softly curved glass vase.', ARRAY['https://images.pexels.com/photos/15325501/pexels-photo-15325501.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'], 'In stock', 9, ARRAY['Birthday','Anniversary'], ARRAY['Standard','Deluxe'], false),
('Petal Frame Mirror', 'Mirror & Wall Floral Decor', 180.00, 'A statement mirror edged with hand-placed blooms and preserved texture. A little art, a little reflection, entirely yours.', ARRAY['https://images.pexels.com/photos/15409846/pexels-photo-15409846.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'], 'Low stock', 2, ARRAY['Home refresh','Gift'], ARRAY['Standard','Deluxe'], true),
('The Bloom Wall Moment', 'Mirror & Wall Floral Decor', 240.00, 'A dreamy floral wall installation designed to bring softness, colour, and a little theatre to your favourite space.', ARRAY['https://images.pexels.com/photos/30368728/pexels-photo-30368728.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'], 'Out of stock', 0, ARRAY['Event','Home refresh'], ARRAY['Deluxe'], false)
) AS seed(title, category, price, description, images, stock_status, stock_count, occasions, sizes, featured)
WHERE NOT EXISTS (SELECT 1 FROM public.products LIMIT 1);
