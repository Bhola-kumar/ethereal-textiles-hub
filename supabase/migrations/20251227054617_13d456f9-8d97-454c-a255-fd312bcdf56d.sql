-- Create a public view for shop payment info that customers can access during checkout
CREATE OR REPLACE VIEW public.shops_payment_public AS
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
FROM public.shops
WHERE is_active = true;