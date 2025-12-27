-- Create table for home page section configuration
CREATE TABLE public.home_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key text NOT NULL UNIQUE,
  section_name text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.home_sections ENABLE ROW LEVEL SECURITY;

-- Anyone can view home sections
CREATE POLICY "Anyone can view home sections"
ON public.home_sections
FOR SELECT
USING (true);

-- Only admins can manage home sections
CREATE POLICY "Admins can manage home sections"
ON public.home_sections
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default sections
INSERT INTO public.home_sections (section_key, section_name, display_order, is_visible) VALUES
  ('hero', 'Hero Banner', 1, true),
  ('categories', 'Shop by Category', 2, true),
  ('sellers', 'Shop by Sellers', 3, true),
  ('trending', 'Trending Now', 4, true),
  ('featured_collections', 'Featured Collections', 5, true),
  ('new_arrivals', 'New Arrivals', 6, true),
  ('featured_products', 'Featured Products', 7, true),
  ('trust_badges', 'Trust Badges', 8, true);

-- Add trigger for updated_at
CREATE TRIGGER update_home_sections_updated_at
BEFORE UPDATE ON public.home_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();