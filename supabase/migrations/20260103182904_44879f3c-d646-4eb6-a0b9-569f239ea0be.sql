-- Fix Security Definer View issue by setting security_invoker = true
ALTER VIEW public.products_with_shop SET (security_invoker = true);