-- Remove the overly permissive INSERT policy that allows anyone to create notifications
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Create a restricted policy that only allows admins to create notifications
-- SECURITY DEFINER functions (notify_order_status_change, notify_order_declined) 
-- will still work as they execute with elevated privileges
CREATE POLICY "Admins can create notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));