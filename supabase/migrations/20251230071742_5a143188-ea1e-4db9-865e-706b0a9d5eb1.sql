-- Drop and recreate products_with_shop view without security_invoker
-- This allows public users to see products from active shops
DROP VIEW IF EXISTS public.products_with_shop;

CREATE VIEW public.products_with_shop
WITH (security_invoker = false)
AS
SELECT 
    p.id,
    p.name,
    p.description,
    p.price,
    p.original_price,
    p.images,
    p.category_id,
    p.fabric,
    p.color,
    p.pattern,
    p.care_instructions,
    p.stock,
    p.is_new,
    p.is_trending,
    p.is_published,
    p.rating,
    p.reviews_count,
    p.slug,
    p.seller_id,
    p.created_at,
    p.updated_at,
    s.id AS shop_id,
    s.shop_name,
    s.shop_slug,
    s.logo_url AS shop_logo_url,
    s.is_verified AS shop_is_verified,
    s.city AS shop_city,
    s.state AS shop_state
FROM products p
JOIN shops s ON p.seller_id = s.seller_id
WHERE s.is_active = true AND p.is_published = true;

-- Grant select to anon and authenticated roles
GRANT SELECT ON public.products_with_shop TO anon;
GRANT SELECT ON public.products_with_shop TO authenticated;