-- Ensure the public shops view bypasses RLS on the underlying shops table.
-- The view is safe because it exposes only non-sensitive columns.

ALTER VIEW public.shops_public SET (security_invoker = off);

-- Ensure API roles can read the view
GRANT SELECT ON public.shops_public TO anon, authenticated;