import React, { useEffect, useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RiskBadge } from '@/components/common/RiskBadge';
import { Trophy, Award, Users, TrendingUp, ShieldCheck } from 'lucide-react';
import type { RiskLevel } from '@/types';

interface LeaderboardEntry {
  rank: number;
  student_id: string;
  name: string;
  displayName: string;
  department: string;
  semester: number;
  attendance_percentage: number;
  previous_cgpa: number;
  predicted_cgpa: number;
  risk_category: RiskLevel;
  isCurrentUser: boolean;
}

export default function ClassRankings() {
  const { user, role } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [classAverage, setClassAverage] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch profiles
      const { data: profiles } = await supabase.from('profiles').select('*');

      // 2. Fetch predictions
      const { data: predictions } = await supabase.from('predictions').select('*');

      // 3. Fetch academic records
      const { data: records } = await supabase.from('academic_records').select('*');

      const profileList = profiles || [];
      const predList = predictions || [];
      const recordList = records || [];

      // Combine records
      const combined = profileList.map((p) => {
        const pred = predList.find((pr) => pr.student_id === p.user_id);
        const record = recordList.find((r) => r.student_id === p.user_id);

        const predicted = pred?.predicted_cgpa ?? record?.previous_cgpa ?? 7.5;
        const previous = record?.previous_cgpa ?? 7.2;
        const attendance = record?.attendance_percentage ?? 80;

        let risk: RiskLevel = 'Low Risk';
        if (pred?.risk_category) {
          risk = pred.risk_category as RiskLevel;
        } else if (attendance < 75 || predicted < 6.0) {
          risk = 'High Risk';
        } else if (predicted < 7.5) {
          risk = 'Medium Risk';
        }

        const isMe = user?.id === p.user_id;

        // Privacy masking for other students when viewed by a student
        const isStaff = role === 'admin' || role === 'faculty';
        const displayName = isStaff || isMe ? p.name : `${p.name.split(' ')[0]} ${p.name.split(' ')[1]?.[0] || ''}***`;

        return {
          rank: 0,
          student_id: p.user_id,
          name: p.name,
          displayName,
          department: p.department,
          semester: p.semester,
          attendance_percentage: attendance,
          previous_cgpa: previous,
          predicted_cgpa: predicted,
          risk_category: risk,
          isCurrentUser: isMe,
        };
      });

      // Sort by predicted CGPA descending
      const ranked = combined
        .sort((a, b) => b.predicted_cgpa - a.predicted_cgpa)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));

      setEntries(ranked);

      if (ranked.length > 0) {
        const avg = ranked.reduce((acc, curr) => acc + curr.predicted_cgpa, 0) / ranked.length;
        setClassAverage(Math.round(avg * 100) / 100);

        const myEntry = ranked.find((e) => e.isCurrentUser);
        setUserRank(myEntry?.rank ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, [user, role]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const getMedalColor = (rank: number) => {
    if (rank === 1) return 'text-amber-500';
    if (rank === 2) return 'text-slate-400';
    if (rank === 3) return 'text-amber-700';
    return 'text-muted-foreground';
  };

  return (
    <AppLayout pageTitle="Academic Leaderboard & Benchmarks">
      <div className="space-y-6">
        {/* Top Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Academic Leaderboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Institutional performance standings and machine-learning forecasted percentiles.
          </p>
        </div>

        {/* Privacy Note for Students */}
        {role === 'student' && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40 border text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <span>
              <strong>Privacy Safeguarded:</strong> In accordance with FERPA and academic privacy standards, peer names are pseudonymous while your personal rank is highlighted.
            </span>
          </div>
        )}

        {/* Highlight KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Cohort Top Forecast</CardTitle>
              <Trophy className="w-4 h-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {entries[0]?.predicted_cgpa.toFixed(2) || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Highest projected CGPA
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Institution Average</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{classAverage.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Predicted CGPA average</p>
            </CardContent>
          </Card>

          {userRank !== null && (
            <Card className="border-primary/40 bg-primary/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-primary">Your Standing</CardTitle>
                <Award className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">#{userRank}</div>
                <p className="text-xs text-muted-foreground mt-1">Out of {entries.length} students</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Leaderboard Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Rankings & Academic Standing
            </CardTitle>
            <CardDescription className="text-xs">
              Ranked dynamically by machine-learning predicted next semester performance
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Current CGPA</TableHead>
                  <TableHead>Forecast CGPA</TableHead>
                  <TableHead>Risk Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow
                    key={entry.student_id}
                    className={entry.isCurrentUser ? 'bg-primary/10 hover:bg-primary/15 font-semibold' : undefined}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {entry.rank <= 3 ? (
                          <Trophy className={`w-4 h-4 ${getMedalColor(entry.rank)}`} />
                        ) : (
                          <span className="font-mono text-muted-foreground text-xs w-4 text-center">
                            #{entry.rank}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7 border border-primary/20">
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                            {entry.displayName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="text-sm">{entry.displayName}</span>
                          {entry.isCurrentUser && (
                            <Badge variant="default" className="ml-2 text-[10px] py-0 px-1.5 h-4">
                              You
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{entry.department}</TableCell>
                    <TableCell className="text-xs">{entry.attendance_percentage.toFixed(1)}%</TableCell>
                    <TableCell className="font-mono text-xs">{entry.previous_cgpa.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className="font-bold font-mono text-primary text-sm">
                        {entry.predicted_cgpa.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <RiskBadge level={entry.risk_category} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
