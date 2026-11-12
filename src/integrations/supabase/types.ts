export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      departments: {
        Row: {
          id: number
          code: string
          name: string
          created_at: string
        }
        Insert: {
          id?: number
          code: string
          name: string
          created_at?: string
        }
        Update: {
          id?: number
          code?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }
      faculty_assignments: {
        Row: {
          id: string
          faculty_id: string
          department: string
          semester: number
          course_id: number | null
          created_at: string
        }
        Insert: {
          id?: string
          faculty_id: string
          department: string
          semester: number
          course_id?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          faculty_id?: string
          department?: string
          semester?: number
          course_id?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "faculty_assignments_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "faculty_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          }
        ]
      }
      academic_records: {
        Row: {
          id: number
          student_id: string
          semester: number
          previous_cgpa: number | null
          attendance_percentage: number | null
          internal_exam_marks: number | null
          assignment_marks: number | null
          study_hours_weekly: number | null
          subject_marks_avg: number | null
          credits_completed: number | null
          actual_sgpa: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          student_id: string
          semester: number
          previous_cgpa?: number | null
          attendance_percentage?: number | null
          internal_exam_marks?: number | null
          assignment_marks?: number | null
          study_hours_weekly?: number | null
          subject_marks_avg?: number | null
          credits_completed?: number | null
          actual_sgpa?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          student_id?: string
          semester?: number
          previous_cgpa?: number | null
          attendance_percentage?: number | null
          internal_exam_marks?: number | null
          assignment_marks?: number | null
          study_hours_weekly?: number | null
          subject_marks_avg?: number | null
          credits_completed?: number | null
          actual_sgpa?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          }
        ]
      }
      model_versions: {
        Row: {
          id: number
          version_tag: string
          algorithm: string
          mae: number
          rmse: number
          r2_score: number
          feature_names: Json
          feature_importances: Json
          hyperparameters: Json | null
          is_active: boolean
          trained_by: string | null
          trained_at: string
        }
        Insert: {
          id?: number
          version_tag: string
          algorithm: string
          mae: number
          rmse: number
          r2_score: number
          feature_names: Json
          feature_importances: Json
          hyperparameters?: Json | null
          is_active?: boolean
          trained_by?: string | null
          trained_at?: string
        }
        Update: {
          id?: number
          version_tag?: string
          algorithm?: string
          mae?: number
          rmse?: number
          r2_score?: number
          feature_names?: Json
          feature_importances?: Json
          hyperparameters?: Json | null
          is_active?: boolean
          trained_by?: string | null
          trained_at?: string
        }
        Relationships: []
      }
      dataset_uploads: {
        Row: {
          id: string
          uploaded_by: string | null
          filename: string
          total_rows: number
          valid_rows: number
          invalid_rows: number
          status: string
          error_log: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          uploaded_by?: string | null
          filename: string
          total_rows: number
          valid_rows: number
          invalid_rows: number
          status: string
          error_log?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          uploaded_by?: string | null
          filename?: string
          total_rows?: number
          valid_rows?: number
          invalid_rows?: number
          status?: string
          error_log?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: number
          user_id: string | null
          action: string
          entity: string
          entity_id: string | null
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id?: string | null
          action: string
          entity: string
          entity_id?: string | null
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string | null
          action?: string
          entity?: string
          entity_id?: string | null
          details?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          course_code: string
          course_name: string
          created_at: string
          credits: number
          department: string
          id: number
          is_lab: boolean
          semester: number
        }
        Insert: {
          course_code: string
          course_name: string
          created_at?: string
          credits: number
          department: string
          id?: number
          is_lab?: boolean
          semester: number
        }
        Update: {
          course_code?: string
          course_name?: string
          created_at?: string
          credits?: number
          department?: string
          id?: number
          is_lab?: boolean
          semester?: number
        }
        Relationships: []
      }
      performance_factors: {
        Row: {
          attendance: number | null
          confidence_percentage: number | null
          course_id: number
          created_at: string
          id: number
          student_id: string
          study_hours_weekly: number | null
          trend: string | null
          updated_at: string
        }
        Insert: {
          attendance?: number | null
          confidence_percentage?: number | null
          course_id: number
          created_at?: string
          id?: number
          student_id: string
          study_hours_weekly?: number | null
          trend?: string | null
          updated_at?: string
        }
        Update: {
          attendance?: number | null
          confidence_percentage?: number | null
          course_id?: number
          created_at?: string
          id?: number
          student_id?: string
          study_hours_weekly?: number | null
          trend?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_factors_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_factors_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      predictions: {
        Row: {
          created_at: string
          current_cgpa: number | null
          focus_subject: string | null
          id: number
          predicted_average: number | null
          predicted_cgpa: number | null
          predicted_topper: number | null
          recommendation: string | null
          student_id: string
          updated_at: string
          risk_category: string | null
          model_version: string | null
          feature_importances: Json | null
        }
        Insert: {
          created_at?: string
          current_cgpa?: number | null
          focus_subject?: string | null
          id?: number
          predicted_average?: number | null
          predicted_cgpa?: number | null
          predicted_topper?: number | null
          recommendation?: string | null
          student_id: string
          updated_at?: string
          risk_category?: string | null
          model_version?: string | null
          feature_importances?: Json | null
        }
        Update: {
          created_at?: string
          current_cgpa?: number | null
          focus_subject?: string | null
          id?: number
          predicted_average?: number | null
          predicted_cgpa?: number | null
          predicted_topper?: number | null
          recommendation?: string | null
          student_id?: string
          updated_at?: string
          risk_category?: string | null
          model_version?: string | null
          feature_importances?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "predictions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          department: string
          email: string
          id: string
          name: string
          semester: number
          updated_at: string
          user_id: string
          phone?: string | null
        }
        Insert: {
          created_at?: string
          department?: string
          email: string
          id?: string
          name: string
          semester?: number
          updated_at?: string
          user_id: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          department?: string
          email?: string
          id?: string
          name?: string
          semester?: number
          updated_at?: string
          user_id?: string
          phone?: string | null
        }
        Relationships: []
      }
      scores: {
        Row: {
          course_id: number
          created_at: string
          exam1_score: number | null
          exam2_score: number | null
          exam3_score: number | null
          final_score: number | null
          id: number
          student_id: string
          updated_at: string
        }
        Insert: {
          course_id: number
          created_at?: string
          exam1_score?: number | null
          exam2_score?: number | null
          exam3_score?: number | null
          final_score?: number | null
          id?: number
          student_id: string
          updated_at?: string
        }
        Update: {
          course_id?: number
          created_at?: string
          exam1_score?: number | null
          exam2_score?: number | null
          exam3_score?: number | null
          final_score?: number | null
          id?: number
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scores_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      get_leaderboard: {
        Args: Record<PropertyKey, never>
        Returns: {
          rank: number
          department: string
          semester: number
          predicted_cgpa: number
          masked_identifier: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "faculty" | "student"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof DatabaseWithoutInternals,
  "public"
>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "faculty", "student"],
    },
  },
} as const
