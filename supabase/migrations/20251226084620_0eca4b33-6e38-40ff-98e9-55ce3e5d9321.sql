-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Anyone can view active shops" ON public.shops;

-- Create a secure view that only exposes non-sensitive shop information
CREATE OR REPLACE VIEW public.shops_public AS
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
FROM public.shops
WHERE is_active = true;

-- Grant access to the public view
GRANT SELECT ON public.shops_public TO anon, authenticated;

-- Now the shops table only allows:
-- 1. Sellers to view/manage their own shop (existing policies)
-- 2. Admins to manage all shops (existing policy)
-- No public access to sensitive fields like bank details, UPI, GST, phone, email