-- Fix shops_public view to allow public access
DROP VIEW IF EXISTS public.shops_public;

CREATE VIEW public.shops_public
WITH (security_invoker = false)
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

GRANT SELECT ON public.shops_public TO anon;
GRANT SELECT ON public.shops_public TO authenticated;

-- Fix shops_payment_public view similarly for checkout
DROP VIEW IF EXISTS public.shops_payment_public;

CREATE VIEW public.shops_payment_public
WITH (security_invoker = false)
AS
SELECT 
    id,
    seller_id,
    shop_name,
    shop_slug,
    is_active,
    is_verified,
    upi_id,
    payment_qr_url,
    payment_instructions,
    accepts_cod,
    shipping_charge,
    free_shipping_above,
    charge_gst,
    gst_percentage,
    charge_convenience,
    convenience_charge
FROM shops
WHERE is_active = true;

GRANT SELECT ON public.shops_payment_public TO anon;
GRANT SELECT ON public.shops_payment_public TO authenticated;