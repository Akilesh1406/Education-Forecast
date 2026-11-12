-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  semester INTEGER NOT NULL DEFAULT 1 CHECK (semester >= 1 AND semester <= 8),
  department TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create courses table
CREATE TABLE public.courses (
  id SERIAL PRIMARY KEY,
  semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 8),
  department TEXT NOT NULL,
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  credits INTEGER NOT NULL CHECK (credits > 0),
  is_lab BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Courses policies
CREATE POLICY "Anyone can view courses"
  ON public.courses FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can manage courses"
  ON public.courses FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create scores table
CREATE TABLE public.scores (
  id SERIAL PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  course_id INTEGER REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  exam1_score FLOAT CHECK (exam1_score >= 0 AND exam1_score <= 100),
  exam2_score FLOAT CHECK (exam2_score >= 0 AND exam2_score <= 100),
  exam3_score FLOAT CHECK (exam3_score >= 0 AND exam3_score <= 100),
  final_score FLOAT CHECK (final_score >= 0 AND final_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, course_id)
);

-- Enable RLS on scores
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

-- Scores policies
CREATE POLICY "Students can view their own scores"
  ON public.scores FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own scores"
  ON public.scores FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own scores"
  ON public.scores FOR UPDATE
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all scores"
  ON public.scores FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all scores"
  ON public.scores FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create performance_factors table
CREATE TABLE public.performance_factors (
  id SERIAL PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  course_id INTEGER REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  attendance FLOAT CHECK (attendance >= 0 AND attendance <= 100),
  study_hours FLOAT CHECK (study_hours >= 0),
  confidence_percentage FLOAT CHECK (confidence_percentage >= 0 AND confidence_percentage <= 100),
  trend TEXT CHECK (trend IN ('Improving', 'Stable', 'Declining')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, course_id)
);

-- Enable RLS on performance_factors
ALTER TABLE public.performance_factors ENABLE ROW LEVEL SECURITY;

-- Performance factors policies
CREATE POLICY "Students can view their own performance factors"
  ON public.performance_factors FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own performance factors"
  ON public.performance_factors FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own performance factors"
  ON public.performance_factors FOR UPDATE
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all performance factors"
  ON public.performance_factors FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all performance factors"
  ON public.performance_factors FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create predictions table
CREATE TABLE public.predictions (
  id SERIAL PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  predicted_average FLOAT,
  predicted_topper FLOAT,
  predicted_cgpa FLOAT CHECK (predicted_cgpa >= 0 AND predicted_cgpa <= 10),
  focus_subject TEXT,
  recommendation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on predictions
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- Predictions policies
CREATE POLICY "Students can view their own predictions"
  ON public.predictions FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all predictions"
  ON public.predictions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert predictions"
  ON public.predictions FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "System can update predictions"
  ON public.predictions FOR UPDATE
  USING (TRUE);

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scores_updated_at
  BEFORE UPDATE ON public.scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_performance_factors_updated_at
  BEFORE UPDATE ON public.performance_factors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_predictions_updated_at
  BEFORE UPDATE ON public.predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, semester, department)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Student'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'semester')::INTEGER, 1),
    COALESCE(NEW.raw_user_meta_data->>'department', 'AI & DS')
  );
  
  -- Assign student role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();