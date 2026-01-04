-- Add pincode column to profiles table for delivery location
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pincode VARCHAR(6);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_pincode ON public.profiles(pincode);