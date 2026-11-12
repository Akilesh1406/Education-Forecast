import type { CSVValidationReport, CSVValidationRow } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export class CSVValidatorService {
  static readonly REQUIRED_COLUMNS = [
    'registration_number',
    'name',
    'department',
    'semester',
    'attendance_percentage',
    'previous_cgpa',
    'internal_exam_marks',
    'assignment_marks',
    'study_hours_weekly',
    'subject_marks_avg',
    'credits_completed',
  ];

  /**
   * Parse raw CSV text safely supporting quoted fields and commas
   */
  static parseCSVText(csvText: string): { headers: string[]; rows: string[][] } {
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      return { headers: [], rows: [] };
    }

    const parseLine = (text: string): string[] => {
      const result: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(cur.trim().replace(/^["']|["']$/g, ''));
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim().replace(/^["']|["']$/g, ''));
      return result;
    };

    const headers = parseLine(lines[0]).map((h) => h.toLowerCase().trim().replace(/[\s-]+/g, '_'));
    const rows = lines.slice(1).map(parseLine);

    return { headers, rows };
  }

  /**
   * Validate CSV content against academic data integrity rules
   */
  static validate(filename: string, csvText: string): CSVValidationReport {
    const { headers, rows } = this.parseCSVText(csvText);

    // Check header matching
    const missingColumns = this.REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
    if (missingColumns.length > 0) {
      return {
        filename,
        total_rows: rows.length,
        valid_rows: 0,
        invalid_rows: rows.length,
        errors_summary: {
          [`Missing required columns: ${missingColumns.join(', ')}`]: rows.length,
        },
        rows: [],
      };
    }

    const colIndex = (col: string) => headers.indexOf(col);

    const validatedRows: CSVValidationRow[] = [];
    const seenRegNumbers = new Set<string>();
    const errorsSummary: Record<string, number> = {};

    const recordError = (err: string) => {
      errorsSummary[err] = (errorsSummary[err] || 0) + 1;
    };

    rows.forEach((row, idx) => {
      const rowNum = idx + 2; // 1-indexed, skipping header
      const rowErrors: string[] = [];

      const regNo = row[colIndex('registration_number')] || '';
      const name = row[colIndex('name')] || '';
      const department = row[colIndex('department')] || '';
      const semesterStr = row[colIndex('semester')] || '';
      const attendanceStr = row[colIndex('attendance_percentage')] || '';
      const prevCgpaStr = row[colIndex('previous_cgpa')] || '';
      const internalMarksStr = row[colIndex('internal_exam_marks')] || '';
      const assignmentMarksStr = row[colIndex('assignment_marks')] || '';
      const studyHoursStr = row[colIndex('study_hours_weekly')] || '';
      const subjectMarksStr = row[colIndex('subject_marks_avg')] || '';
      const creditsStr = row[colIndex('credits_completed')] || '';
      const actualNextStr = headers.includes('actual_next_cgpa') ? row[colIndex('actual_next_cgpa')] : '';

      // Check registration number & uniqueness
      if (!regNo) {
        rowErrors.push('Missing registration number');
        recordError('Missing registration number');
      } else if (seenRegNumbers.has(regNo.toUpperCase())) {
        rowErrors.push(`Duplicate registration number: ${regNo}`);
        recordError('Duplicate registration numbers');
      } else {
        seenRegNumbers.add(regNo.toUpperCase());
      }

      // Check name
      if (!name) {
        rowErrors.push('Missing student name');
        recordError('Missing student name');
      }

      // Check department
      if (!department) {
        rowErrors.push('Missing department');
        recordError('Missing department');
      }

      // Check semester (1 - 8)
      const semester = parseInt(semesterStr, 10);
      if (isNaN(semester) || semester < 1 || semester > 8) {
        rowErrors.push('Invalid semester (must be integer between 1 and 8)');
        recordError('Invalid semester range');
      }

      // Check attendance (0 - 100%)
      const attendance = parseFloat(attendanceStr);
      if (isNaN(attendance) || attendance < 0 || attendance > 100) {
        rowErrors.push('Invalid attendance percentage (must be between 0.0 and 100.0)');
        recordError('Invalid attendance percentage');
      }

      // Check previous CGPA (0.0 - 10.0)
      const prevCgpa = parseFloat(prevCgpaStr);
      if (isNaN(prevCgpa) || prevCgpa < 0 || prevCgpa > 10) {
        rowErrors.push('Invalid previous CGPA (must be between 0.00 and 10.00)');
        recordError('Invalid CGPA range');
      }

      // Check internal marks (0 - 100)
      const internalMarks = parseFloat(internalMarksStr);
      if (isNaN(internalMarks) || internalMarks < 0 || internalMarks > 100) {
        rowErrors.push('Invalid internal exam marks (must be between 0.0 and 100.0)');
        recordError('Invalid internal exam marks');
      }

      // Check assignment marks (0 - 100)
      const assignmentMarks = parseFloat(assignmentMarksStr);
      if (isNaN(assignmentMarks) || assignmentMarks < 0 || assignmentMarks > 100) {
        rowErrors.push('Invalid assignment marks (must be between 0.0 and 100.0)');
        recordError('Invalid assignment marks');
      }

      // Check study hours (0 - 168)
      const studyHours = parseFloat(studyHoursStr);
      if (isNaN(studyHours) || studyHours < 0 || studyHours > 80) {
        rowErrors.push('Invalid weekly study hours (must be between 0.0 and 80.0)');
        recordError('Invalid study hours');
      }

      // Check subject marks avg (0 - 100)
      const subjectMarks = parseFloat(subjectMarksStr);
      if (isNaN(subjectMarks) || subjectMarks < 0 || subjectMarks > 100) {
        rowErrors.push('Invalid subject marks average (must be between 0.0 and 100.0)');
        recordError('Invalid subject marks');
      }

      // Check credits completed
      const credits = parseInt(creditsStr, 10);
      if (isNaN(credits) || credits < 0 || credits > 250) {
        rowErrors.push('Invalid credits completed (must be positive integer)');
        recordError('Invalid credits completed');
      }

      // Optional actual next CGPA
      let actualNextCgpa: number | undefined = undefined;
      if (actualNextStr) {
        const parsedNext = parseFloat(actualNextStr);
        if (!isNaN(parsedNext) && parsedNext >= 0 && parsedNext <= 10) {
          actualNextCgpa = parsedNext;
        }
      }

      validatedRows.push({
        row_number: rowNum,
        registration_number: regNo,
        name,
        department,
        semester: isNaN(semester) ? 1 : semester,
        attendance_percentage: isNaN(attendance) ? 0 : attendance,
        previous_cgpa: isNaN(prevCgpa) ? 0 : prevCgpa,
        internal_exam_marks: isNaN(internalMarks) ? 0 : internalMarks,
        assignment_marks: isNaN(assignmentMarks) ? 0 : assignmentMarks,
        study_hours_weekly: isNaN(studyHours) ? 0 : studyHours,
        subject_marks_avg: isNaN(subjectMarks) ? 0 : subjectMarks,
        credits_completed: isNaN(credits) ? 0 : credits,
        actual_next_cgpa: actualNextCgpa,
        is_valid: rowErrors.length === 0,
        errors: rowErrors,
      });
    });

    const validRows = validatedRows.filter((r) => r.is_valid).length;
    const invalidRows = validatedRows.length - validRows;

    return {
      filename,
      total_rows: validatedRows.length,
      valid_rows: validRows,
      invalid_rows: invalidRows,
      errors_summary: errorsSummary,
      rows: validatedRows,
    };
  }

  /**
   * Export validation errors as a downloadable CSV
   */
  static generateErrorReportCSV(report: CSVValidationReport): string {
    const errorRows = report.rows.filter((r) => !r.is_valid);
    const headers = ['Row_Number', 'Registration_Number', 'Student_Name', 'Detected_Errors'];
    const lines = [
      headers.join(','),
      ...errorRows.map((r) =>
        [r.row_number, `"${r.registration_number}"`, `"${r.name}"`, `"${r.errors.join('; ')}"`].join(',')
      ),
    ];
    return lines.join('\n');
  }

  /**
   * Import valid rows into Supabase database with audit logging
   */
  static async importValidRows(report: CSVValidationReport, currentUserId: string): Promise<{ success: boolean; count: number; error?: string }> {
    const validRecords = report.rows.filter((r) => r.is_valid);
    if (validRecords.length === 0) {
      return { success: false, count: 0, error: 'No valid records to import.' };
    }

    try {
      // 1. Record dataset upload entry
      const { data: uploadEntry, error: uploadErr } = await supabase
        .from('dataset_uploads')
        .insert([
          {
            uploaded_by: currentUserId,
            filename: report.filename,
            total_rows: report.total_rows,
            valid_rows: report.valid_rows,
            invalid_rows: report.invalid_rows,
            status: 'imported',
            error_log: report.errors_summary,
          },
        ])
        .select('id')
        .single();

      if (uploadErr) {
        console.warn('Dataset upload record creation warning:', uploadErr);
      }

      // 2. Insert or update student profiles and academic records
      for (const record of validRecords) {
        // Find existing student or insert
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('user_id')
          .ilike('email', `${record.registration_number.toLowerCase()}@college.edu`)
          .maybeSingle();

        const studentUserId = existingProfile?.user_id || currentUserId;

        // Insert into academic_records
        await supabase
          .from('academic_records')
          .upsert(
            [
              {
                student_id: studentUserId,
                semester: record.semester,
                previous_cgpa: record.previous_cgpa,
                attendance_percentage: record.attendance_percentage,
                internal_exam_marks: record.internal_exam_marks,
                assignment_marks: record.assignment_marks,
                study_hours_weekly: record.study_hours_weekly,
                subject_marks_avg: record.subject_marks_avg,
                credits_completed: record.credits_completed,
                actual_sgpa: record.actual_next_cgpa || null,
              },
            ],
            { onConflict: 'student_id,semester' }
          );
      }

      // 3. Log audit action
      await supabase.from('audit_logs').insert([
        {
          user_id: currentUserId,
          action: 'DATASET_IMPORT',
          entity: 'dataset_uploads',
          entity_id: uploadEntry?.id || null,
          details: {
            filename: report.filename,
            records_imported: validRecords.length,
          },
        },
      ]);

      return { success: true, count: validRecords.length };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to import records.';
      return { success: false, count: 0, error: msg };
    }
  }
}

