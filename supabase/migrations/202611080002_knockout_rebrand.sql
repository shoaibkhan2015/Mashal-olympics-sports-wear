update public.storefront_content
set content = replace(
  replace(content::text, 'Mashal Olympics Sports Wear', 'Knockout Sports Wear'),
  'Mashal Olympics',
  'Knockout Sports'
)::jsonb;

update public.storefront_content
set content = content || jsonb_build_object(
  'seo_title', 'Knockout Sports Wear | Custom Sportswear & Martial Arts Uniforms',
  'hero_title', 'Knockout',
  'hero_highlight', 'Sports',
  'hero_subtitle', 'Wear'
)
where content_key = 'home';

update public.storefront_content
set content = content || jsonb_build_object(
  'seo_title', 'About Us | Knockout Sports Wear',
  'seo_description', 'Knockout Sports Wear makes custom sportswear and martial arts uniforms for teams, clubs and athletes.',
  'title', 'Built for',
  'highlight', 'Every Match',
  'description', 'Knockout Sports Wear creates custom sportswear and martial arts uniforms designed around your team, your sport, and your identity.'
)
where content_key = 'about';

update public.storefront_content
set content = (content - 'whatsapp_url') || jsonb_build_object(
  'brand_name', 'Knockout Sports Wear',
  'logo_url', '/knockout-logo.webp',
  'instagram_url', '',
  'facebook_url', '',
  'tiktok_url', '',
  'whatsapp_number', ''
)
where content_key = 'site';

update public.storefront_content
set content = content || jsonb_build_object(
  'seo_title', 'Shop | Knockout Sports Wear'
)
where content_key = 'shop';

update public.storefront_content
set content = content || jsonb_build_object(
  'seo_title', 'Custom Order & Quote | Knockout Sports Wear'
)
where content_key = 'contact';

notify pgrst, 'reload schema';
