-- Drop existing views and recreate with security_invoker=true
DROP VIEW IF EXISTS public.products_with_shop;
DROP VIEW IF EXISTS public.shops_public;
DROP VIEW IF EXISTS public.shops_payment_public;

-- Recreate products_with_shop view with security_invoker=true (SECURITY INVOKER)
CREATE VIEW public.products_with_shop
WITH (security_invoker = true)
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

-- Recreate shops_public view with security_invoker=true
CREATE VIEW public.shops_public
WITH (security_invoker = true)
AS
SELECT 
    id,
    shop_name,
    shop_slug,
    description,
    logo_url,
    banner_url,
    city,
    state,
    is_verified,
    is_active,
    created_at
FROM shops
WHERE is_active = true;

-- Recreate shops_payment_public view with security_invoker=true
CREATE VIEW public.shops_payment_public
WITH (security_invoker = true)
AS
SELECT 
    id,
    seller_id,
    shop_name,
    shop_slug,
    upi_id,
    payment_qr_url,
    payment_instructions,
    accepts_cod,
    shipping_charge,
    free_shipping_above,
    gst_percentage,
    charge_gst,
    convenience_charge,
    charge_convenience,
    is_active,
    is_verified
FROM shops
WHERE is_active = true;

-- Now add RLS policy to shops table to allow public read access for active shops
-- This ensures the views work correctly with security_invoker=true
CREATE POLICY "Anyone can view active shops public info"
ON public.shops
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Add policy for products to allow anyone to view published products
CREATE POLICY "Anyone can view published products for views"
ON public.products
FOR SELECT
TO anon
USING (is_published = true);