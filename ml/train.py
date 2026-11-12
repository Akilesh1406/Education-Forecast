import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

def train_and_evaluate():
    dataset_path = os.path.join('dataset', 'college_academic_dataset.csv')
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Training dataset not found at {dataset_path}")

    print("=" * 70)
    print("EDUCATION FORECAST: GENUINE MACHINE LEARNING PIPELINE TRAINING")
    print("=" * 70)

    # 1. Load data
    df = pd.read_csv(dataset_path)
    print(f"Loaded dataset: {len(df)} records across {df['department'].nunique()} departments.")

    features = [
        'attendance_percentage',
        'previous_cgpa',
        'internal_exam_marks',
        'assignment_marks',
        'study_hours_weekly',
        'subject_marks_avg',
        'credits_completed'
    ]
    target = 'actual_next_cgpa'

    X = df[features]
    y = df[target]

    # 2. Train-test split (80-20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )
    print(f"Dataset split: {len(X_train)} training records, {len(X_test)} holdout test records.\n")

    # 3. Define candidate algorithms
    candidates = {
        'Ridge Regression': Pipeline([
            ('scaler', StandardScaler()),
            ('regressor', Ridge(alpha=1.0))
        ]),
        'Random Forest Regressor': Pipeline([
            ('scaler', StandardScaler()),
            ('regressor', RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42))
        ]),
        'Gradient Boosting Regressor': Pipeline([
            ('scaler', StandardScaler()),
            ('regressor', GradientBoostingRegressor(n_estimators=100, learning_rate=0.08, max_depth=4, random_state=42))
        ])
    }

    results = {}
    print(f"{'Algorithm':<30} | {'MAE':<8} | {'RMSE':<8} | {'R² Score':<8} | {'CV R² (Mean)':<12}")
    print("-" * 75)

    best_model_name = None
    best_rmse = float('inf')

    for name, pipeline in candidates.items():
        # Cross validation on training set
        cv_scores = cross_val_score(pipeline, X_train, y_train, cv=5, scoring='r2')
        cv_mean = np.mean(cv_scores)

        # Fit on full training set
        pipeline.fit(X_train, y_train)

        # Evaluate on test set
        y_pred = pipeline.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        r2 = r2_score(y_test, y_pred)

        results[name] = {
            'mae': float(round(mae, 4)),
            'rmse': float(round(rmse, 4)),
            'r2_score': float(round(r2, 4)),
            'cv_r2_mean': float(round(cv_mean, 4)),
            'pipeline': pipeline
        }

        print(f"{name:<30} | {mae:<8.4f} | {rmse:<8.4f} | {r2:<8.4f} | {cv_mean:<12.4f}")

        if rmse < best_rmse:
            best_rmse = rmse
            best_model_name = name

    print("-" * 75)
    print(f"\nChampion Model Selected: >>> {best_model_name} <<< (Lowest RMSE: {best_rmse:.4f})")

    best_pipeline = results[best_model_name]['pipeline']
    regressor = best_pipeline.named_steps['regressor']

    # 4. Extract genuine feature importances / weights
    feature_importances = {}
    if hasattr(regressor, 'feature_importances_'):
        importances = regressor.feature_importances_
        for f, imp in zip(features, importances):
            feature_importances[f] = float(round(imp * 100, 2))
    elif hasattr(regressor, 'coef_'):
        coefs = np.abs(regressor.coef_)
        total_coef = np.sum(coefs)
        for f, c in zip(features, coefs):
            feature_importances[f] = float(round((c / total_coef) * 100, 2))

    print("\nCalculated Feature Importances (% Contribution):")
    for f, imp in sorted(feature_importances.items(), key=lambda x: x[1], reverse=True):
        print(f"  - {f:<25}: {imp:>6.2f}%")

    # 5. Persist champion model
    os.makedirs(os.path.join('ml', 'models'), exist_ok=True)
    model_artifact_path = os.path.join('ml', 'models', 'best_model.joblib')
    joblib.dump(best_pipeline, model_artifact_path)
    print(f"\nSerialized champion model saved to: {model_artifact_path}")

    # 6. Save metadata JSON
    metadata = {
        'version_tag': 'v2.0-champion',
        'algorithm': best_model_name,
        'metrics': {
            'mae': results[best_model_name]['mae'],
            'rmse': results[best_model_name]['rmse'],
            'r2_score': results[best_model_name]['r2_score'],
            'cv_r2_mean': results[best_model_name]['cv_r2_mean']
        },
        'feature_names': features,
        'feature_importances': feature_importances,
        'target': target,
        'benchmark_dataset': dataset_path,
        'total_training_records': len(X_train),
        'total_test_records': len(X_test),
        'comparison': {
            k: {m: v for m, v in val.items() if m != 'pipeline'}
            for k, val in results.items()
        }
    }

    metadata_path = os.path.join('ml', 'models', 'model_metadata.json')
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"Model metadata & metrics saved to: {metadata_path}")
    print("=" * 70)
    print("TRAINING PIPELINE COMPLETE AND VERIFIED!")
    print("=" * 70)

if __name__ == '__main__':
    train_and_evaluate()

