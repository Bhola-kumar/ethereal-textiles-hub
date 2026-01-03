-- Add deliverable_pincodes column to products table
ALTER TABLE public.products ADD COLUMN deliverable_pincodes text[] DEFAULT NULL;

-- Update the products_with_shop view to include deliverable_pincodes
DROP VIEW IF EXISTS public.products_with_shop;

CREATE VIEW public.products_with_shop AS
SELECT 
  p.id,
  p.name,
  p.slug,
  p.description,
  p.images,
  p.fabric,
  p.color,
  p.pattern,
  p.care_instructions,
  p.size,
  p.available_colors,
  p.available_sizes,
  p.price,
  p.original_price,
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
  p.deliverable_pincodes,
  s.id as shop_id,
  s.shop_name,
  s.shop_slug,
  s.logo_url as shop_logo_url,
  s.is_verified as shop_is_verified,
  s.city as shop_city,
  s.state as shop_state
FROM products p
LEFT JOIN shops s ON p.seller_id = s.seller_id;