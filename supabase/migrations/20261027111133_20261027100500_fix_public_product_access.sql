/*
# Fix public product access for the storefront

1. Changes
- Replace the mixed public-and-admin product read policy with separate policies.
- Public visitors can read only products marked active.
- Authenticated staff can additionally read inactive products when they are listed as admins.

2. Security
- The anonymous storefront policy no longer references `staff_profiles`.
- This prevents the public product request from requiring anonymous permission to inspect staff records.
- Staff-only access remains protected by the existing authenticated `staff_profiles` check.

3. Important notes
- No tables, columns, or product records are deleted or changed.
- Product management permissions remain restricted to authenticated staff.
*/

DROP POLICY IF EXISTS "public_read_active_products" ON public.products;

CREATE POLICY "public_read_active_products"
ON public.products
FOR SELECT
TO anon, authenticated
USING (active = true);

DROP POLICY IF EXISTS "staff_read_all_products" ON public.products;

CREATE POLICY "staff_read_all_products"
ON public.products
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.staff_profiles
    WHERE staff_profiles.user_id = auth.uid()
      AND staff_profiles.role = 'admin'
  )
);