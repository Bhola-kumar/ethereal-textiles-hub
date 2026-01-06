-- Fix the security definer view issue by setting security_invoker
DROP VIEW IF EXISTS public.shops_payment_public;

CREATE VIEW public.shops_payment_public 
WITH (security_invoker = on)
AS
SELECT 
  id,
  seller_id,
  shop_name,
  shop_slug,
  is_active,
  is_verified,
  accepts_cod,
  upi_id,
  payment_qr_url,
  payment_instructions,
  shipping_charge,
  free_shipping_above,
  charge_gst,
  gst_percentage,
  charge_convenience,
  convenience_charge,
  bank_account_name,
  bank_account_number,
  bank_ifsc
FROM shops
WHERE is_active = true;