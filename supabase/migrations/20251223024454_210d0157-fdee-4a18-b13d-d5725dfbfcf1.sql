-- Create notifications table for order updates
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- System can create notifications (via service role)
CREATE POLICY "System can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to notify on order status change
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
      '/my-orders'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for order status notifications
CREATE TRIGGER on_order_status_change
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_order_status_change();