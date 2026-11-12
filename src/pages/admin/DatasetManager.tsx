import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { CSVValidatorService } from '@/services/csvValidator';
import type { CSVValidationReport } from '@/types';
import type { Tables } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  UploadCloud,
  FileCheck,
  AlertTriangle,
  Download,
  Database,
  History,
  CheckCircle2,
  FileText,
  Loader2,
} from 'lucide-react';

export default function DatasetManager() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<CSVValidationReport | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [uploadHistory, setUploadHistory] = useState<Tables<'dataset_uploads'>[]>([]);

  useEffect(() => {
    fetchUploadHistory();
  }, []);

  const fetchUploadHistory = async () => {
    try {
      const { data } = await supabase
        .from('dataset_uploads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      setUploadHistory(data || []);
    } catch (err) {
      console.warn('Could not fetch upload history:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.name.endsWith('.csv')) {
        toast({
          title: 'Invalid File Format',
          description: 'Please upload a standard comma-separated .csv file.',
          variant: 'destructive',
        });
        return;
      }
      setFile(selected);
      processFile(selected);
    }
  };

  const processFile = (selectedFile: File) => {
    setIsValidating(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const validationReport = CSVValidatorService.validate(selectedFile.name, text);
      setReport(validationReport);
      setIsValidating(false);

      if (validationReport.invalid_rows === 0 && validationReport.valid_rows > 0) {
        toast({
          title: 'Validation Successful',
          description: `All ${validationReport.valid_rows} records passed academic integrity checks.`,
        });
      } else if (validationReport.invalid_rows > 0) {
        toast({
          title: 'Validation Warnings Detected',
          description: `Found ${validationReport.invalid_rows} records with validation errors.`,
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleDownloadTemplate = () => {
    const templateCSV =
      'registration_number,name,department,semester,attendance_percentage,previous_cgpa,internal_exam_marks,assignment_marks,study_hours_weekly,subject_marks_avg,credits_completed,actual_next_cgpa\n' +
      'STU2024001,Aarav Sharma,Artificial Intelligence & Data Science,4,88.5,8.42,85.0,92.0,18.5,84.0,64,8.55\n' +
      'STU2024002,Priya Patel,Computer Science & Engineering,4,92.0,8.85,90.5,95.0,22.0,89.5,64,8.92\n' +
      'STU2024003,Rahul Verma,Information Technology,4,68.0,6.20,62.0,70.0,10.0,64.0,60,6.35';

    const blob = new Blob([templateCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'student_academic_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadErrorReport = () => {
    if (!report) return;
    const errorCsv = CSVValidatorService.generateErrorReportCSV(report);
    const blob = new Blob([errorCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `errors_${report.filename}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportToDatabase = async () => {
    if (!report || !user) return;
    setIsImporting(true);

    try {
      const result = await CSVValidatorService.importValidRows(report, user.id);
      if (result.success) {
        toast({
          title: 'Import Complete',
          description: `Successfully ingested ${result.count} valid student records into Supabase.`,
        });
        fetchUploadHistory();
      } else {
        toast({
          title: 'Import Failed',
          description: result.error || 'Failed to import records.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <AppLayout pageTitle="Dataset Management & Validation">
      <div className="space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dataset Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Upload, validate, and import academic batches for machine-learning training and forecasting.
            </p>
          </div>
          <Button variant="outline" onClick={handleDownloadTemplate} className="gap-2">
            <Download className="w-4 h-4" />
            Download Official Template
          </Button>
        </div>

        {/* Upload Drop Zone Card */}
        <Card className="border-dashed border-2 bg-card/50 hover:bg-card/80 transition-colors">
          <CardContent className="pt-6">
            <label className="flex flex-col items-center justify-center cursor-pointer p-8 rounded-xl">
              <div className="p-4 rounded-full bg-primary/10 text-primary mb-4">
                <UploadCloud className="w-8 h-8" />
              </div>
              <p className="font-semibold text-base mb-1">
                {file ? file.name : 'Click or drag CSV dataset file here'}
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Strict format: Registration No, Name, Department, Semester, Attendance, Previous CGPA, Marks
              </p>
              <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
              <Button type="button" variant="secondary" size="sm" className="pointer-events-none">
                Browse Files
              </Button>
            </label>
          </CardContent>
        </Card>

        {/* Validation Report Section */}
        {isValidating && (
          <div className="flex items-center justify-center p-8 gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span>Validating student records against academic rules...</span>
          </div>
        )}

        {report && !isValidating && (
          <div className="space-y-6 animate-in fade-in-50">
            {/* Metric KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                    <span>Total Rows Processed</span>
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{report.total_rows}</div>
                  <p className="text-xs text-muted-foreground mt-1">From file: {report.filename}</p>
                </CardContent>
              </Card>

              <Card className="border-emerald-500/20 bg-emerald-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                    <span>Valid Records</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {report.valid_rows}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Ready for database import</p>
                </CardContent>
              </Card>

              <Card className="border-rose-500/20 bg-rose-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center justify-between">
                    <span>Rejected Records</span>
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                    {report.invalid_rows}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Failed validation constraints</p>
                </CardContent>
              </Card>
            </div>

            {/* Error Summary Alert if any errors found */}
            {report.invalid_rows > 0 && (
              <Card className="border-rose-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-rose-600 dark:text-rose-400 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Detected Data Integrity Issues
                    </span>
                    <Button variant="outline" size="sm" onClick={handleDownloadErrorReport} className="gap-2">
                      <Download className="w-3.5 h-3.5" />
                      Export Error Log (CSV)
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    The following issues were identified. Review row details below:
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {Object.entries(report.errors_summary).map(([err, count]) => (
                      <div key={err} className="flex items-center justify-between p-2 rounded bg-muted/40 text-xs">
                        <span className="font-medium text-foreground">{err}</span>
                        <Badge variant="destructive" className="text-[10px]">
                          {count} occurrence{count > 1 ? 's' : ''}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ingestion Action Bar */}
            <div className="flex items-center justify-end gap-3 p-4 rounded-xl border bg-card">
              <Button
                onClick={handleImportToDatabase}
                disabled={report.valid_rows === 0 || isImporting}
                className="gap-2 bg-primary"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Ingesting Records...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    Import {report.valid_rows} Valid Records to Supabase
                  </>
                )}
              </Button>
            </div>

            {/* Data Preview Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Data Batch Preview (First 15 Rows)</CardTitle>
                <CardDescription>Review preview rows and validation status</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Reg No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Dept</TableHead>
                      <TableHead>Attendance</TableHead>
                      <TableHead>Prev CGPA</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.rows.slice(0, 15).map((row) => (
                      <TableRow key={row.row_number} className={!row.is_valid ? 'bg-destructive/5' : undefined}>
                        <TableCell className="font-mono text-xs">{row.row_number}</TableCell>
                        <TableCell className="font-mono text-xs">{row.registration_number}</TableCell>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell className="text-xs">{row.department}</TableCell>
                        <TableCell>{row.attendance_percentage}%</TableCell>
                        <TableCell>{row.previous_cgpa.toFixed(2)}</TableCell>
                        <TableCell>
                          {row.is_valid ? (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[11px]">
                              Valid
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[10px]" title={row.errors.join(', ')}>
                              {row.errors[0]}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Upload History Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="w-4 h-4" />
              Upload & Ingestion Audit History
            </CardTitle>
            <CardDescription>Audit records of previous dataset imports</CardDescription>
          </CardHeader>
          <CardContent>
            {uploadHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No datasets uploaded yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Filename</TableHead>
                    <TableHead>Total Rows</TableHead>
                    <TableHead>Valid</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploadHistory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">{item.filename}</TableCell>
                      <TableCell>{item.total_rows}</TableCell>
                      <TableCell className="text-emerald-600 font-medium">{item.valid_rows}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-xs">
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

