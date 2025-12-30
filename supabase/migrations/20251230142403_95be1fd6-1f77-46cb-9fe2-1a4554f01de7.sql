-- Update the products_with_shop view to include new product fields
DROP VIEW IF EXISTS public.products_with_shop;

CREATE OR REPLACE VIEW public.products_with_shop 
WITH (security_invoker = false)
AS
SELECT 
  p.id,
  p.name,
  p.slug,
  p.description,
  p.price,
  p.original_price,
  p.images,
  p.fabric,
  p.color,
  p.pattern,
  p.care_instructions,
  p.stock,
  p.is_published,
  p.is_new,
  p.is_trending,
  p.rating,
  p.reviews_count,
  p.category_id,
  p.seller_id,
  p.created_at,
  p.updated_at,
  p.length,
  p.width,
  p.gsm,
  p.size,
  p.available_colors,
  p.available_sizes,
  s.id as shop_id,
  s.shop_name,
  s.shop_slug,
  s.logo_url as shop_logo_url,
  s.is_verified as shop_is_verified,
  s.city as shop_city,
  s.state as shop_state
FROM products p
JOIN shops s ON p.seller_id = s.seller_id
WHERE s.is_active = true;