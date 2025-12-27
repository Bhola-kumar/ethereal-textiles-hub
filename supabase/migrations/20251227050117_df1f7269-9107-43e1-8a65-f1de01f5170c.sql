-- Add new columns for payment QR and charges settings
ALTER TABLE public.shops
ADD COLUMN IF NOT EXISTS shipping_charge numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS gst_percentage numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS convenience_charge numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS free_shipping_above numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS charge_gst boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS charge_convenience boolean DEFAULT false;