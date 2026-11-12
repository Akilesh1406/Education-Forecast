import CGPAGauge from '@/components/CGPAGauge';
import Navigation from '@/components/Navigation';
import PredictionAnalysis from '@/components/PredictionAnalysis';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useLinearRegression } from '@/hooks/useLinearRegression';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import {
  BookOpen,
  Brain,
  Minus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

type ScoreWithCourse = Tables<'scores'> & {
  courses: Pick<
    Tables<'courses'>,
    'course_name' | 'credits' | 'is_lab' | 'semester' | 'department'
  >;
};

type PerformanceWithCourse = Tables<'performance_factors'> & {
  courses: Pick<
    Tables<'courses'>,
    'course_name' | 'course_code' | 'is_lab' | 'semester' | 'department'
  >;
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Tables<'profiles'> | null>(null);
  const [prediction, setPrediction] =
    useState<Tables<'predictions'> | null>(null);
  const [scores, setScores] = useState<ScoreWithCourse[]>([]);
  const [performance, setPerformance] = useState<PerformanceWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] =
    useState<PerformanceWithCourse | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const {
    calculateLocalPrediction,
    fetchServerPrediction,
    isLoading: isPredicting,
  } = useLinearRegression();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        setProfile(profileData);

        const { data: predData } = await supabase
          .from('predictions')
          .select('*')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        setPrediction(predData);

        const { data: scoresData } = await supabase
          .from('scores')
          .select(`
            *,
            courses!inner (
              course_name,
              credits,
              is_lab,
              semester,
              department
            )
          `)
          .eq('student_id', user.id)
          .eq('courses.semester', profileData?.semester || 1)
          .eq('courses.department', profileData?.department);

        setScores((scoresData || []) as unknown as ScoreWithCourse[]);

        const { data: perfData } = await supabase
          .from('performance_factors')
          .select(`
            *,
            courses!inner (
              course_name,
              course_code,
              is_lab,
              semester,
              department
            )
          `)
          .eq('student_id', user.id)
          .eq('courses.semester', profileData?.semester || 1)
          .eq('courses.department', profileData?.department);

        const performanceData =
          (perfData || []) as unknown as PerformanceWithCourse[];

        const theorySubjects = performanceData
          .filter((item) => !item.courses?.is_lab)
          .slice(0, 5);

        const labSubjects = performanceData
          .filter((item) => item.courses?.is_lab)
          .slice(0, 3);

        setPerformance([...theorySubjects, ...labSubjects]);
      } catch (error: unknown) {
        console.error('Error fetching student dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [user]);

  const regressionPrediction = useMemo(() => {
    if (performance.length === 0 && scores.length === 0) {
      return null;
    }

    return calculateLocalPrediction(performance, scores);
  }, [performance, scores, calculateLocalPrediction]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto p-8">
          <div className="text-center">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  const getTrendIcon = (trend: string) => {
    if (trend === 'Improving') {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    }

    if (trend === 'Declining') {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }

    return <Minus className="w-4 h-4 text-yellow-500" />;
  };

  const calculateEngagement = (
    attendance: number,
    studyHours: number
  ) => {
    const IDEAL_STUDY_HOURS = 3;
    const studyHourRatio = (studyHours / IDEAL_STUDY_HOURS) * 100;
    const engagement = 0.4 * attendance + 0.6 * studyHourRatio;

    return Math.min(Math.round(engagement), 100);
  };

  const handleRecalculatePrediction = async () => {
    if (!user) return;

    const result = await fetchServerPrediction(user.id);

    if (result) {
      setPrediction((previous) =>
        previous
          ? {
              ...previous,
              predicted_cgpa: result.predicted_cgpa,
              recommendation: result.recommendation,
              focus_subject: result.focus_subject,
            }
          : previous
      );
    }
  };

  const handleCourseClick = (perf: PerformanceWithCourse) => {
    setSelectedCourse(perf);
    setIsDialogOpen(true);
  };

  const getCoursePieData = (perf: PerformanceWithCourse) => {
    const courseScore = scores.find(
      (score) => score.course_id === perf.course_id
    );

    const data: { name: string; value: number }[] = [];

    if (courseScore?.exam1_score) {
      data.push({
        name: 'Exam 1',
        value: courseScore.exam1_score,
      });
    }

    if (courseScore?.exam2_score) {
      data.push({
        name: 'Exam 2',
        value: courseScore.exam2_score,
      });
    }

    if (courseScore?.exam3_score) {
      data.push({
        name: 'Exam 3',
        value: courseScore.exam3_score,
      });
    }

    if (courseScore?.final_score) {
      data.push({
        name: 'Final',
        value: courseScore.final_score,
      });
    }

    return data;
  };

  const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--secondary))',
    'hsl(var(--accent))',
    'hsl(var(--destructive))',
  ];

  const chartData = performance.map((item) => ({
    subject: item.courses?.course_name || 'Unknown',
    attendance: item.attendance,
    engagement: calculateEngagement(
      item.attendance,
      item.study_hours_weekly || 0
    ),
    studyHours: item.study_hours_weekly || 0,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />

      <div className="container mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">
            Welcome, {profile?.name}!
          </h1>

          <p className="text-muted-foreground">
            {profile?.department} • Semester {profile?.semester}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <div className="md:col-span-2 lg:col-span-1">
            <CGPAGauge value={prediction?.predicted_cgpa || 0} />
          </div>

          <Card
            className="glass-card cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate('/class-rankings')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Rankings
              </CardTitle>

              <CardDescription>
                Click to view full rankings
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Institution Average</span>
                  <span className="font-bold">
                    {prediction?.predicted_average?.toFixed(1)}%
                  </span>
                </div>

                <Progress
                  value={prediction?.predicted_average || 0}
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Topper Score</span>
                  <span className="font-bold">
                    {prediction?.predicted_topper?.toFixed(1)}%
                  </span>
                </div>

                <Progress
                  value={prediction?.predicted_topper || 0}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI Recommendation
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-sm">
                {prediction?.recommendation ||
                  'Complete your scores to get personalized recommendations.'}
              </p>

              {prediction?.focus_subject && (
                <div className="mt-4">
                  <span className="text-xs text-muted-foreground">
                    Focus Subject:
                  </span>

                  <Badge variant="destructive" className="ml-2">
                    {prediction.focus_subject}
                  </Badge>
                </div>
              )}

              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRecalculatePrediction}
                  disabled={isPredicting}
                  className="w-full"
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${
                      isPredicting ? 'animate-spin' : ''
                    }`}
                  />

                  {isPredicting ? 'Recalculating...' : 'Recalculate'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {regressionPrediction && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold gradient-text">
                Prediction Analysis
              </h2>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAnalysis(!showAnalysis)}
              >
                {showAnalysis ? 'Hide Details' : 'Show Details'}
              </Button>
            </div>

            {showAnalysis && (
              <PredictionAnalysis
                predictedCGPA={regressionPrediction.predictedCGPA}
                currentCGPA={regressionPrediction.currentCGPA}
                features={regressionPrediction.features}
                recommendation={regressionPrediction.recommendation}
                focusSubject={regressionPrediction.focusSubject}
              />
            )}
          </div>
        )}

        {performance.length > 0 && (
          <Card className="glass-card mb-8">
            <CardHeader>
              <CardTitle>Subject-wise Performance</CardTitle>

              <CardDescription>
                Track your attendance, engagement, and study hours
              </CardDescription>
            </CardHeader>

            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis
                    dataKey="subject"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />

                  <YAxis />
                  <RechartsTooltip />
                  <Legend />

                  <Bar
                    dataKey="attendance"
                    fill="hsl(var(--primary))"
                    name="Attendance %"
                  />

                  <Bar
                    dataKey="engagement"
                    fill="hsl(var(--secondary))"
                    name="Engagement %"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {performance.length > 0 && (
          <>
            {performance.filter((item) => !item.courses?.is_lab).length >
              0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4 gradient-text">
                  Theory Subjects (
                  {
                    performance.filter((item) => !item.courses?.is_lab)
                      .length
                  }
                  )
                </h2>

                <div className="grid gap-4 md:grid-cols-2">
                  {performance
                    .filter((item) => !item.courses?.is_lab)
                    .map((perf) => (
                      <Card
                        key={perf.id}
                        className="glass-card border-primary/20 cursor-pointer hover:border-primary/50 transition-all"
                        onClick={() => handleCourseClick(perf)}
                      >
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4" />
                              {perf.courses?.course_name}
                            </span>

                            {getTrendIcon(perf.trend)}
                          </CardTitle>

                          <CardDescription className="text-xs">
                            {perf.courses?.course_code}
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">
                                Attendance
                              </p>
                              <p className="text-lg font-bold">
                                {perf.attendance}%
                              </p>
                            </div>

                            <div>
                              <p className="text-muted-foreground">
                                Engagement
                              </p>
                              <p className="text-lg font-bold">
                                {calculateEngagement(
                                  perf.attendance,
                                  perf.study_hours_weekly || 0
                                )}
                                %
                              </p>
                            </div>

                            <div>
                              <p className="text-muted-foreground">
                                Study Hours
                              </p>
                              <p className="text-lg font-bold">
                                {(
                                  (perf.study_hours_weekly || 0) / 7
                                ).toFixed(1)}
                                h/day
                              </p>
                            </div>

                            <div>
                              <p className="text-muted-foreground">
                                Trend
                              </p>

                              <Badge
                                variant={
                                  perf.trend === 'Improving'
                                    ? 'default'
                                    : perf.trend === 'Declining'
                                      ? 'destructive'
                                      : 'secondary'
                                }
                              >
                                {perf.trend}
                              </Badge>
                            </div>
                          </div>

                          {(() => {
                            const courseScore = scores.find(
                              (score) =>
                                score.course_id === perf.course_id
                            );

                            if (!courseScore) return null;

                            return (
                              <div className="pt-3 border-t border-border/50">
                                <p className="text-xs text-muted-foreground mb-2 font-medium">
                                  Exam Scores
                                </p>

                                <div className="grid grid-cols-4 gap-2 text-sm">
                                  {courseScore.exam1_score !== null && (
                                    <div className="text-center">
                                      <p className="text-xs text-muted-foreground">
                                        Exam 1
                                      </p>
                                      <p className="font-bold">
                                        {courseScore.exam1_score}
                                      </p>
                                    </div>
                                  )}

                                  {courseScore.exam2_score !== null && (
                                    <div className="text-center">
                                      <p className="text-xs text-muted-foreground">
                                        Exam 2
                                      </p>
                                      <p className="font-bold">
                                        {courseScore.exam2_score}
                                      </p>
                                    </div>
                                  )}

                                  {courseScore.exam3_score !== null && (
                                    <div className="text-center">
                                      <p className="text-xs text-muted-foreground">
                                        Exam 3
                                      </p>
                                      <p className="font-bold">
                                        {courseScore.exam3_score}
                                      </p>
                                    </div>
                                  )}

                                  {courseScore.final_score !== null && (
                                    <div className="text-center">
                                      <p className="text-xs text-muted-foreground">
                                        Final
                                      </p>
                                      <p className="font-bold">
                                        {courseScore.final_score}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            )}

            {performance.filter((item) => item.courses?.is_lab).length >
              0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 gradient-text">
                  Laboratory Subjects (
                  {
                    performance.filter((item) => item.courses?.is_lab)
                      .length
                  }
                  )
                </h2>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {performance
                    .filter((item) => item.courses?.is_lab)
                    .map((perf) => (
                      <Card
                        key={perf.id}
                        className="glass-card border-secondary/20 cursor-pointer hover:border-secondary/50 transition-all"
                        onClick={() => handleCourseClick(perf)}
                      >
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between text-base">
                            <span className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4" />
                              {perf.courses?.course_name}
                            </span>

                            {getTrendIcon(perf.trend)}
                          </CardTitle>

                          <CardDescription className="text-xs">
                            {perf.courses?.course_code}
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-muted-foreground text-xs">
                                Attendance
                              </p>
                              <p className="text-base font-bold">
                                {perf.attendance}%
                              </p>
                            </div>

                            <div>
                              <p className="text-muted-foreground text-xs">
                                Engagement
                              </p>
                              <p className="text-base font-bold">
                                {calculateEngagement(
                                  perf.attendance,
                                  perf.study_hours_weekly || 0
                                )}
                                %
                              </p>
                            </div>

                            <div>
                              <p className="text-muted-foreground text-xs">
                                Study Hours
                              </p>
                              <p className="text-base font-bold">
                                {(
                                  (perf.study_hours_weekly || 0) / 7
                                ).toFixed(1)}
                                h/day
                              </p>
                            </div>

                            <div>
                              <p className="text-muted-foreground text-xs">
                                Trend
                              </p>

                              <Badge
                                variant={
                                  perf.trend === 'Improving'
                                    ? 'default'
                                    : perf.trend === 'Declining'
                                      ? 'destructive'
                                      : 'secondary'
                                }
                                className="text-xs"
                              >
                                {perf.trend}
                              </Badge>
                            </div>
                          </div>

                          {(() => {
                            const courseScore = scores.find(
                              (score) =>
                                score.course_id === perf.course_id
                            );

                            if (!courseScore) return null;

                            return (
                              <div className="pt-2 border-t border-border/50">
                                <p className="text-xs text-muted-foreground mb-2 font-medium">
                                  Exam Scores
                                </p>

                                <div className="grid grid-cols-4 gap-1 text-xs">
                                  {courseScore.exam1_score !== null && (
                                    <div className="text-center">
                                      <p className="text-[10px] text-muted-foreground">
                                        E1
                                      </p>
                                      <p className="font-bold">
                                        {courseScore.exam1_score}
                                      </p>
                                    </div>
                                  )}

                                  {courseScore.exam2_score !== null && (
                                    <div className="text-center">
                                      <p className="text-[10px] text-muted-foreground">
                                        E2
                                      </p>
                                      <p className="font-bold">
                                        {courseScore.exam2_score}
                                      </p>
                                    </div>
                                  )}

                                  {courseScore.exam3_score !== null && (
                                    <div className="text-center">
                                      <p className="text-[10px] text-muted-foreground">
                                        E3
                                      </p>
                                      <p className="font-bold">
                                        {courseScore.exam3_score}
                                      </p>
                                    </div>
                                  )}

                                  {courseScore.final_score !== null && (
                                    <div className="text-center">
                                      <p className="text-[10px] text-muted-foreground">
                                        Final
                                      </p>
                                      <p className="font-bold">
                                        {courseScore.final_score}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            )}
          </>
        )}

        {performance.length === 0 && (
          <Card className="glass-card">
            <CardContent className="text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />

              <h3 className="text-lg font-semibold mb-2">
                No Performance Data Yet
              </h3>

              <p className="text-muted-foreground">
                Start tracking your performance by adding scores and study
                metrics.
              </p>
            </CardContent>
          </Card>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                {selectedCourse?.courses?.course_name}
              </DialogTitle>
            </DialogHeader>

            {selectedCourse && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Course Code
                    </p>

                    <p className="font-semibold">
                      {selectedCourse.courses?.course_code}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Type
                    </p>

                    <Badge
                      variant={
                        selectedCourse.courses?.is_lab
                          ? 'secondary'
                          : 'default'
                      }
                    >
                      {selectedCourse.courses?.is_lab
                        ? 'Laboratory'
                        : 'Theory'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">
                      Attendance
                    </p>

                    <p className="text-2xl font-bold">
                      {selectedCourse.attendance}%
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">
                      Engagement
                    </p>

                    <p className="text-2xl font-bold">
                      {calculateEngagement(
                        selectedCourse.attendance,
                        selectedCourse.study_hours_weekly || 0
                      )}
                      %
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">
                      Study Hours
                    </p>

                    <p className="text-2xl font-bold">
                      {(
                        (selectedCourse.study_hours_weekly || 0) / 7
                      ).toFixed(1)}
                      h/day
                    </p>
                  </div>
                </div>

                {getCoursePieData(selectedCourse).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Exam Performance
                    </h3>

                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={getCoursePieData(selectedCourse)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) =>
                            `${name}: ${value}`
                          }
                          outerRadius={100}
                          fill="hsl(var(--primary))"
                          dataKey="value"
                        >
                          {getCoursePieData(selectedCourse).map(
                            (entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            )
                          )}
                        </Pie>

                        <RechartsTooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Trend:
                    </span>

                    <Badge
                      variant={
                        selectedCourse.trend === 'Improving'
                          ? 'default'
                          : selectedCourse.trend === 'Declining'
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      {getTrendIcon(selectedCourse.trend)}
                      <span className="ml-1">
                        {selectedCourse.trend}
                      </span>
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}