# Knockout Sports Wear

Knockout Sports Wear storefront — Next.js App Router, React, Tailwind CSS 4, and Supabase.

## Run locally

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` using the Supabase project's API settings. Never put a Supabase service-role key in a `NEXT_PUBLIC_` variable; this application does not need one.

## Set up Supabase

1. Create a Supabase project.
2. Apply [`supabase/migrations/202611060001_initial_schema.sql`](./supabase/migrations/202611060001_initial_schema.sql), [`supabase/migrations/202611070001_storefront_cms.sql`](./supabase/migrations/202611070001_storefront_cms.sql), [`supabase/migrations/202611080001_product_catalog_enhancements.sql`](./supabase/migrations/202611080001_product_catalog_enhancements.sql), [`supabase/migrations/202611080002_knockout_rebrand.sql`](./supabase/migrations/202611080002_knockout_rebrand.sql), and [`supabase/migrations/202611080003_checkout_hardening.sql`](./supabase/migrations/202611080003_checkout_hardening.sql), in order in the Supabase SQL Editor. The migrations create the commerce schema, CMS content and media bucket, enhanced product gallery/options/inventory support, update saved storefront branding, and harden checkout with delivery-address storage and idempotent order creation. If earlier migrations were already applied, run only the unapplied migration(s); do not rerun an applied migration.
3. Configure the two environment variables above in local development and your hosting provider, then redeploy.
4. Create an Auth user for each staff member in Supabase Authentication. Assign administrator access to the intended account using the Supabase SQL Editor:

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
   where email = 'staff@example.com';
   ```

   Sign out and back in after changing the role. Do not assign this role from user-editable metadata.

5. Sign in at `/admin`. The Collections section lets staff create, edit, order, and publish collections. Product management loads ten products at a time, supports multiple uploaded images and a selectable main image, and manages descriptions, sizes, colours, optional stock, PKR price, collection, and publication status. The Storefront Pages section manages home, about, shop, and contact copy, SEO descriptions, hero/banner images, brand/logo, navigation, social links, and footer content.
6. To display footer social icons or the floating WhatsApp contact button, enter official profile URLs and the WhatsApp number (including its country code) in **Admin → Storefront pages & site settings → Brand, navigation & footer**. Unconfigured profiles and the WhatsApp button remain hidden; no example contact details are published.

## Store behavior

- `/shop` displays active products managed in the admin area. Each product has a unique `/shop/[slug]` detail page, with its gallery, sizes, colours, price, and stock status. All product pricing is in PKR.
- Checkout validates customer contact details and delivery address, recalculates PKR prices and stock in the database, and creates orders atomically with product-name/price snapshots and selected options. A retry of the same checkout request cannot create or reserve a duplicate order. Products with a numeric stock quantity reserve inventory when ordered and release it if the order is cancelled; leave stock blank for made-to-order products. The site does **not** collect payment, enable Cash on Delivery, apply discounts, or calculate shipping. Staff must confirm the invoice/payment and delivery arrangements with the customer; the checkout subtotal is for items only.
- `/contact` stores quote requests. Optional JPG, PNG, and WebP designs (up to 4 MB) are kept in private Supabase Storage; staff access them through expiring admin-only links.
- Storefront collections and published products are read from Supabase; the shop can filter products by collection. CMS page content is public-readable and admin-writable under RLS. Storefront images use the public `storefront-media` bucket and can be uploaded from the admin panel.
- `/admin` requires a Supabase Auth account whose trusted `app_metadata.role` is `admin`. Row-level security protects products, customers, orders, quote requests, and attachments.

## Before launch

Set product prices, shipping rules, and the payment provider before enabling online payment or promising delivery charges. Product prices are stored in PKR. Configure Supabase Auth email delivery, database backups, and your privacy/retention policy for customer contact details and design files. Review Supabase logs and apply all pending SQL migrations to the intended project before opening the site to customers.

## Project layout

`src/app/` contains storefront, admin, and API routes; `src/components/` contains shared UI; `src/lib/supabase/` contains database clients and configuration; `supabase/migrations/` contains the database schema and security policies.
