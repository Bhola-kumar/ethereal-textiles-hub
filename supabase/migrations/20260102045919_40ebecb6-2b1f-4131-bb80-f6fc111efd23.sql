-- Add customer cancellation fields to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_cancel_reason text,
ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS cancelled_by text; -- 'customer' or 'seller' or 'admin'

-- Create support_tickets table for help desk
CREATE TABLE public.support_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  order_id uuid REFERENCES public.orders(id),
  product_id uuid REFERENCES public.products(id),
  ticket_type text NOT NULL DEFAULT 'general', -- 'general', 'product_inquiry', 'order_issue', 'return', 'refund', 'cancellation'
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  priority text NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone
);

-- Create support_messages table for chat history
CREATE TABLE public.support_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id uuid,
  content text NOT NULL,
  is_ai_response boolean DEFAULT false,
  is_from_support boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create return_requests table
CREATE TABLE public.return_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id),
  user_id uuid NOT NULL,
  order_item_id uuid REFERENCES public.order_items(id),
  reason text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'completed'
  refund_amount numeric,
  refund_status text DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone
);

-- Enable RLS on new tables
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_tickets
CREATE POLICY "Users can view their own tickets"
ON public.support_tickets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets"
ON public.support_tickets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets"
ON public.support_tickets FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all tickets"
ON public.support_tickets FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sellers can view tickets for their products"
ON public.support_tickets FOR SELECT
USING (
  product_id IN (SELECT id FROM products WHERE seller_id = auth.uid())
  OR order_id IN (SELECT id FROM orders WHERE is_seller_for_order(id, auth.uid()))
);

-- RLS Policies for support_messages
CREATE POLICY "Users can view messages for their tickets"
ON public.support_messages FOR SELECT
USING (
  ticket_id IN (SELECT id FROM support_tickets WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create messages for their tickets"
ON public.support_messages FOR INSERT
WITH CHECK (
  ticket_id IN (SELECT id FROM support_tickets WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can manage all messages"
ON public.support_messages FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for return_requests
CREATE POLICY "Users can view their own return requests"
ON public.return_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create return requests"
ON public.return_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all return requests"
ON public.return_requests FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sellers can view return requests for their orders"
ON public.return_requests FOR SELECT
USING (
  order_id IN (SELECT id FROM orders WHERE is_seller_for_order(id, auth.uid()))
);

CREATE POLICY "Sellers can update return requests for their orders"
ON public.return_requests FOR UPDATE
USING (
  order_id IN (SELECT id FROM orders WHERE is_seller_for_order(id, auth.uid()))
);

-- Create trigger for updated_at
CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_return_requests_updated_at
BEFORE UPDATE ON public.return_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();