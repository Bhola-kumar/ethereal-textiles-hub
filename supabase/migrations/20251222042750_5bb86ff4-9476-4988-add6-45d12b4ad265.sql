-- Add explicit policies to block anonymous access to sensitive tables
-- These policies ensure unauthenticated users cannot access personal data

-- Drop existing policies and recreate with proper structure for profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Recreate policies with explicit authentication requirement
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Drop existing policy and recreate for addresses
DROP POLICY IF EXISTS "Users can manage their own addresses" ON public.addresses;

-- Recreate with explicit authentication requirement
CREATE POLICY "Users can manage their own addresses" 
ON public.addresses 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);