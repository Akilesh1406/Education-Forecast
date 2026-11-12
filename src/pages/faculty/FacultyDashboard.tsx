import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MLService } from '@/services/mlService';
import type { AcademicFeatures, PredictionExplanation, RiskLevel } from '@/types';
import { RiskBadge } from '@/components/common/RiskBadge';
import { DashboardSkeleton } from '@/components/common/LoadingSkeleton';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  GraduationCap,
  AlertTriangle,
  Sparkles,
  Edit,
  Download,
  Search,
  CheckCircle2,
  TrendingUp,
  Loader2,
} from 'lucide-react';

interface StudentRecord {
  id: string;
  user_id: string;
  name: string;
  email: string;
  department: string;
  semester: number;
  attendance_percentage: number;
  previous_cgpa: number;
  internal_exam_marks: number;
  assignment_marks: number;
  study_hours_weekly: number;
  subject_marks_avg: number;
  credits_completed: number;
  predicted_cgpa: number | null;
  risk_category: RiskLevel;
}

export default function FacultyDashboard() {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Edit / Enter Marks Modal state
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formMarks, setFormMarks] = useState<AcademicFeatures>({
    attendance_percentage: 80,
    previous_cgpa: 7.5,
    internal_exam_marks: 70,
    assignment_marks: 80,
    study_hours_weekly: 16,
    subject_marks_avg: 70,
    credits_completed: 60,
  });

  useEffect(() => {
    fetchClassData();
  }, [user]);

  const fetchClassData = async () => {
    setLoading(true);
    try {
      // 1. Fetch student profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('name', { ascending: true });

      // 2. Fetch academic records
      const { data: recordsData } = await supabase
        .from('academic_records')
        .select('*');

      // 3. Fetch predictions
      const { data: predictionsData } = await supabase
        .from('predictions')
        .select('*');

      const profiles = profilesData || [];
      const records = recordsData || [];
      const predictions = predictionsData || [];

      // Combine into StudentRecords
      const combined: StudentRecord[] = profiles.map((p) => {
        const record = records.find((r) => r.student_id === p.user_id);
        const pred = predictions.find((pr) => pr.student_id === p.user_id);

        const attendance = record?.attendance_percentage ?? 82.0;
        const prevCgpa = record?.previous_cgpa ?? 7.4;
        const internal = record?.internal_exam_marks ?? 72.0;
        const assignment = record?.assignment_marks ?? 80.0;
        const studyHours = record?.study_hours_weekly ?? 16.0;
        const subjectMarks = record?.subject_marks_avg ?? 72.0;
        const credits = record?.credits_completed ?? p.semester * 20;

        let risk: RiskLevel = 'Low Risk';
        if (pred?.risk_category) {
          risk = pred.risk_category as RiskLevel;
        } else if (attendance < 75 || prevCgpa < 6.0) {
          risk = 'High Risk';
        } else if (prevCgpa < 7.5) {
          risk = 'Medium Risk';
        }

        return {
          id: p.id,
          user_id: p.user_id,
          name: p.name,
          email: p.email,
          department: p.department,
          semester: p.semester,
          attendance_percentage: attendance,
          previous_cgpa: prevCgpa,
          internal_exam_marks: internal,
          assignment_marks: assignment,
          study_hours_weekly: studyHours,
          subject_marks_avg: subjectMarks,
          credits_completed: credits,
          predicted_cgpa: pred?.predicted_cgpa ?? null,
          risk_category: risk,
        };
      });

      setStudents(combined);
    } catch (err) {
      console.warn('Error fetching class data:', err);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (student: StudentRecord) => {
    setEditingStudent(student);
    setFormMarks({
      attendance_percentage: student.attendance_percentage,
      previous_cgpa: student.previous_cgpa,
      internal_exam_marks: student.internal_exam_marks,
      assignment_marks: student.assignment_marks,
      study_hours_weekly: student.study_hours_weekly,
      subject_marks_avg: student.subject_marks_avg,
      credits_completed: student.credits_completed,
    });
    setIsDialogOpen(true);
  };

  const handleSaveMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setIsSaving(true);

    try {
      // 1. Calculate genuine machine-learning prediction
      const explanation = await MLService.predict(formMarks);

      // 2. Persist academic record in Supabase
      await supabase.from('academic_records').upsert(
        [
          {
            student_id: editingStudent.user_id,
            semester: editingStudent.semester,
            attendance_percentage: formMarks.attendance_percentage,
            previous_cgpa: formMarks.previous_cgpa,
            internal_exam_marks: formMarks.internal_exam_marks,
            assignment_marks: formMarks.assignment_marks,
            study_hours_weekly: formMarks.study_hours_weekly,
            subject_marks_avg: formMarks.subject_marks_avg,
            credits_completed: formMarks.credits_completed,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'student_id,semester' }
      );

      // 3. Persist prediction in Supabase
      await MLService.savePredictionToDatabase(
        editingStudent.user_id,
        formMarks.previous_cgpa,
        explanation
      );

      toast({
        title: 'Academic Record & Forecast Updated',
        description: `Predicted CGPA for ${editingStudent.name} is ${explanation.predicted_cgpa} (${explanation.risk_category}).`,
      });

      setIsDialogOpen(false);
      fetchClassData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update academic record.';
      toast({
        title: 'Update Error',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateBatchPredictions = async () => {
    setLoading(true);
    let updatedCount = 0;

    for (const s of students) {
      try {
        const features: AcademicFeatures = {
          attendance_percentage: s.attendance_percentage,
          previous_cgpa: s.previous_cgpa,
          internal_exam_marks: s.internal_exam_marks,
          assignment_marks: s.assignment_marks,
          study_hours_weekly: s.study_hours_weekly,
          subject_marks_avg: s.subject_marks_avg,
          credits_completed: s.credits_completed,
        };

        const explanation = await MLService.predict(features);
        await MLService.savePredictionToDatabase(s.user_id, s.previous_cgpa, explanation);
        updatedCount++;
      } catch (err) {
        console.warn(`Could not predict for ${s.name}:`, err);
      }
    }

    toast({
      title: 'Batch Forecasting Complete',
      description: `Generated authentic ML predictions for ${updatedCount} students.`,
    });

    fetchClassData();
  };

  const handleExportCSV = () => {
    const headers = [
      'Name',
      'Email',
      'Department',
      'Semester',
      'Attendance_%',
      'Previous_CGPA',
      'Internal_Marks',
      'Assignment_Marks',
      'Predicted_Next_CGPA',
      'Risk_Category',
    ];

    const rows = filteredStudents.map((s) => [
      `"${s.name}"`,
      `"${s.email}"`,
      `"${s.department}"`,
      s.semester,
      s.attendance_percentage,
      s.previous_cgpa,
      s.internal_exam_marks,
      s.assignment_marks,
      s.predicted_cgpa ?? 'N/A',
      `"${s.risk_category}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `class_academic_forecast_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter students based on search and selected risk
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRisk =
      riskFilter === 'all' || s.risk_category.toLowerCase().includes(riskFilter.toLowerCase());

    const matchesDept =
      departmentFilter === 'all' || s.department.toLowerCase().includes(departmentFilter.toLowerCase());

    return matchesSearch && matchesRisk && matchesDept;
  });

  const highRiskStudents = students.filter((s) => s.risk_category === 'High Risk');
  const avgAttendance =
    students.length > 0
      ? students.reduce((acc, s) => acc + s.attendance_percentage, 0) / students.length
      : 0;
  const avgCgpa =
    students.length > 0
      ? students.reduce((acc, s) => acc + s.previous_cgpa, 0) / students.length
      : 0;

  if (loading) {
    return (
      <AppLayout pageTitle="Faculty Academic Portal">
        <DashboardSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="Faculty Performance Portal">
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Faculty Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Oversee student cohorts, record internal scores, and track machine-learning academic risks.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
              <Download className="w-4 h-4" />
              Export Cohort (CSV)
            </Button>
            <Button size="sm" onClick={handleGenerateBatchPredictions} className="gap-2 bg-primary">
              <Sparkles className="w-4 h-4" />
              Recalculate All ML Forecasts
            </Button>
          </div>
        </div>

        {/* High Risk Interventions Alert Banner */}
        {highRiskStudents.length > 0 && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in-50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive text-destructive-foreground">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-destructive">
                  Academic Support Alert: {highRiskStudents.length} Students Flagged at High Risk
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Identified by attendance &lt; 75% or forecast CGPA &lt; 6.0. Targeted faculty intervention recommended.
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setRiskFilter('high')}
              className="text-xs"
            >
              Filter High Risk
            </Button>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Assigned Cohort</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Active student profiles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Class Average CGPA</CardTitle>
              <GraduationCap className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgCgpa.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Out of 10.0 scale</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Average Attendance</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgAttendance.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">Classroom engagement</p>
            </CardContent>
          </Card>

          <Card className="border-rose-500/20 bg-rose-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-rose-600 dark:text-rose-400">Needs Support</CardTitle>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                {highRiskStudents.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Require academic mentoring</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl border bg-card">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name or email..."
              className="pl-9 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-36 text-xs">
                <SelectValue placeholder="Risk Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-44 text-xs">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Artificial Intelligence">AI & DS</SelectItem>
                <SelectItem value="Computer Science">Computer Science</SelectItem>
                <SelectItem value="Information Technology">Information Tech</SelectItem>
                <SelectItem value="Mechanical">Mechanical</SelectItem>
                <SelectItem value="Civil">Civil</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Student Records Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Student Performance & Risk Registry</CardTitle>
            <CardDescription>
              Showing {filteredStudents.length} students matching active filters
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Prev CGPA</TableHead>
                  <TableHead>Internal Marks</TableHead>
                  <TableHead>Forecast CGPA</TableHead>
                  <TableHead>Risk Category</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No student records match your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.user_id}>
                      <TableCell>
                        <div className="font-semibold text-sm">{student.name}</div>
                        <div className="text-xs text-muted-foreground">{student.email}</div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {student.department} • Sem {student.semester}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-semibold ${
                            student.attendance_percentage < 75 ? 'text-destructive font-bold' : ''
                          }`}
                        >
                          {student.attendance_percentage.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="font-mono">{student.previous_cgpa.toFixed(2)}</TableCell>
                      <TableCell className="font-mono">{student.internal_exam_marks.toFixed(1)}</TableCell>
                      <TableCell>
                        {student.predicted_cgpa !== null ? (
                          <span className="font-bold text-primary font-mono text-sm">
                            {student.predicted_cgpa.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Pending</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <RiskBadge level={student.risk_category} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(student)}
                          className="gap-1.5 h-8 text-xs"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Update Marks
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Enter / Update Academic Information Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg">Update Academic Information</DialogTitle>
              <DialogDescription className="text-xs">
                Enter continuous assessment marks for{' '}
                <strong className="text-foreground">{editingStudent?.name}</strong>.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveMarks} className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="attendance">Attendance (%)</Label>
                  <Input
                    id="attendance"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formMarks.attendance_percentage}
                    onChange={(e) =>
                      setFormMarks({ ...formMarks, attendance_percentage: parseFloat(e.target.value) || 0 })
                    }
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="prevCgpa">Previous CGPA (0-10)</Label>
                  <Input
                    id="prevCgpa"
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={formMarks.previous_cgpa}
                    onChange={(e) =>
                      setFormMarks({ ...formMarks, previous_cgpa: parseFloat(e.target.value) || 0 })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="internalMarks">Internal Exam Marks (/100)</Label>
                  <Input
                    id="internalMarks"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formMarks.internal_exam_marks}
                    onChange={(e) =>
                      setFormMarks({ ...formMarks, internal_exam_marks: parseFloat(e.target.value) || 0 })
                    }
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="assignmentMarks">Assignment Marks (/100)</Label>
                  <Input
                    id="assignmentMarks"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formMarks.assignment_marks}
                    onChange={(e) =>
                      setFormMarks({ ...formMarks, assignment_marks: parseFloat(e.target.value) || 0 })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="studyHours">Weekly Study Hours</Label>
                  <Input
                    id="studyHours"
                    type="number"
                    step="0.5"
                    min="0"
                    max="60"
                    value={formMarks.study_hours_weekly}
                    onChange={(e) =>
                      setFormMarks({ ...formMarks, study_hours_weekly: parseFloat(e.target.value) || 0 })
                    }
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="subjectMarks">Subject Avg (/100)</Label>
                  <Input
                    id="subjectMarks"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formMarks.subject_marks_avg}
                    onChange={(e) =>
                      setFormMarks({ ...formMarks, subject_marks_avg: parseFloat(e.target.value) || 0 })
                    }
                    required
                  />
                </div>
              </div>

              <DialogFooter className="pt-3">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving} className="gap-2">
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Computing ML Forecast...
                    </>
                  ) : (
                    'Save & Run ML Forecast'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
