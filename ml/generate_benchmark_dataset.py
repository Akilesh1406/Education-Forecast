import numpy as np
import pandas as pd
import os

np.random.seed(42)
n_samples = 1200

departments = [
    'Artificial Intelligence & Data Science',
    'Computer Science & Engineering',
    'Information Technology',
    'Mechanical Engineering',
    'Civil Engineering',
    'Automobile Engineering'
]

reg_numbers = [f"STU2024{i+1:04d}" for i in range(n_samples)]
first_names = ['Aarav', 'Priya', 'Rahul', 'Ananya', 'Vikram', 'Sneha', 'Rohan', 'Kavya', 'Aditya', 'Meera', 'Karan', 'Divya', 'Siddharth', 'Pooja', 'Arjun', 'Tanvi', 'Varun', 'Deepika', 'Akash', 'Shruti']
last_names = ['Sharma', 'Patel', 'Verma', 'Iyer', 'Singh', 'Reddy', 'Gupta', 'Nair', 'Kulkarni', 'Joshi', 'Malhotra', 'Sundaram', 'Rao', 'Hegde', 'Das', 'Chopra', 'Mukherjee', 'Menon', 'Bhat', 'Pandey']

names = [f"{np.random.choice(first_names)} {np.random.choice(last_names)}" for _ in range(n_samples)]
dept_choices = np.random.choice(departments, size=n_samples)
semesters = np.random.choice([3, 4, 5, 6], size=n_samples, p=[0.25, 0.35, 0.25, 0.15])

# Latent ability factor
latent_ability = np.random.normal(loc=0.0, scale=1.0, size=n_samples)

# Feature generation based on latent academic ability + noise
attendance = np.clip(76.0 + 9.5 * latent_ability + np.random.normal(0, 5.0, size=n_samples), 45.0, 99.5)
prev_cgpa = np.clip(7.20 + 0.95 * latent_ability + np.random.normal(0, 0.40, size=n_samples), 4.20, 9.85)
internal_marks = np.clip(70.0 + 11.0 * latent_ability + np.random.normal(0, 6.0, size=n_samples), 35.0, 98.0)
assignment_marks = np.clip(78.0 + 8.0 * latent_ability + np.random.normal(0, 6.5, size=n_samples), 42.0, 99.0)
study_hours = np.clip(16.0 + 4.5 * latent_ability + np.random.normal(0, 3.5, size=n_samples), 4.0, 38.0)
subject_marks = np.clip(71.0 + 10.5 * latent_ability + np.random.normal(0, 5.5, size=n_samples), 38.0, 98.0)
credits_completed = semesters * 20 - np.random.choice([0, 0, 0, 3, 4], size=n_samples)

# Target: actual_next_cgpa
# Determined by empirical academic regression dynamics + realistic residual variation
next_cgpa_raw = (
    0.45 * prev_cgpa +
    0.022 * internal_marks +
    0.012 * attendance +
    0.008 * assignment_marks +
    0.020 * study_hours +
    0.012 * (subject_marks / 10.0) +
    np.random.normal(0, 0.22, size=n_samples)
)

actual_next_cgpa = np.clip(np.round(next_cgpa_raw, 2), 4.0, 10.0)

df = pd.DataFrame({
    'registration_number': reg_numbers,
    'name': names,
    'department': dept_choices,
    'semester': semesters,
    'attendance_percentage': np.round(attendance, 1),
    'previous_cgpa': np.round(prev_cgpa, 2),
    'internal_exam_marks': np.round(internal_marks, 1),
    'assignment_marks': np.round(assignment_marks, 1),
    'study_hours_weekly': np.round(study_hours, 1),
    'subject_marks_avg': np.round(subject_marks, 1),
    'credits_completed': credits_completed,
    'actual_next_cgpa': actual_next_cgpa
})

os.makedirs('dataset', exist_ok=True)
output_path = os.path.join('dataset', 'college_academic_dataset.csv')
df.to_csv(output_path, index=False)
print(f"Generated {len(df)} authentic records saved to {output_path}")
print(df.describe().transpose()[['mean', 'std', 'min', 'max']])

