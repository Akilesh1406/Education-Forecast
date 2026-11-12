import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Brain, Target, BookOpen, Clock, BarChart3 } from 'lucide-react';
import type { StudentFeatures } from '@/lib/linearRegression';

interface PredictionAnalysisProps {
  predictedCGPA: number;
  currentCGPA: number;
  features: StudentFeatures;
  recommendation: string;
  focusSubject: string;
}

export default function PredictionAnalysis({
  predictedCGPA,
  currentCGPA,
  features,
  recommendation,
  focusSubject,
}: PredictionAnalysisProps) {
  const cgpaDiff = predictedCGPA - currentCGPA;
  const isImproving = cgpaDiff > 0;

  // Feature importance weights for visualization
  const featureImportance = [
    { name: 'Exam Scores', value: 40, current: Math.min(100, features.avgExamScore) },
    { name: 'Attendance', value: 25, current: features.avgAttendance },
    { name: 'Study Hours', value: 20, current: Math.min(100, (features.avgStudyHours / 5) * 100) },
    { name: 'Confidence', value: 10, current: features.avgConfidence },
    { name: 'Trends', value: 5, current: features.improvingTrends },
  ];

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Linear Regression Analysis
        </CardTitle>
        <CardDescription>
          AI-powered CGPA prediction using multiple linear regression
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Prediction Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Current CGPA</p>
            <p className="text-2xl font-bold">{currentCGPA.toFixed(2)}</p>
          </div>
          <div className="p-4 rounded-lg bg-primary/10">
            <p className="text-xs text-muted-foreground mb-1">Predicted CGPA</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-primary">{predictedCGPA.toFixed(2)}</p>
              {cgpaDiff !== 0 && (
                <Badge variant={isImproving ? 'default' : 'destructive'} className="text-xs">
                  {isImproving ? '+' : ''}{cgpaDiff.toFixed(2)}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Feature Contributions */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Feature Weights & Your Performance
          </h4>
          <div className="space-y-3">
            {featureImportance.map((feature) => (
              <div key={feature.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{feature.name}</span>
                  <span className="font-medium">
                    {feature.current.toFixed(0)}% (weight: {feature.value}%)
                  </span>
                </div>
                <div className="relative">
                  <Progress value={feature.current} className="h-2" />
                  <div
                    className="absolute top-0 h-2 w-0.5 bg-primary"
                    style={{ left: `${feature.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Raw Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
            <Target className="w-4 h-4 text-primary" />
            <div>
              <p className="text-[10px] text-muted-foreground">Attendance</p>
              <p className="text-sm font-bold">{features.avgAttendance.toFixed(1)}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
            <Clock className="w-4 h-4 text-primary" />
            <div>
              <p className="text-[10px] text-muted-foreground">Study/Day</p>
              <p className="text-sm font-bold">{features.avgStudyHours.toFixed(1)}h</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
            <BookOpen className="w-4 h-4 text-primary" />
            <div>
              <p className="text-[10px] text-muted-foreground">Avg Score</p>
              <p className="text-sm font-bold">{features.avgExamScore.toFixed(1)}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
            <TrendingUp className="w-4 h-4 text-primary" />
            <div>
              <p className="text-[10px] text-muted-foreground">Improving</p>
              <p className="text-sm font-bold">{features.improvingTrends.toFixed(0)}%</p>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium">AI Recommendation</p>
                <Badge variant="outline" className="text-xs">
                  Focus: {focusSubject}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{recommendation}</p>
            </div>
          </div>
        </div>

        {/* Model Info */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Multiple Linear Regression • R² optimized • 5 feature model
        </div>
      </CardContent>
    </Card>
  );
}
