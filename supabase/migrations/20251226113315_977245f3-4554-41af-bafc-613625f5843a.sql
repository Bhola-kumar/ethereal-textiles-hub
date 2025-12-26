-- Create featured_product_requests table for seller requests
CREATE TABLE public.featured_product_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL,
  request_message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID
);

-- Create featured_products table for admin-managed featured products
CREATE TABLE public.featured_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  added_by UUID NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id)
);

-- Enable RLS
ALTER TABLE public.featured_product_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_products ENABLE ROW LEVEL SECURITY;

-- RLS for featured_product_requests
-- Sellers can view and create their own requests
CREATE POLICY "Sellers can view their own requests"
ON public.featured_product_requests
FOR SELECT
USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can create requests for their products"
ON public.featured_product_requests
FOR INSERT
WITH CHECK (
  auth.uid() = seller_id AND
  EXISTS (SELECT 1 FROM products WHERE id = product_id AND seller_id = auth.uid())
);

-- Admins can view and manage all requests
CREATE POLICY "Admins can view all requests"
ON public.featured_product_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update requests"
ON public.featured_product_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete requests"
ON public.featured_product_requests
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- RLS for featured_products
-- Anyone can view active featured products (for homepage display)
CREATE POLICY "Anyone can view active featured products"
ON public.featured_products
FOR SELECT
USING (is_active = true AND (end_date IS NULL OR end_date > now()));

-- Admins can manage all featured products
CREATE POLICY "Admins can manage featured products"
ON public.featured_products
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_featured_products_updated_at
BEFORE UPDATE ON public.featured_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Grant access to the view for displaying featured products
GRANT SELECT ON public.featured_products TO anon;
GRANT SELECT ON public.featured_products TO authenticated;