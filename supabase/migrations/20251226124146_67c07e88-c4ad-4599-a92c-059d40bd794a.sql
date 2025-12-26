-- Allow sellers to create categories when they don't find a matching one
CREATE POLICY "Sellers can create categories" 
ON public.categories 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'seller'::app_role) OR has_role(auth.uid(), 'admin'::app_role));