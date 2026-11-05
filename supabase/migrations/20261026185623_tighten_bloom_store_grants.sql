/*
# Tighten Bloom By Cici data grants

1. Changes
- Public visitors retain only the ability to read active products and submit inquiries.
- The authorized administrator retains product management, inquiry inbox access, and inquiry status updates.

2. Security
- Revoke broad default Data API privileges that are not needed by the storefront.
- Keep row-level policies as the final authorization boundary.
*/

REVOKE INSERT, UPDATE, DELETE ON public.products FROM anon;
REVOKE DELETE ON public.inquiries FROM anon, authenticated;
REVOKE UPDATE, SELECT ON public.inquiries FROM anon;
