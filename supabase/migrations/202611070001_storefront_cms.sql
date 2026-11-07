create table public.storefront_content (
  content_key text primary key check (content_key in ('home', 'about', 'site', 'shop', 'contact')),
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create trigger storefront_content_updated_at before update on public.storefront_content
for each row execute function public.set_updated_at();

alter table public.storefront_content enable row level security;

create policy "Public can read storefront content"
on public.storefront_content for select to anon, authenticated
using (true);

create policy "Admins can manage storefront content"
on public.storefront_content for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

grant select on public.storefront_content to anon, authenticated;
grant insert, update, delete on public.storefront_content to authenticated;

insert into public.storefront_content (content_key, content) values
('home', '{
  "seo_title":"Mashal Olympics Sports Wear | Custom Sportswear & Martial Arts Uniforms",
  "seo_description":"Custom sports shorts, shirts, tank tops, gym wear, tracksuits, football kits and martial arts uniforms made to your design.",
  "hero_eyebrow":"Custom Sportswear Manufacturer",
  "hero_title":"Mashal",
  "hero_highlight":"Olympics",
  "hero_subtitle":"Sports Wear",
  "hero_description":"Shorts, shirts, tank tops, gym wear, tracksuits, football kits and martial arts uniforms — every piece stitched to your design, your colors, your team.",
  "hero_image":"",
  "primary_button":"Explore Collection",
  "secondary_button":"Custom Order",
  "collections_eyebrow":"What We Make",
  "collections_title":"Every Sport.",
  "collections_highlight":"Every Design.",
  "cta_title":"Your Team.",
  "cta_highlight":"Your Kit.",
  "cta_description":"Send us your design or idea and get a quote with pricing and delivery time — no obligation.",
  "cta_button":"Start Your Order",
  "collection_cta":"Get Quote",
  "gallery_heading":"Scroll — the lineup rotates",
  "design_eyebrow":"Made To Order",
  "design_title":"Customize",
  "design_highlight":"Your Design",
  "design_description":"Upload your design or logo, pick the product you want it on, and we’ll get back to you with a quote.",
  "design_upload_title":"Upload Your Design",
  "design_upload_description":"Drag & drop an image here, or click to browse — logo, sketch or a photo of your idea (JPG / PNG).",
  "design_category_title":"Pick A Category",
  "design_category_prompt":"What should we make it on?",
  "design_button":"Request A Quote",
  "feature_1_title":"Fully Custom",
  "feature_1_text":"Your colors, logos, names and numbers — sublimation, embroidery and printing under one roof.",
  "feature_2_title":"Low Minimums",
  "feature_2_text":"From single kits to full team orders, we produce the quantity your club needs.",
  "feature_3_title":"Competition Grade",
  "feature_3_text":"Fabric and cuts built for taekwondo, wushu, karate and football.",
  "feature_4_title":"Fast Dispatch",
  "feature_4_text":"Streamlined production and dispatch so your kit arrives before match day."
}'::jsonb),
('about', '{
  "seo_title":"About Us | Mashal Olympics Sports Wear",
  "seo_description":"Mashal Olympics Sports Wear manufactures custom sportswear and martial arts uniforms for teams, clubs and athletes.",
  "eyebrow":"Our Story",
  "title":"The Torch Behind",
  "highlight":"Every Kit",
  "description":"Mashal means torch — the light athletes walk out behind. We make the gear they walk out in.",
  "banner_image":"",
  "cta_title":"Ready When",
  "cta_highlight":"You Are",
  "cta_button":"Start Your Order",
  "stats":[{"value":"10+","label":"Product Lines"},{"value":"100%","label":"Made to Order"},{"value":"1 Roof","label":"Cut, Stitch & Print"}],
  "values":[
    {"title":"Made Around Your Design","text":"Nothing off the shelf unless you want it. Send a sketch, a photo or just your club colors — our team turns it into a production-ready kit."},
    {"title":"Sport-Specific Craft","text":"A taekwondo dobok, a wushu satin set and a football kit all demand different fabric, cut and finish. We build each one the way its sport needs."},
    {"title":"Built for Match Day","text":"Reinforced stitching, color-fast sublimation and competition-appropriate weights, so your kit performs as hard as you do."}
  ]
}'::jsonb),
('site', '{
  "nav_home":"Home",
  "nav_shop":"Shop",
  "nav_about":"About",
  "nav_contact":"Contact",
  "brand_name":"Mashal Olympics Sports Wear",
  "logo_url":"",
  "footer_text":"Custom sportswear and martial arts uniforms — stitched, sublimated and finished to your team’s design.",
  "header_cta":"Custom Order",
  "phone":"",
  "email":"",
  "instagram_url":"",
  "whatsapp_url":"",
  "show_about":true,
  "show_contact":true,
  "footer_shop_heading":"Shop",
  "footer_company_heading":"Company",
  "footer_quote_heading":"Get a Quote",
  "footer_all_products":"All Products",
  "footer_about":"About Us",
  "footer_custom_orders":"Custom Orders",
  "footer_team_quotes":"Team & Club Quotes",
  "footer_quote_text":"Send us your design, logo or team list and we’ll come back with pricing and delivery time.",
  "footer_quote_cta":"Start Inquiry"
}'::jsonb),
('shop', '{
  "seo_title":"Shop | Mashal Olympics Sports Wear",
  "seo_description":"Browse custom sportswear and martial arts uniforms made to your team’s design.",
  "eyebrow":"The Collection",
  "title":"Shop",
  "highlight":"All Products",
  "description":"Every item is made to order — pick a product, send us your design, logo and sizes, and we handle the rest.",
  "collection_cta":"Get Quote",
  "collection_badge":"Made to Order"
}'::jsonb),
('contact', '{
  "seo_title":"Custom Order & Quote | Mashal Olympics Sports Wear",
  "seo_description":"Request a quote for custom sportswear and martial arts uniforms.",
  "eyebrow":"Get a Quote",
  "title":"Custom",
  "highlight":"Order",
  "description":"Tell us what you need — product, design, quantities — and we’ll reply with pricing and delivery time.",
  "steps_title":"What Happens Next",
  "step_1":"We review your design and confirm fabric, colors and sizing.",
  "step_2":"You get a quote with price per piece and delivery time.",
  "step_3":"Approve a digital sample, then we cut, stitch and ship.",
  "side_title":"Not Sure Yet?",
  "side_description":"Browse the collection first — every product page links back here with the item pre-noted.",
  "side_button":"View Collection"
}'::jsonb)
on conflict (content_key) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('storefront-media', 'storefront-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

create policy "Public can view storefront media"
on storage.objects for select to anon, authenticated
using (bucket_id = 'storefront-media');

create policy "Admins can upload storefront media"
on storage.objects for insert to authenticated
with check (bucket_id = 'storefront-media' and (select public.is_admin()));

create policy "Admins can update storefront media"
on storage.objects for update to authenticated
using (bucket_id = 'storefront-media' and (select public.is_admin()))
with check (bucket_id = 'storefront-media' and (select public.is_admin()));

create policy "Admins can delete storefront media"
on storage.objects for delete to authenticated
using (bucket_id = 'storefront-media' and (select public.is_admin()));
