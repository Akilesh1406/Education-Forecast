-- Allow students to view all predictions for class rankings
CREATE POLICY "Students can view all predictions for rankings"
ON public.predictions
FOR SELECT
USING (true);