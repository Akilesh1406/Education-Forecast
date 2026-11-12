import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

def evaluate():
    model_path = os.path.join('ml', 'models', 'best_model.joblib')
    metadata_path = os.path.join('ml', 'models', 'model_metadata.json')
    dataset_path = os.path.join('dataset', 'college_academic_dataset.csv')

    if not os.path.exists(model_path) or not os.path.exists(metadata_path):
        print("Model or metadata not found. Run ml/train.py first.")
        return

    pipeline = joblib.load(model_path)
    with open(metadata_path, 'r') as f:
        meta = json.load(f)

    df = pd.read_csv(dataset_path)
    features = meta['feature_names']
    X = df[features]
    y_true = df['actual_next_cgpa']

    y_pred = pipeline.predict(X)

    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2 = r2_score(y_true, y_pred)

    print("=" * 60)
    print("MODEL EVALUATION REPORT")
    print("=" * 60)
    print(f"Algorithm:       {meta['algorithm']}")
    print(f"Version:         {meta['version_tag']}")
    print(f"Dataset Records: {len(df)}")
    print(f"Evaluation MAE:  {mae:.4f}")
    print(f"Evaluation RMSE: {rmse:.4f}")
    print(f"Evaluation R²:   {r2:.4f}")
    print("-" * 60)
    print("Sample Inferences (Actual vs Predicted):")
    sample_indices = [0, 5, 12, 25, 50]
    for idx in sample_indices:
        print(f"Student {df.loc[idx, 'name']:<20} | Prev: {df.loc[idx, 'previous_cgpa']:.2f} | Att: {df.loc[idx, 'attendance_percentage']:.1f}% | Actual: {y_true[idx]:.2f} | Pred: {y_pred[idx]:.2f} | Err: {abs(y_true[idx] - y_pred[idx]):.2f}")
    print("=" * 60)

if __name__ == '__main__':
    evaluate()

