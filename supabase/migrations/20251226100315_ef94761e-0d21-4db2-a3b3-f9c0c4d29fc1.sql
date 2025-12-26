-- Create a view that joins products with shops to only show products from active shops
CREATE OR REPLACE VIEW public.products_with_shop AS
SELECT 
  p.*,
  s.id as shop_id,
  s.shop_name,
  s.shop_slug,
  s.logo_url as shop_logo_url,
  s.is_verified as shop_is_verified,
  s.city as shop_city,
  s.state as shop_state
FROM public.products p
INNER JOIN public.shops s ON p.seller_id = s.seller_id
WHERE s.is_active = true AND p.is_published = true;

-- Grant access to the view
GRANT SELECT ON public.products_with_shop TO anon, authenticated;