import assert from 'node:assert';
import test from 'node:test';

// Simple CSV validator test logic matching CSVValidatorService rules
function validateCSVRow(row) {
  const errors = [];
  if (!row.registration_number) errors.push('Missing registration number');
  if (row.attendance_percentage < 0 || row.attendance_percentage > 100) errors.push('Invalid attendance');
  if (row.previous_cgpa < 0 || row.previous_cgpa > 10) errors.push('Invalid CGPA');
  if (row.internal_exam_marks < 0 || row.internal_exam_marks > 100) errors.push('Invalid internal marks');
  return { isValid: errors.length === 0, errors };
}

test('CSV Validator correctly passes valid academic student rows', () => {
  const validRow = {
    registration_number: 'STU2024001',
    attendance_percentage: 88.5,
    previous_cgpa: 8.42,
    internal_exam_marks: 85.0
  };
  const result = validateCSVRow(validRow);
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.errors.length, 0);
});

test('CSV Validator catches out-of-range attendance and negative CGPA', () => {
  const invalidRow = {
    registration_number: 'STU2024002',
    attendance_percentage: 125.0, // Invalid: > 100
    previous_cgpa: -1.5,          // Invalid: < 0
    internal_exam_marks: 85.0
  };
  const result = validateCSVRow(invalidRow);
  assert.strictEqual(result.isValid, false);
  assert.strictEqual(result.errors.length, 2);
});

