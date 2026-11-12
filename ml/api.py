import os
import json
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

app = FastAPI(
    title="Education Forecast - Machine Learning Inference API",
    description="Production-grade API for student academic forecasting and explainable AI recommendations.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Model Pipeline & Metadata
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models', 'best_model.joblib')
METADATA_PATH = os.path.join(os.path.dirname(__file__), 'models', 'model_metadata.json')

pipeline = None
metadata = None

def load_model():
    global pipeline, metadata
    if os.path.exists(MODEL_PATH) and os.path.exists(METADATA_PATH):
        pipeline = joblib.load(MODEL_PATH)
        with open(METADATA_PATH, 'r') as f:
            metadata = json.load(f)
        print("ML Model and metadata loaded successfully.")
    else:
        print("Warning: Model artifacts not found. Run ml/train.py first.")

load_model()

class AcademicFeatures(BaseModel):
    attendance_percentage: float = Field(..., ge=0.0, le=100.0, description="Attendance in %")
    previous_cgpa: float = Field(..., ge=0.0, le=10.0, description="Previous cumulative GPA")
    internal_exam_marks: float = Field(..., ge=0.0, le=100.0, description="Average internal exam score")
    assignment_marks: float = Field(..., ge=0.0, le=100.0, description="Average assignment score")
    study_hours_weekly: float = Field(..., ge=0.0, le=168.0, description="Self-study hours per week")
    subject_marks_avg: float = Field(..., ge=0.0, le=100.0, description="Average subject marks")
    credits_completed: int = Field(..., ge=0, le=300, description="Earned academic credits")

class PredictionResponse(BaseModel):
    predicted_cgpa: float
    risk_category: str
    confidence_score: float
    primary_risk_factor: str
    recommendations: List[str]
    model_version: str
    algorithm: str
    feature_contributions: List[Dict[str, Any]]

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "model_loaded": pipeline is not None,
        "version": metadata.get("version_tag", "unknown") if metadata else None
    }

@app.get("/model/metadata")
def get_metadata():
    if not metadata:
        raise HTTPException(status_code=503, detail="Model metadata is unavailable")
    return metadata

@app.post("/predict", response_model=PredictionResponse)
def predict(features: AcademicFeatures):
    if pipeline is None or metadata is None:
        raise HTTPException(status_code=503, detail="ML model is not loaded. Please train the model first.")

    # Create input DataFrame
    feature_names = metadata["feature_names"]
    input_data = pd.DataFrame([{
        'attendance_percentage': features.attendance_percentage,
        'previous_cgpa': features.previous_cgpa,
        'internal_exam_marks': features.internal_exam_marks,
        'assignment_marks': features.assignment_marks,
        'study_hours_weekly': features.study_hours_weekly,
        'subject_marks_avg': features.subject_marks_avg,
        'credits_completed': features.credits_completed
    }])[feature_names]

    # Predict
    raw_prediction = float(pipeline.predict(input_data)[0])
    predicted_cgpa = float(np.clip(round(raw_prediction, 2), 0.0, 10.0))

    # Determine Academic Risk Category
    # Transparent thresholds:
    # High Risk: predicted CGPA < 6.0 OR attendance < 75%
    # Medium Risk: 6.0 <= predicted CGPA < 7.5
    # Low Risk: predicted CGPA >= 7.5
    if predicted_cgpa < 6.0 or features.attendance_percentage < 75.0:
        risk_category = "High Risk"
    elif predicted_cgpa < 7.5:
        risk_category = "Medium Risk"
    else:
        risk_category = "Low Risk"

    # Explainable AI Feature Contributions
    importances = metadata.get("feature_importances", {})
    benchmarks = {
        'attendance_percentage': 80.0,
        'previous_cgpa': 7.5,
        'internal_exam_marks': 70.0,
        'assignment_marks': 80.0,
        'study_hours_weekly': 18.0,
        'subject_marks_avg': 72.0,
        'credits_completed': 60.0
    }

    labels = {
        'attendance_percentage': 'Attendance',
        'previous_cgpa': 'Previous CGPA',
        'internal_exam_marks': 'Internal Exams',
        'assignment_marks': 'Assignments',
        'study_hours_weekly': 'Study Hours',
        'subject_marks_avg': 'Subject Marks',
        'credits_completed': 'Credits'
    }

    contributions = []
    recommendations = []
    primary_risk_factor = "None (Good Standing)"

    student_dict = features.dict()
    for feat in feature_names:
        student_val = student_dict[feat]
        bench_val = benchmarks.get(feat, 50.0)
        diff = student_val - bench_val
        impact = "positive" if diff >= 0 else "negative"
        importance = importances.get(feat, 10.0)

        contributions.append({
            "feature": feat,
            "label": labels.get(feat, feat),
            "student_value": round(student_val, 2),
            "benchmark_value": bench_val,
            "impact": impact,
            "importance_pct": importance
        })

    # Sort contributions by importance
    contributions.sort(key=lambda x: x["importance_pct"], reverse=True)

    # Generate Data-Driven Personalized Recommendations
    if features.attendance_percentage < 75.0:
        recommendations.append(
            f"Attendance Alert: Current attendance ({features.attendance_percentage:.1f}%) is below the mandatory 75% threshold. Prioritize attending upcoming lectures to avoid detention."
        )
        primary_risk_factor = "Low Attendance"

    if features.internal_exam_marks < 60.0:
        recommendations.append(
            f"Internal Exams: Average score is {features.internal_exam_marks:.1f}/100. Schedule faculty mentoring and take weekly practice problem sets."
        )
        if primary_risk_factor == "None (Good Standing)":
            primary_risk_factor = "Internal Exam Performance"

    if features.study_hours_weekly < 14.0:
        recommendations.append(
            f"Study Schedule: Increase weekly self-study from {features.study_hours_weekly:.1f} hours to at least 18 hours (approx. 2.5 hours/day) for core subjects."
        )
        if primary_risk_factor == "None (Good Standing)":
            primary_risk_factor = "Insufficient Study Hours"

    if features.assignment_marks < 70.0:
        recommendations.append(
            "Assignments: Complete continuous evaluation assignments thoroughly before deadlines to secure baseline grading credits."
        )

    if not recommendations:
        if predicted_cgpa >= 8.5:
            recommendations.append("Outstanding trajectory! Maintain current study habits and consider participating in competitive academic projects or research.")
        else:
            recommendations.append("Solid academic trajectory. Consistent effort in internal exams and revision will further boost your next semester CGPA.")

    confidence = round(float(metadata.get("metrics", {}).get("r2_score", 0.95)) * 100, 1)

    return {
        "predicted_cgpa": predicted_cgpa,
        "risk_category": risk_category,
        "confidence_score": confidence,
        "primary_risk_factor": primary_risk_factor,
        "recommendations": recommendations,
        "model_version": metadata.get("version_tag", "v2.0-champion"),
        "algorithm": metadata.get("algorithm", "Ridge Regression"),
        "feature_contributions": contributions
    }

if __name__ == '__main__':
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)

