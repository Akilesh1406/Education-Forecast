
import Navigation from '@/components/Navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Award, TrendingUp, Trophy, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TopperData {
  student_id: string;
  name: string;
  email: string;
  department: string;
  predicted_cgpa: number;
  rank: number;
}

interface RankingPrediction {
  student_id: string;
  predicted_cgpa: number | null;
  profiles:
    | {
        name: string;
        email: string;
        department: string;
      }
    | {
        name: string;
        email: string;
        department: string;
      }[]
    | null;
}

export default function ClassRankings() {
  const { user } = useAuth();

  const [toppers, setToppers] = useState<TopperData[]>([]);
  const [avgCGPA, setAvgCGPA] = useState<number>(0);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const { data: predictionsData, error } = await supabase
          .from('predictions')
          .select(`
            predicted_cgpa,
            student_id,
            created_at,
            profiles!inner (
              name,
              email,
              department
            )
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching predictions:', error);
          return;
        }

        if (predictionsData && predictionsData.length > 0) {
          const predictions =
            predictionsData as unknown as RankingPrediction[];

          const studentMap = new Map<string, TopperData>();

          predictions.forEach((pred) => {
            const profile = Array.isArray(pred.profiles)
              ? pred.profiles[0]
              : pred.profiles;

            if (!profile || pred.predicted_cgpa === null) {
              return;
            }

            const existing = studentMap.get(pred.student_id);

            if (
              !existing ||
              existing.predicted_cgpa < pred.predicted_cgpa
            ) {
              studentMap.set(pred.student_id, {
                student_id: pred.student_id,
                predicted_cgpa: pred.predicted_cgpa,
                name: profile.name,
                email: profile.email,
                department: profile.department,
                rank: 0,
              });
            }
          });

          const rankedStudents = Array.from(studentMap.values())
            .sort(
              (a, b) => b.predicted_cgpa - a.predicted_cgpa
            )
            .map((student, index) => ({
              ...student,
              rank: index + 1,
            }));

          setToppers(rankedStudents.slice(0, 10));
          setTotalStudents(rankedStudents.length);

          const total = rankedStudents.reduce(
            (sum, student) => sum + student.predicted_cgpa,
            0
          );

          setAvgCGPA(
            rankedStudents.length > 0
              ? total / rankedStudents.length
              : 0
          );

          const userEntry = rankedStudents.find(
            (student) => student.student_id === user?.id
          );

          setUserRank(userEntry?.rank ?? null);
        } else {
          setToppers([]);
          setTotalStudents(0);
          setAvgCGPA(0);
          setUserRank(null);
        }
      } catch (error: unknown) {
        console.error('Error in fetchRankings:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchRankings();
    } else {
      setLoading(false);
    }
  }, [user]);

  const getMedalColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-orange-600';
    return 'text-muted-foreground';
  };

  const getMedalIcon = (rank: number) => {
    if (rank <= 3) {
      return (
        <Trophy className={`w-6 h-6 ${getMedalColor(rank)}`} />
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto p-8">
          <div className="text-center">Loading rankings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />

      <div className="container mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">
            Class Rankings
          </h1>
          <p className="text-muted-foreground">
            Top performers and institution statistics
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Institution Average
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold gradient-text">
                {avgCGPA.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                CGPA
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Top Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold gradient-text">
                {toppers[0]?.predicted_cgpa.toFixed(2) || 'N/A'}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {toppers[0]?.name || 'No data'}
              </p>
            </CardContent>
          </Card>

          {userRank !== null && (
            <Card className="glass-card border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Your Rank
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold gradient-text">
                  #{userRank}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Out of {totalStudents} students
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Toppers List */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Top 10 Students
            </CardTitle>
            <CardDescription>
              Highest predicted CGPA rankings
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {toppers.map((topper) => (
                <div
                  key={topper.student_id}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                    topper.email === user?.email
                      ? 'bg-primary/10 border-primary/50'
                      : 'bg-card/50 border-border/50'
                  }`}
                >
                  <div className="flex items-center justify-center w-12">
                    {getMedalIcon(topper.rank) || (
                      <span className="text-xl font-bold text-muted-foreground">
                        {topper.rank}
                      </span>
                    )}
                  </div>

                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                      {topper.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {topper.name}
                      </h3>

                      {topper.email === user?.email && (
                        <Badge variant="default" className="text-xs">
                          You
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {topper.department}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold gradient-text">
                      {topper.predicted_cgpa.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      CGPA
                    </p>
                  </div>
                </div>
              ))}

              {toppers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No ranking data available yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
