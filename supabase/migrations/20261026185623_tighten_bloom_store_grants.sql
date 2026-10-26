/*
# Tighten Bloom By Cici data grants

1. Changes
- Public visitors retain only the ability to read active products and submit inquiries.
- Authenticated staff retain product management, inquiry inbox access, and inquiry status updates.
- Staff profile records are readable only by authenticated sessions and are not writable through the browser.

2. Security
- Revoke broad default Data API privileges that are not needed by the storefront.
- Keep row-level policies as the final authorization boundary.
*/

REVOKE INSERT, UPDATE, DELETE ON public.products FROM anon;
REVOKE DELETE ON public.inquiries FROM anon, authenticated;
REVOKE UPDATE, SELECT ON public.inquiries FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.staff_profiles FROM anon, authenticated;
REVOKE SELECT ON public.staff_profiles FROM anon;
