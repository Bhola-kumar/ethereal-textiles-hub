-- Fix 1: Add RLS policy to allow sellers to view orders containing their products
CREATE POLICY "Sellers can view orders with their products"
ON public.orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = orders.id
    AND p.seller_id = auth.uid()
  )
);

-- Fix 2: Add RLS policy to allow sellers to update orders containing their products
CREATE POLICY "Sellers can update orders with their products"
ON public.orders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = orders.id
    AND p.seller_id = auth.uid()
  )
);

-- Fix 3: Add RLS policy for sellers to view order_items for their products
CREATE POLICY "Sellers can view order items for their products"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM products p
    WHERE p.id = order_items.product_id
    AND p.seller_id = auth.uid()
  )
);

-- Fix 4: Create a trigger to notify sellers when a new order is placed containing their products
CREATE OR REPLACE FUNCTION public.notify_seller_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seller_record RECORD;
  order_record RECORD;
BEGIN
  -- Get the order details
  SELECT order_number, id INTO order_record FROM orders WHERE id = NEW.order_id;
  
  -- Get the seller_id from the product
  SELECT seller_id INTO seller_record FROM products WHERE id = NEW.product_id;
  
  -- Only notify if we have a seller and order number
  IF seller_record.seller_id IS NOT NULL AND order_record.order_number IS NOT NULL THEN
    -- Insert notification for seller (use ON CONFLICT to avoid duplicates for same order/seller)
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      seller_record.seller_id,
      'New Order Received',
      'You have received a new order #' || order_record.order_number,
      'info',
      '/seller/orders'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger on order_items insert
DROP TRIGGER IF EXISTS trigger_notify_seller_new_order ON order_items;
CREATE TRIGGER trigger_notify_seller_new_order
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.notify_seller_new_order();