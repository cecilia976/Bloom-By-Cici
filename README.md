# Bloom By Cici

A full-stack handmade floral storefront for bouquets, arrangements, mirror décor, custom requests, and a protected administrator portal.

## Supabase setup

1. Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` plus either `VITE_SUPABASE_ANON_KEY` or `VITE_SUPABASE_PUBLISHABLE_KEY`. These are public client keys; never put a service-role/secret key in a `VITE_` variable.
2. Apply the SQL files in `supabase/migrations/` to your project, in filename order. They create the storefront tables, content and gallery data, review moderation policies, and the `bloom-assets` Storage bucket and policies.
3. In Supabase Authentication, create the administrator's email/password account. Then set its trusted `app_metadata` role to `admin` using the Supabase SQL editor:

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
   where lower(email) = lower('ADMIN_EMAIL');
   ```

   Replace `ADMIN_EMAIL` with the administrator account email. This must be done through a trusted administrative channel; never use editable `user_metadata` as an authorization source. Sign out and back in after changing the role so the session token refreshes. The dashboard and RLS policies both require this role. Do not enable public sign-ups.
4. Restart the Vite development server after changing `.env`.

.env files are excluded from Git. Public visitors can submit reviews, which remain hidden until approved in the administrator portal. Public visitors can read approved reviews only. The admin portal provides a dashboard overview, product management, image/gallery management, review moderation, and logout; custom-order and site-content behavior remains part of the storefront and is not managed from the admin portal.
