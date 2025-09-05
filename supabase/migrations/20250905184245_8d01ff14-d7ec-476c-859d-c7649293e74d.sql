-- Create RLS policies for push_subscriptions table
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own push subscriptions
CREATE POLICY "Users can manage their own push subscriptions" 
ON public.push_subscriptions 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can view all push subscriptions (for management purposes)
CREATE POLICY "Admins can view all push subscriptions" 
ON public.push_subscriptions 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin'::user_role);