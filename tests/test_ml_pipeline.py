import os
import json
import joblib
import unittest
import numpy as np
import pandas as pd

class TestMLPipeline(unittest.TestCase):
    def setUp(self):
        self.model_path = os.path.join('ml', 'models', 'best_model.joblib')
        self.metadata_path = os.path.join('ml', 'models', 'model_metadata.json')
        self.dataset_path = os.path.join('dataset', 'college_academic_dataset.csv')

    def test_artifacts_exist(self):
        """Verify model artifact and metadata files exist."""
        self.assertTrue(os.path.exists(self.model_path), "Model .joblib file must exist")
        self.assertTrue(os.path.exists(self.metadata_path), "Metadata .json file must exist")
        self.assertTrue(os.path.exists(self.dataset_path), "Benchmark dataset must exist")

    def test_metadata_structure(self):
        """Verify metadata contains valid evaluation metrics."""
        with open(self.metadata_path, 'r') as f:
            meta = json.load(f)
        self.assertIn('metrics', meta)
        self.assertIn('feature_names', meta)
        self.assertIn('feature_importances', meta)
        self.assertGreater(meta['metrics']['r2_score'], 0.85, "R² score should be >= 0.85")
        self.assertLess(meta['metrics']['mae'], 0.50, "MAE should be < 0.50 on a 10.0 scale")

    def test_model_inference_boundaries(self):
        """Verify model returns predictions within valid CGPA scale [0.0, 10.0]."""
        pipeline = joblib.load(self.model_path)
        with open(self.metadata_path, 'r') as f:
            meta = json.load(f)

        features = meta['feature_names']
        # High performing student
        high_student = pd.DataFrame([{
            'attendance_percentage': 95.0,
            'previous_cgpa': 9.2,
            'internal_exam_marks': 92.0,
            'assignment_marks': 95.0,
            'study_hours_weekly': 25.0,
            'subject_marks_avg': 90.0,
            'credits_completed': 80
        }])[features]

        # Struggling student
        low_student = pd.DataFrame([{
            'attendance_percentage': 55.0,
            'previous_cgpa': 5.0,
            'internal_exam_marks': 50.0,
            'assignment_marks': 55.0,
            'study_hours_weekly': 6.0,
            'subject_marks_avg': 52.0,
            'credits_completed': 40
        }])[features]

        pred_high = float(pipeline.predict(high_student)[0])
        pred_low = float(pipeline.predict(low_student)[0])

        self.assertGreaterEqual(pred_high, 8.0, "High student should predict >= 8.0")
        self.assertLessEqual(pred_high, 10.0, "High student should not exceed 10.0")
        self.assertLess(pred_low, 6.5, "Low student should predict lower than 6.5")
        self.assertGreaterEqual(pred_low, 0.0, "Low student should be >= 0.0")
        self.assertGreater(pred_high, pred_low, "High student must predict higher than low student")

if __name__ == '__main__':
    unittest.main()

