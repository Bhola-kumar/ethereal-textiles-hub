
-- Create promo_codes table
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  min_order_amount NUMERIC DEFAULT 0,
  max_discount_amount NUMERIC,
  max_uses INTEGER,
  uses_count INTEGER NOT NULL DEFAULT 0,
  max_uses_per_user INTEGER DEFAULT 1,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  seller_id UUID,
  applies_to TEXT NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all', 'seller_products')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create promo_code_uses table to track usage
CREATE TABLE public.promo_code_uses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  discount_applied NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add promo_code_id to orders table
ALTER TABLE public.orders ADD COLUMN promo_code_id UUID REFERENCES public.promo_codes(id);
ALTER TABLE public.orders ADD COLUMN promo_discount NUMERIC DEFAULT 0;

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_uses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for promo_codes
CREATE POLICY "Admins can manage all promo codes" 
ON public.promo_codes 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sellers can create their own promo codes" 
ON public.promo_codes 
FOR INSERT 
WITH CHECK (auth.uid() = created_by AND auth.uid() = seller_id AND has_role(auth.uid(), 'seller'::app_role));

CREATE POLICY "Sellers can view their own promo codes" 
ON public.promo_codes 
FOR SELECT 
USING (auth.uid() = seller_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sellers can update their own promo codes" 
ON public.promo_codes 
FOR UPDATE 
USING (auth.uid() = seller_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sellers can delete their own promo codes" 
ON public.promo_codes 
FOR DELETE 
USING (auth.uid() = seller_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active promo codes for validation" 
ON public.promo_codes 
FOR SELECT 
USING (is_active = true AND (end_date IS NULL OR end_date > now()) AND start_date <= now());

-- RLS Policies for promo_code_uses
CREATE POLICY "Admins can view all promo code uses" 
ON public.promo_code_uses 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sellers can view uses of their promo codes" 
ON public.promo_code_uses 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM promo_codes pc 
  WHERE pc.id = promo_code_uses.promo_code_id 
  AND pc.seller_id = auth.uid()
));

CREATE POLICY "Users can create promo code uses" 
ON public.promo_code_uses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own promo code uses" 
ON public.promo_code_uses 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX idx_promo_codes_seller_id ON public.promo_codes(seller_id);
CREATE INDEX idx_promo_codes_active ON public.promo_codes(is_active, start_date, end_date);
CREATE INDEX idx_promo_code_uses_promo_code_id ON public.promo_code_uses(promo_code_id);
CREATE INDEX idx_promo_code_uses_user_id ON public.promo_code_uses(user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_promo_codes_updated_at
BEFORE UPDATE ON public.promo_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to validate and apply promo code
CREATE OR REPLACE FUNCTION public.validate_promo_code(
  p_code TEXT,
  p_user_id UUID,
  p_subtotal NUMERIC,
  p_seller_ids UUID[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_promo promo_codes%ROWTYPE;
  v_user_uses INTEGER;
  v_discount NUMERIC;
  v_applicable_subtotal NUMERIC := p_subtotal;
BEGIN
  -- Find the promo code
  SELECT * INTO v_promo
  FROM promo_codes
  WHERE UPPER(code) = UPPER(p_code)
    AND is_active = true
    AND start_date <= now()
    AND (end_date IS NULL OR end_date > now());
  
  IF v_promo IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid or expired promo code');
  END IF;
  
  -- Check max uses
  IF v_promo.max_uses IS NOT NULL AND v_promo.uses_count >= v_promo.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Promo code has reached maximum uses');
  END IF;
  
  -- Check user usage limit
  SELECT COUNT(*) INTO v_user_uses
  FROM promo_code_uses
  WHERE promo_code_id = v_promo.id AND user_id = p_user_id;
  
  IF v_promo.max_uses_per_user IS NOT NULL AND v_user_uses >= v_promo.max_uses_per_user THEN
    RETURN jsonb_build_object('valid', false, 'error', 'You have already used this promo code');
  END IF;
  
  -- Check if seller-specific and applicable
  IF v_promo.applies_to = 'seller_products' AND v_promo.seller_id IS NOT NULL THEN
    IF NOT (v_promo.seller_id = ANY(p_seller_ids)) THEN
      RETURN jsonb_build_object('valid', false, 'error', 'This promo code is not applicable to items in your cart');
    END IF;
  END IF;
  
  -- Check minimum order amount
  IF v_promo.min_order_amount IS NOT NULL AND p_subtotal < v_promo.min_order_amount THEN
    RETURN jsonb_build_object(
      'valid', false, 
      'error', 'Minimum order amount of ₹' || v_promo.min_order_amount || ' required'
    );
  END IF;
  
  -- Calculate discount
  IF v_promo.discount_type = 'percentage' THEN
    v_discount := v_applicable_subtotal * (v_promo.discount_value / 100);
    IF v_promo.max_discount_amount IS NOT NULL AND v_discount > v_promo.max_discount_amount THEN
      v_discount := v_promo.max_discount_amount;
    END IF;
  ELSE
    v_discount := v_promo.discount_value;
  END IF;
  
  -- Ensure discount doesn't exceed subtotal
  IF v_discount > v_applicable_subtotal THEN
    v_discount := v_applicable_subtotal;
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true,
    'promo_code_id', v_promo.id,
    'code', v_promo.code,
    'discount', v_discount,
    'discount_type', v_promo.discount_type,
    'discount_value', v_promo.discount_value,
    'description', v_promo.description
  );
END;
$$;
