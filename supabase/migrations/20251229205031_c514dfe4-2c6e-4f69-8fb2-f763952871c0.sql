-- Remove the overly permissive policy that exposes all shop columns publicly
DROP POLICY IF EXISTS "Anyone can view active shops public info" ON public.shops;

-- The shops table should only be accessible to:
-- 1. Admins (already has "Admins can manage all shops")
-- 2. Sellers for their own shop (already has "Sellers can view their own shop")

-- Public access to shop data should only be through the secure views:
-- - shops_public (for general shop info - name, description, logo, etc.)
-- - shops_payment_public (for checkout - UPI, COD, shipping charges)

-- These views already exist and expose only necessary non-sensitive fields