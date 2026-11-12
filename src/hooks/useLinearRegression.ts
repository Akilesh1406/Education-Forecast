import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  extractStudentFeatures,
  predictWithDefaultModel,
  generateRecommendation,
  calculateCurrentCGPA,
  type StudentFeatures,
} from '@/lib/linearRegression';

export interface PredictionResult {
  predictedCGPA: number;
  currentCGPA: number;
  features: StudentFeatures;
  recommendation: string;
  focusSubject: string;
  isLoading: boolean;
  error: string | null;
}

export function useLinearRegression() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Calculate prediction locally using linear regression
   */
  const calculateLocalPrediction = useCallback(
    (
      performanceFactors: Array<{
        attendance: number | null;
        study_hours_weekly: number | null;
        confidence_percentage: number | null;
        trend: string | null;
      }>,
      scores: Array<{
        exam1_score: number | null;
        exam2_score: number | null;
        exam3_score: number | null;
        final_score: number | null;
        courses?: { credits: number } | null;
      }>
    ) => {
      const features = extractStudentFeatures(performanceFactors, scores);
      const predictedCGPA = predictWithDefaultModel(features);
      const currentCGPA = calculateCurrentCGPA(scores);
      const { recommendation, focusSubject } = generateRecommendation(features, predictedCGPA);

      return {
        predictedCGPA: Math.round(predictedCGPA * 100) / 100,
        currentCGPA: Math.round(currentCGPA * 100) / 100,
        features,
        recommendation,
        focusSubject,
      };
    },
    []
  );

  /**
   * Fetch prediction from edge function (server-side)
   */
  const fetchServerPrediction = useCallback(async (studentId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('predict-cgpa', {
        body: { student_id: studentId },
      });

      if (fnError) throw fnError;

      return data?.prediction || null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch prediction';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Trigger prediction update for a student
   */
  const updatePrediction = useCallback(
    async (
      studentId: string,
      performanceFactors: Array<{
        attendance: number | null;
        study_hours_weekly: number | null;
        confidence_percentage: number | null;
        trend: string | null;
      }>,
      scores: Array<{
        exam1_score: number | null;
        exam2_score: number | null;
        exam3_score: number | null;
        final_score: number | null;
        courses?: { credits: number } | null;
      }>
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        // Calculate locally first for immediate feedback
        const localPrediction = calculateLocalPrediction(performanceFactors, scores);

        // Try server-side prediction for more accurate results
        const serverResult = await fetchServerPrediction(studentId);

        if (serverResult) {
          return {
            ...localPrediction,
            predictedCGPA: serverResult.predicted_cgpa,
            recommendation: serverResult.recommendation,
            focusSubject: serverResult.focus_subject,
          };
        }

        return localPrediction;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update prediction';
        setError(message);

        // Fallback to local calculation
        return calculateLocalPrediction(performanceFactors, scores);
      } finally {
        setIsLoading(false);
      }
    },
    [calculateLocalPrediction, fetchServerPrediction]
  );

  return {
    isLoading,
    error,
    calculateLocalPrediction,
    fetchServerPrediction,
    updatePrediction,
  };
}
