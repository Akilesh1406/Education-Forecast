-- Drop the conflicting restrictive policy
DROP POLICY IF EXISTS "Students can view their own predictions" ON public.predictions;

-- The open policy "Students can view all predictions for rankings" will now take effect