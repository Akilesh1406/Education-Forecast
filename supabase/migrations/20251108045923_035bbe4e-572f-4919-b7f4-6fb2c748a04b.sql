-- Allow all authenticated users to view all profiles for rankings feature
CREATE POLICY "Anyone can view all profiles for rankings"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);