import { useState, useCallback } from 'react';
import { MLService } from '@/services/mlService';
import type { AcademicFeatures, PredictionExplanation } from '@/types';

export function useLinearRegression() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPrediction = useCallback(async (features: AcademicFeatures): Promise<PredictionExplanation> => {
    setIsLoading(true);
    setError(null);
    try {
      const explanation = await MLService.predict(features);
      return explanation;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Prediction failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    getPrediction,
  };
}
