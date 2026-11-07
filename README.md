# Mashal Olympics Sports Wear

Custom sportswear storefront — Next.js App Router, React, Tailwind CSS 4, and Supabase.

## Run locally

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` using the Supabase project's API settings. Never put a Supabase service-role key in a `NEXT_PUBLIC_` variable; this application does not need one.

## Set up Supabase

1. Create a Supabase project.
2. Apply [`supabase/migrations/202611060001_initial_schema.sql`](./supabase/migrations/202611060001_initial_schema.sql), then [`supabase/migrations/202611070001_storefront_cms.sql`](./supabase/migrations/202611070001_storefront_cms.sql), in order in the Supabase SQL Editor. The first migration creates the commerce schema and existing sportswear categories. The second adds CMS content, editable storefront settings, and the public media bucket. If the first migration was already applied, apply **only the second migration**; don’t rerun the first.
3. Configure the two environment variables above in local development and your hosting provider, then redeploy.
4. Create an Auth user for each staff member in Supabase Authentication. Assign administrator access to the intended account using the Supabase SQL Editor:

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
   where email = 'staff@example.com';
   ```

   Sign out and back in after changing the role. Do not assign this role from user-editable metadata.

5. Sign in at `/admin`. The Collections section lets staff create, edit, order, and publish collections. Products can be edited in full, including image, description, collection, price, and publication status. The Storefront Pages section manages home, about, shop, and contact copy, SEO descriptions, hero/banner images, brand/logo, navigation, social links, and footer content.

## Store behavior

- `/shop` displays active products managed in the admin area. Product prices and currency are set per item; checkout blocks mixed currencies.
- Orders are created atomically in the database with server-side prices, product-name/price snapshots, and an `unpaid` status. The site does **not** collect payment online or calculate shipping. Staff must confirm the invoice/payment and delivery arrangements with the customer.
- `/contact` stores quote requests. Optional JPG, PNG, and WebP designs (up to 4 MB) are kept in private Supabase Storage; staff access them through expiring admin-only links.
- Storefront collections and published products are read from Supabase; the shop can filter products by collection. CMS page content is public-readable and admin-writable under RLS. Storefront images use the public `storefront-media` bucket and can be uploaded from the admin panel.
- `/admin` requires a Supabase Auth account whose trusted `app_metadata.role` is `admin`. Row-level security protects products, customers, orders, quote requests, and attachments.

## Before launch

Set the real currency/prices, shipping rules, and payment provider before enabling online payment or promising delivery charges. Configure Supabase Auth email delivery, database backups, and your privacy/retention policy for customer contact details and design files. Review Supabase logs and deploy the SQL migration to the intended project before opening the site to customers.

## Project layout

`src/app/` contains storefront, admin, and API routes; `src/components/` contains shared UI; `src/lib/supabase/` contains database clients and configuration; `supabase/migrations/` contains the database schema and security policies.
