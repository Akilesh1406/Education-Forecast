export type UserRole = 'admin' | 'faculty' | 'student';

export type RiskLevel = 'Low Risk' | 'Medium Risk' | 'High Risk';

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  semester: number;
  department: string;
  phone?: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentPrediction {
  id?: number;
  student_id: string;
  current_cgpa: number | null;
  predicted_cgpa: number;
  predicted_average: number;
  predicted_topper: number;
  risk_category: RiskLevel;
  recommendation: string;
  focus_subject: string;
  model_version?: string;
  feature_importances?: Record<string, number>;
  created_at?: string;
  updated_at?: string;
}

export interface AcademicFeatures {
  attendance_percentage: number;
  previous_cgpa: number;
  internal_exam_marks: number;
  assignment_marks: number;
  study_hours_weekly: number;
  subject_marks_avg: number;
  credits_completed: number;
}

export interface PredictionExplanation {
  predicted_cgpa: number;
  risk_category: RiskLevel;
  confidence_score: number;
  primary_risk_factor: string;
  recommendations: string[];
  feature_contributions: {
    feature: string;
    label: string;
    student_value: number;
    benchmark_value: number;
    impact: 'positive' | 'negative' | 'neutral';
    importance_pct: number;
  }[];
}

export interface CSVValidationRow {
  row_number: number;
  registration_number: string;
  name: string;
  department: string;
  semester: number;
  attendance_percentage: number;
  previous_cgpa: number;
  internal_exam_marks: number;
  assignment_marks: number;
  study_hours_weekly: number;
  subject_marks_avg: number;
  credits_completed: number;
  actual_next_cgpa?: number;
  is_valid: boolean;
  errors: string[];
}

export interface CSVValidationReport {
  filename: string;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  errors_summary: Record<string, number>;
  rows: CSVValidationRow[];
}

export interface ModelMetrics {
  version_tag: string;
  algorithm: string;
  mae: number;
  rmse: number;
  r2_score: number;
  feature_names: string[];
  feature_importances: Record<string, number>;
  trained_at: string;
  is_active: boolean;
}

