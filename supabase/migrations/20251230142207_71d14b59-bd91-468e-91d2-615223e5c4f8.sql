-- Add new product fields for dimensions and variants
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS length numeric NULL,
ADD COLUMN IF NOT EXISTS width numeric NULL,
ADD COLUMN IF NOT EXISTS gsm integer NULL,
ADD COLUMN IF NOT EXISTS size text NULL,
ADD COLUMN IF NOT EXISTS available_colors text[] NULL,
ADD COLUMN IF NOT EXISTS available_sizes text[] NULL;

-- Add comments for clarity
COMMENT ON COLUMN public.products.length IS 'Product length in cm';
COMMENT ON COLUMN public.products.width IS 'Product width in cm';
COMMENT ON COLUMN public.products.gsm IS 'Grams per square meter (fabric weight)';
COMMENT ON COLUMN public.products.size IS 'Primary size of the product';
COMMENT ON COLUMN public.products.available_colors IS 'Array of available color options';
COMMENT ON COLUMN public.products.available_sizes IS 'Array of available size options';