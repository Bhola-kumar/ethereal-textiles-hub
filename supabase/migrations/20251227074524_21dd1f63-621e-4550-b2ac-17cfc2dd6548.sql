-- Add auto-confirmation settings to shops table
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS auto_confirm_orders boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_confirm_hours integer DEFAULT 24;

-- Add decline reason and declined_at to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS decline_reason text,
ADD COLUMN IF NOT EXISTS declined_at timestamp with time zone;

-- Create function to notify customer about declined order
CREATE OR REPLACE FUNCTION public.notify_order_declined()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only notify if status changed to cancelled and there's a decline reason
  IF NEW.status = 'cancelled' AND NEW.decline_reason IS NOT NULL AND OLD.status != 'cancelled' THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      'Order #' || NEW.order_number || ' Declined',
      'Your order has been declined. Reason: ' || NEW.decline_reason || '. Please contact the seller for payment reversal.',
      'warning',
      '/my-orders'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for declined orders
DROP TRIGGER IF EXISTS on_order_declined ON public.orders;
CREATE TRIGGER on_order_declined
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_order_declined();