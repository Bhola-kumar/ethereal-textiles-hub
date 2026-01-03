-- Create order_chats table for customer-seller communication
CREATE TABLE public.order_chats (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('customer', 'seller')),
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_chats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for order_chats
CREATE POLICY "Users can view chats for their orders" ON public.order_chats
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_chats.order_id AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create chats for their orders" ON public.order_chats
FOR INSERT WITH CHECK (
  sender_type = 'customer' AND
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_chats.order_id AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update read status of their chats" ON public.order_chats
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_chats.order_id AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Sellers can view chats for their order products" ON public.order_chats
FOR SELECT USING (
  is_seller_for_order(order_chats.order_id, auth.uid())
);

CREATE POLICY "Sellers can create chats for their order products" ON public.order_chats
FOR INSERT WITH CHECK (
  sender_type = 'seller' AND
  sender_id = auth.uid() AND
  is_seller_for_order(order_chats.order_id, auth.uid())
);

CREATE POLICY "Sellers can update read status of their chats" ON public.order_chats
FOR UPDATE USING (
  is_seller_for_order(order_chats.order_id, auth.uid())
);

CREATE POLICY "Admins can manage all chats" ON public.order_chats
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for order_chats
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_chats;

-- Create function to notify seller on return request
CREATE OR REPLACE FUNCTION public.notify_seller_return_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  seller_record RECORD;
  order_record RECORD;
BEGIN
  -- Get the order details
  SELECT order_number, id INTO order_record FROM orders WHERE id = NEW.order_id;
  
  -- Get all sellers for this order
  FOR seller_record IN
    SELECT DISTINCT p.seller_id
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = NEW.order_id AND p.seller_id IS NOT NULL
  LOOP
    -- Insert notification for each seller
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      seller_record.seller_id,
      'Return Request Received',
      'A customer has requested a return for order #' || order_record.order_number || '. Reason: ' || NEW.reason,
      'warning',
      '/seller/orders'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger for return request notification to seller
DROP TRIGGER IF EXISTS on_return_request_created ON public.return_requests;
CREATE TRIGGER on_return_request_created
  AFTER INSERT ON public.return_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_seller_return_request();

-- Create function to notify customer on return request status update
CREATE OR REPLACE FUNCTION public.notify_customer_return_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  order_record RECORD;
  status_message TEXT;
BEGIN
  -- Only notify if status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Get order details
    SELECT order_number, user_id INTO order_record FROM orders WHERE id = NEW.order_id;
    
    -- Set status message
    CASE NEW.status
      WHEN 'approved' THEN status_message := 'Your return request has been approved. Please ship the item back.';
      WHEN 'rejected' THEN status_message := 'Your return request has been rejected. ' || COALESCE('Reason: ' || NEW.admin_notes, 'Contact support for details.');
      WHEN 'processing' THEN status_message := 'Your returned item is being processed.';
      WHEN 'completed' THEN status_message := 'Your return has been completed. Refund will be processed shortly.';
      ELSE status_message := 'Your return request status has been updated to: ' || NEW.status;
    END CASE;
    
    -- Insert notification for customer
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      order_record.user_id,
      'Return Request Update - Order #' || order_record.order_number,
      status_message,
      CASE 
        WHEN NEW.status = 'approved' THEN 'success'
        WHEN NEW.status = 'rejected' THEN 'warning'
        WHEN NEW.status = 'completed' THEN 'success'
        ELSE 'info'
      END,
      '/my-orders'
    );
  END IF;
  
  -- Notify on refund status change
  IF OLD.refund_status IS DISTINCT FROM NEW.refund_status AND NEW.refund_status = 'processed' THEN
    SELECT order_number, user_id INTO order_record FROM orders WHERE id = NEW.order_id;
    
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      order_record.user_id,
      'Refund Processed',
      'Your refund of ₹' || COALESCE(NEW.refund_amount::text, '0') || ' for order #' || order_record.order_number || ' has been processed.',
      'success',
      '/my-orders'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for return status update notification
DROP TRIGGER IF EXISTS on_return_status_update ON public.return_requests;
CREATE TRIGGER on_return_status_update
  AFTER UPDATE ON public.return_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_customer_return_status();

-- Create function to notify on new chat message
CREATE OR REPLACE FUNCTION public.notify_chat_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  order_record RECORD;
  recipient_id UUID;
BEGIN
  -- Get order details
  SELECT order_number, user_id INTO order_record FROM orders WHERE id = NEW.order_id;
  
  -- Determine recipient
  IF NEW.sender_type = 'customer' THEN
    -- Notify seller(s)
    FOR recipient_id IN
      SELECT DISTINCT p.seller_id
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = NEW.order_id AND p.seller_id IS NOT NULL
    LOOP
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (
        recipient_id,
        'New Message - Order #' || order_record.order_number,
        'You have a new message from the customer regarding order #' || order_record.order_number,
        'info',
        '/seller/orders'
      );
    END LOOP;
  ELSE
    -- Notify customer
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      order_record.user_id,
      'New Message from Seller - Order #' || order_record.order_number,
      'The seller has sent you a message regarding your order.',
      'info',
      '/my-orders'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for chat message notification
DROP TRIGGER IF EXISTS on_chat_message ON public.order_chats;
CREATE TRIGGER on_chat_message
  AFTER INSERT ON public.order_chats
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_chat_message();

-- Enable realtime for return_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.return_requests;