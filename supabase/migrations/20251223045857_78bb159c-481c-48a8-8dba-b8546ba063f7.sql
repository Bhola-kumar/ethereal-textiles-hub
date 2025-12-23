-- Add payment method fields to shops table for direct seller-customer payments
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS upi_id text,
ADD COLUMN IF NOT EXISTS payment_qr_url text,
ADD COLUMN IF NOT EXISTS accepts_cod boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS payment_instructions text;