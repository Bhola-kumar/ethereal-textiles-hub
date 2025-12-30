-- Drop the problematic policies causing infinite recursion
DROP POLICY IF EXISTS "Sellers can view orders with their products" ON public.orders;
DROP POLICY IF EXISTS "Sellers can update orders with their products" ON public.orders;

-- Create a security definer function to check if user is seller for an order
-- This avoids RLS recursion by bypassing RLS checks
CREATE OR REPLACE FUNCTION public.is_seller_for_order(_order_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = _order_id
    AND p.seller_id = _user_id
  )
$$;

-- Recreate policies using the security definer function
CREATE POLICY "Sellers can view orders with their products"
ON public.orders
FOR SELECT
USING (public.is_seller_for_order(id, auth.uid()));

CREATE POLICY "Sellers can update orders with their products"
ON public.orders
FOR UPDATE
USING (public.is_seller_for_order(id, auth.uid()));