-- Create featured_collections table for admin-managed promotional banners
CREATE TABLE public.featured_collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  image_url TEXT,
  link_url TEXT NOT NULL DEFAULT '/products',
  link_text TEXT NOT NULL DEFAULT 'Explore Collection',
  badge_text TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.featured_collections ENABLE ROW LEVEL SECURITY;

-- Admin can manage all collections
CREATE POLICY "Admins can manage featured collections" 
ON public.featured_collections 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view active collections
CREATE POLICY "Anyone can view active featured collections" 
ON public.featured_collections 
FOR SELECT 
USING (is_active = true AND (end_date IS NULL OR end_date > now()));

-- Add trigger for updated_at
CREATE TRIGGER update_featured_collections_updated_at
BEFORE UPDATE ON public.featured_collections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();