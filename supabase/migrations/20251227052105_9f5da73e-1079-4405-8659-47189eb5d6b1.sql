-- Update the notify_order_status_change function to use correct route
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  status_text TEXT;
  order_user_id UUID;
BEGIN
  -- Get the order user_id
  order_user_id := NEW.user_id;
  
  -- Only notify if status actually changed and user_id exists
  IF OLD.status IS DISTINCT FROM NEW.status AND order_user_id IS NOT NULL THEN
    CASE NEW.status
      WHEN 'confirmed' THEN status_text := 'Your order has been confirmed!';
      WHEN 'packed' THEN status_text := 'Your order has been packed and is ready for shipping.';
      WHEN 'shipped' THEN status_text := 'Your order has been shipped! Track it with ID: ' || COALESCE(NEW.tracking_id, 'Pending');
      WHEN 'out_for_delivery' THEN status_text := 'Your order is out for delivery today!';
      WHEN 'delivered' THEN status_text := 'Your order has been delivered. Enjoy!';
      WHEN 'cancelled' THEN status_text := 'Your order has been cancelled.';
      WHEN 'returned' THEN status_text := 'Your return request has been processed.';
      ELSE status_text := 'Your order status has been updated to: ' || NEW.status;
    END CASE;
    
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      order_user_id,
      'Order #' || NEW.order_number || ' Update',
      status_text,
      CASE WHEN NEW.status IN ('delivered') THEN 'success'
           WHEN NEW.status IN ('cancelled', 'returned') THEN 'warning'
           ELSE 'info' END,
      '/orders'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;