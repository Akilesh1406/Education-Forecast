import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Linear Regression utilities
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function extractFeatures(
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
  }>
) {
  const attendances = performanceFactors
    .map(p => p.attendance)
    .filter((a): a is number => a !== null);
  const avgAttendance = mean(attendances);

  const studyHours = performanceFactors
    .map(p => p.study_hours_weekly)
    .filter((h): h is number => h !== null)
    .map(h => h / 7);
  const avgStudyHours = mean(studyHours);

  const allScores: number[] = [];
  scores.forEach(s => {
    if (s.exam1_score !== null) allScores.push(s.exam1_score);
    if (s.exam2_score !== null) allScores.push(s.exam2_score);
    if (s.exam3_score !== null) allScores.push(s.exam3_score);
    if (s.final_score !== null) allScores.push(s.final_score);
  });
  const avgExamScore = mean(allScores);

  const confidences = performanceFactors
    .map(p => p.confidence_percentage)
    .filter((c): c is number => c !== null);
  const avgConfidence = mean(confidences);

  const trends = performanceFactors.map(p => p.trend).filter(Boolean);
  const improvingCount = trends.filter(t => t === 'Improving').length;
  const improvingTrends = trends.length > 0 ? (improvingCount / trends.length) * 100 : 50;

  return {
    avgAttendance,
    avgStudyHours,
    avgExamScore,
    avgConfidence,
    improvingTrends,
  };
}

function predictCGPA(features: {
  avgAttendance: number;
  avgStudyHours: number;
  avgExamScore: number;
  avgConfidence: number;
  improvingTrends: number;
}): number {
  // Linear regression coefficients (pre-trained)
  const coefficients = {
    attendance: 0.03,
    studyHours: 0.15,
    examScore: 0.08,
    confidence: 0.02,
    improvingTrends: 0.01,
    intercept: 1.5,
  };

  const prediction =
    coefficients.intercept +
    coefficients.attendance * (features.avgAttendance / 100) * 3 +
    coefficients.studyHours * features.avgStudyHours +
    coefficients.examScore * (features.avgExamScore / 100) * 5 +
    coefficients.confidence * (features.avgConfidence / 100) * 1 +
    coefficients.improvingTrends * (features.improvingTrends / 100) * 0.5;

  return Math.max(0, Math.min(10, prediction));
}

function generateRecommendation(
  features: {
    avgAttendance: number;
    avgStudyHours: number;
    avgExamScore: number;
    avgConfidence: number;
    improvingTrends: number;
  },
  predictedCGPA: number
): { recommendation: string; focusSubject: string } {
  const recommendations: string[] = [];
  let focusArea = 'General Studies';

  if (features.avgAttendance < 75) {
    recommendations.push('Improve your attendance to at least 75% to maintain eligibility and better understanding.');
    focusArea = 'Attendance';
  }

  if (features.avgStudyHours < 3) {
    recommendations.push('Increase daily study time to at least 3 hours for better retention.');
    if (focusArea === 'General Studies') focusArea = 'Study Habits';
  }

  if (features.avgExamScore < 60) {
    recommendations.push('Focus on improving exam preparation with regular revision and practice tests.');
    if (focusArea === 'General Studies') focusArea = 'Exam Preparation';
  }

  if (features.avgConfidence < 70) {
    recommendations.push('Build confidence through more practice problems and group study sessions.');
  }

  if (predictedCGPA >= 8.5) {
    recommendations.unshift('Excellent trajectory! Maintain current study patterns for top performance.');
  } else if (predictedCGPA >= 7) {
    recommendations.unshift('Good progress! A little more focus can push you to excellence.');
  } else if (predictedCGPA >= 5) {
    recommendations.unshift('Room for improvement. Consistent effort will help raise your CGPA.');
  } else {
    recommendations.unshift('Needs attention. Consider seeking academic support and tutoring.');
  }

  return {
    recommendation: recommendations.slice(0, 2).join(' '),
    focusSubject: focusArea,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { student_id } = await req.json();

    if (!student_id) {
      return new Response(
        JSON.stringify({ error: 'student_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch student's performance factors
    const { data: perfData, error: perfError } = await supabase
      .from('performance_factors')
      .select('attendance, study_hours_weekly, confidence_percentage, trend')
      .eq('student_id', student_id);

    if (perfError) throw perfError;

    // Fetch student's scores
    const { data: scoresData, error: scoresError } = await supabase
      .from('scores')
      .select('exam1_score, exam2_score, exam3_score, final_score')
      .eq('student_id', student_id);

    if (scoresError) throw scoresError;

    // Extract features and predict
    const features = extractFeatures(perfData || [], scoresData || []);
    const predictedCGPA = predictCGPA(features);
    const { recommendation, focusSubject } = generateRecommendation(features, predictedCGPA);

    // Calculate class statistics
    const { data: allPredictions } = await supabase
      .from('predictions')
      .select('predicted_cgpa');

    const allCGPAs = (allPredictions || [])
      .map(p => p.predicted_cgpa)
      .filter((c): c is number => c !== null);

    const avgCGPA = mean(allCGPAs);
    const topperCGPA = Math.max(...allCGPAs, predictedCGPA);

    // Update or insert prediction
    const { data: existingPred } = await supabase
      .from('predictions')
      .select('id')
      .eq('student_id', student_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const predictionData = {
      student_id,
      predicted_cgpa: Math.round(predictedCGPA * 100) / 100,
      predicted_average: Math.round(avgCGPA * 10) / 10,
      predicted_topper: Math.round(topperCGPA * 10) / 10,
      recommendation,
      focus_subject: focusSubject,
      updated_at: new Date().toISOString(),
    };

    if (existingPred) {
      await supabase
        .from('predictions')
        .update(predictionData)
        .eq('id', existingPred.id);
    } else {
      await supabase
        .from('predictions')
        .insert(predictionData);
    }

    return new Response(
      JSON.stringify({
        success: true,
        prediction: {
          predicted_cgpa: predictionData.predicted_cgpa,
          predicted_average: predictionData.predicted_average,
          predicted_topper: predictionData.predicted_topper,
          recommendation,
          focus_subject: focusSubject,
          features,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Prediction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
