-- Create shops table for seller store information
CREATE TABLE public.shops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL UNIQUE,
  shop_name TEXT NOT NULL,
  shop_slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  gst_number TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  bank_ifsc TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

-- Sellers can view their own shop
CREATE POLICY "Sellers can view their own shop"
ON public.shops
FOR SELECT
USING (auth.uid() = seller_id);

-- Sellers can create their own shop
CREATE POLICY "Sellers can create their own shop"
ON public.shops
FOR INSERT
WITH CHECK (auth.uid() = seller_id);

-- Sellers can update their own shop
CREATE POLICY "Sellers can update their own shop"
ON public.shops
FOR UPDATE
USING (auth.uid() = seller_id);

-- Anyone can view active verified shops (for public shop pages)
CREATE POLICY "Anyone can view active shops"
ON public.shops
FOR SELECT
USING (is_active = true);

-- Admins can manage all shops
CREATE POLICY "Admins can manage all shops"
ON public.shops
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updating updated_at
CREATE TRIGGER update_shops_updated_at
BEFORE UPDATE ON public.shops
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();