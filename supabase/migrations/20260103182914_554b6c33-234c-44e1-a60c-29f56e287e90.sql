-- Fix Security Definer View issue for shops_public and shops_payment_public
ALTER VIEW public.shops_public SET (security_invoker = true);
ALTER VIEW public.shops_payment_public SET (security_invoker = true);