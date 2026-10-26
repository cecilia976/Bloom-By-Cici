# Bloom By Cici

A full-stack handmade floral storefront for bouquets, arrangements, mirror décor, custom requests, and a protected staff studio.

## One-time staff setup

The store uses Supabase Auth for staff sign-in. Create the staff account using the requested email and password in Supabase Auth, then add that account’s user ID to `staff_profiles` with the `admin` role. The password is never stored in this app’s public code. Product and inquiry data are persisted in Supabase; cart contents persist in the customer’s browser. Custom reference images are stored as a local-safe data URL fallback inside the inquiry record, so the flow works without separate storage configuration.
