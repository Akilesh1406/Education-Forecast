-- ============================================================================
-- Enterprise Database Upgrade: RBAC, Tables, and Security Hardening
-- Migration: 20261112000000_enterprise_upgrade.sql
-- ============================================================================

-- 1. Ensure 'faculty' is included in app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'faculty';

-- 2. Create Departments table
CREATE TABLE IF NOT EXISTS public.departments (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view departments"
  ON public.departments FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can manage departments"
  ON public.departments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed default departments if empty
INSERT INTO public.departments (code, name) VALUES
  ('AIDS', 'Artificial Intelligence & Data Science'),
  ('IT', 'Information Technology'),
  ('CSE', 'Computer Science & Engineering'),
  ('MECH', 'Mechanical Engineering'),
  ('CIVIL', 'Civil Engineering'),
  ('AUTO', 'Automobile Engineering')
ON CONFLICT (code) DO NOTHING;

-- 3. Create Faculty Assignments table
CREATE TABLE IF NOT EXISTS public.faculty_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  department TEXT NOT NULL,
  semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 8),
  course_id INTEGER REFERENCES public.courses(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.faculty_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Faculty can view their own assignments"
  ON public.faculty_assignments FOR SELECT
  USING (auth.uid() = faculty_id);

CREATE POLICY "Admins can manage faculty assignments"
  ON public.faculty_assignments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Create Academic Records table (Semester Historical Performance)
CREATE TABLE IF NOT EXISTS public.academic_records (
  id SERIAL PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 8),
  previous_cgpa FLOAT CHECK (previous_cgpa >= 0 AND previous_cgpa <= 10),
  attendance_percentage FLOAT CHECK (attendance_percentage >= 0 AND attendance_percentage <= 100),
  internal_exam_marks FLOAT CHECK (internal_exam_marks >= 0 AND internal_exam_marks <= 100),
  assignment_marks FLOAT CHECK (assignment_marks >= 0 AND assignment_marks <= 100),
  study_hours_weekly FLOAT CHECK (study_hours_weekly >= 0 AND study_hours_weekly <= 168),
  subject_marks_avg FLOAT CHECK (subject_marks_avg >= 0 AND subject_marks_avg <= 100),
  credits_completed INTEGER DEFAULT 0,
  actual_sgpa FLOAT CHECK (actual_sgpa >= 0 AND actual_sgpa <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (student_id, semester)
);

ALTER TABLE public.academic_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own academic records"
  ON public.academic_records FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own academic records"
  ON public.academic_records FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own academic records"
  ON public.academic_records FOR UPDATE
  USING (auth.uid() = student_id);

CREATE POLICY "Faculty can view academic records in their department"
  ON public.academic_records FOR SELECT
  USING (
    public.has_role(auth.uid(), 'faculty') AND
    EXISTS (
      SELECT 1 FROM public.profiles s
      JOIN public.faculty_assignments fa ON fa.faculty_id = auth.uid()
      WHERE s.user_id = academic_records.student_id
        AND s.department = fa.department
        AND s.semester = fa.semester
    )
  );

CREATE POLICY "Faculty can update academic records for assigned students"
  ON public.academic_records FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'faculty') AND
    EXISTS (
      SELECT 1 FROM public.profiles s
      JOIN public.faculty_assignments fa ON fa.faculty_id = auth.uid()
      WHERE s.user_id = academic_records.student_id
        AND s.department = fa.department
        AND s.semester = fa.semester
    )
  );

CREATE POLICY "Admins can manage all academic records"
  ON public.academic_records FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Create Model Versions table
CREATE TABLE IF NOT EXISTS public.model_versions (
  id SERIAL PRIMARY KEY,
  version_tag TEXT NOT NULL UNIQUE,
  algorithm TEXT NOT NULL,
  mae FLOAT NOT NULL,
  rmse FLOAT NOT NULL,
  r2_score FLOAT NOT NULL,
  feature_names JSONB NOT NULL,
  feature_importances JSONB NOT NULL,
  hyperparameters JSONB,
  is_active BOOLEAN DEFAULT FALSE,
  trained_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  trained_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.model_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active model versions"
  ON public.model_versions FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Admins can manage model versions"
  ON public.model_versions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 6. Create Dataset Uploads table
CREATE TABLE IF NOT EXISTS public.dataset_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  filename TEXT NOT NULL,
  total_rows INTEGER NOT NULL,
  valid_rows INTEGER NOT NULL,
  invalid_rows INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('uploaded', 'validating', 'validated', 'imported', 'failed')),
  error_log JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.dataset_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view and manage dataset uploads"
  ON public.dataset_uploads FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Faculty can view dataset uploads"
  ON public.dataset_uploads FOR SELECT
  USING (public.has_role(auth.uid(), 'faculty'));

-- 7. Create Audit Logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System and authenticated users can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 8. Fix Row Level Security Vulnerabilities on Profiles & Predictions

-- Drop dangerous global read policy on profiles
DROP POLICY IF EXISTS "Anyone can view all profiles for rankings" ON public.profiles;

-- Ensure Students can ONLY view their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Faculty can view profiles of students in their assigned department & semester
DROP POLICY IF EXISTS "Faculty can view assigned student profiles" ON public.profiles;
CREATE POLICY "Faculty can view assigned student profiles"
  ON public.profiles FOR SELECT
  USING (
    public.has_role(auth.uid(), 'faculty') AND
    EXISTS (
      SELECT 1 FROM public.faculty_assignments fa
      WHERE fa.faculty_id = auth.uid()
        AND fa.department = profiles.department
        AND fa.semester = profiles.semester
    )
  );

-- Admins can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Drop dangerous global read policy on predictions
DROP POLICY IF EXISTS "Students can view all predictions for rankings" ON public.predictions;

-- Restore student-only prediction policy
DROP POLICY IF EXISTS "Students can view their own predictions" ON public.predictions;
CREATE POLICY "Students can view their own predictions"
  ON public.predictions FOR SELECT
  USING (auth.uid() = student_id);

-- Faculty can view predictions of their assigned students
DROP POLICY IF EXISTS "Faculty can view assigned student predictions" ON public.predictions;
CREATE POLICY "Faculty can view assigned student predictions"
  ON public.predictions FOR SELECT
  USING (
    public.has_role(auth.uid(), 'faculty') AND
    EXISTS (
      SELECT 1 FROM public.profiles s
      JOIN public.faculty_assignments fa ON fa.faculty_id = auth.uid()
      WHERE s.user_id = predictions.student_id
        AND s.department = fa.department
        AND s.semester = fa.semester
    )
  );

-- Admins can view and manage all predictions
DROP POLICY IF EXISTS "Admins can view all predictions" ON public.predictions;
CREATE POLICY "Admins can view all predictions"
  ON public.predictions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 9. Add columns to predictions table for risk categorization & model version tracking
ALTER TABLE public.predictions 
  ADD COLUMN IF NOT EXISTS risk_category TEXT CHECK (risk_category IN ('Low Risk', 'Medium Risk', 'High Risk')),
  ADD COLUMN IF NOT EXISTS model_version TEXT,
  ADD COLUMN IF NOT EXISTS feature_importances JSONB;

-- 10. Privacy-Compliant Leaderboard RPC (Prevents data harvesting)
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (
  rank BIGINT,
  department TEXT,
  semester INTEGER,
  predicted_cgpa FLOAT,
  masked_identifier TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT 
    ROW_NUMBER() OVER (ORDER BY p.predicted_cgpa DESC) AS rank,
    pr.department,
    pr.semester,
    p.predicted_cgpa,
    CONCAT(SUBSTRING(pr.name FROM 1 FOR 1), '*** ', SUBSTRING(pr.name FROM POSITION(' ' IN pr.name) + 1 FOR 1), '.') AS masked_identifier
  FROM public.predictions p
  JOIN public.profiles pr ON pr.user_id = p.student_id
  WHERE p.predicted_cgpa IS NOT NULL
  ORDER BY p.predicted_cgpa DESC
  LIMIT 25;
$$;

