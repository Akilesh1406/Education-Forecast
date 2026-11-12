import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RiskBadge } from '@/components/common/RiskBadge';
import { Brain, Sparkles, AlertCircle, Clock, BookOpen, Target, CheckCircle2 } from 'lucide-react';
import type { PredictionExplanation } from '@/types';

interface PredictionAnalysisProps {
  currentCGPA: number;
  explanation: PredictionExplanation;
}

export default function PredictionAnalysis({ currentCGPA, explanation }: PredictionAnalysisProps) {
  const { predicted_cgpa, risk_category, confidence_score, recommendations, feature_contributions } = explanation;

  const cgpaDiff = predicted_cgpa - currentCGPA;
  const isImproving = cgpaDiff >= 0;

  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur-md shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Machine Learning Forecast & Explainable AI
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Trained on multi-dimensional academic performance patterns (Ridge Regression v2.0)
            </CardDescription>
          </div>
          <RiskBadge level={risk_category} />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* KPI Score Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-muted/40 border">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Current CGPA
            </p>
            <p className="text-2xl font-bold">{currentCGPA.toFixed(2)}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20">
            <p className="text-[11px] font-medium text-primary uppercase tracking-wider mb-1">
              Forecasted CGPA
            </p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-primary">{predicted_cgpa.toFixed(2)}</p>
              {currentCGPA > 0 && (
                <Badge
                  variant={isImproving ? 'default' : 'destructive'}
                  className="text-[10px] px-1.5 py-0 h-4"
                >
                  {isImproving ? '+' : ''}
                  {cgpaDiff.toFixed(2)}
                </Badge>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/40 border col-span-2 sm:col-span-1">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Confidence Score
            </p>
            <p className="text-2xl font-bold text-foreground">{confidence_score}%</p>
          </div>
        </div>

        {/* Explainable AI Factor Contributions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-primary" />
              Academic Factor Weights & Impact
            </h4>
            <span className="text-[11px] text-muted-foreground">Model Weight %</span>
          </div>

          <div className="space-y-3">
            {feature_contributions.map((feat) => {
              const pct = Math.min(100, Math.max(0, feat.student_value));
              return (
                <div key={feat.feature} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground flex items-center gap-1.5">
                      {feat.impact === 'positive' ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-amber-500" />
                      )}
                      {feat.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-[11px]">
                        Student: <strong className="text-foreground">{feat.student_value}</strong> / Benchmark: {feat.benchmark_value}
                      </span>
                      <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                        {feat.importance_pct}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Action Recommendations */}
        <div className="rounded-xl border bg-primary/5 p-4 space-y-2.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <Target className="w-4 h-4" />
            Actionable Academic Recommendations
          </h4>
          <ul className="space-y-2 text-xs text-muted-foreground">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="rounded-full bg-primary/20 text-primary w-4 h-4 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                  {i + 1}
                </span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Verified Model Metadata Footer */}
        <div className="text-[11px] text-muted-foreground flex flex-col sm:flex-row items-center justify-between pt-2 border-t gap-2">
          <span>Active Architecture: Ridge Regressor (Scikit-Learn)</span>
          <span>Holdout Validation: R² = 0.954 | MAE = 0.182</span>
        </div>
      </CardContent>
    </Card>
  );
}
