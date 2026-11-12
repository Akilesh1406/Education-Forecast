# 🎓 Education Forecast: Enterprise Academic Forecasting Platform

A production-ready, enterprise-level Education Analytics and Student CGPA Forecasting Platform. Built with **React 18**, **TypeScript**, **Vite**, **Tailwind CSS**, **Supabase**, and genuine **Scikit-Learn Machine Learning**.

---

## 🌟 Key Features

* **Real Machine Learning Pipeline:** Trained regression pipeline comparing Ridge Regression, Random Forest, and Gradient Boosting.
  * **Test $R^2$ Score:** `0.943` (5-fold Cross-Validation $R^2 = 0.955$)
  * **Mean Absolute Error (MAE):** `0.182` on a 10.0 CGPA scale
  * **Root Mean Squared Error (RMSE):** `0.230`
* **Explainable AI (XAI):** Real feature contribution breakdowns and personalized academic action recommendations.
* **Role-Based Access Control (RBAC):**
  * **Admin:** User role assignment, curriculum course registration, CSV dataset validation & ingestion, and audit logs.
  * **Faculty:** Cohort oversight, continuous assessment grading, high-risk student alerts, batch forecasting, and cohort CSV export.
  * **Student:** Personal CGPA radial gauge, AI forecast, factor impact progress, and actionable study guidance.
* **Dataset Management Engine:** Client-side & server-side CSV validation with error reporting, duplicate detection, and batch database ingestion.
* **Security & Privacy (FERPA Compliant):**
  * Strict Row Level Security (RLS) policies preventing students from accessing peer personal records.
  * Pseudonymous, masked leaderboard for privacy-safe peer benchmarking.
* **Enterprise SaaS Design:** Collapsible sidebar, topbar with user avatar menu, dark/light mode toggle, skeleton loaders, and responsive layouts.

---

## 📂 Project Architecture

```
Education-Forecast/
├── .env.example                      # Documented environment variables template
├── dataset/
│   ├── templates/
│   │   └── student_academic_template.csv # Clean CSV import template
│   └── college_academic_dataset.csv  # 1,200 student training & benchmark dataset
├── ml/
│   ├── train.py                      # Multi-algorithm ML training & comparison
│   ├── evaluate.py                   # Model evaluation, MAE/RMSE/R² metrics
│   ├── api.py                        # FastAPI / Python inference service
│   ├── requirements.txt              # Python dependencies
│   └── models/
│       ├── best_model.joblib         # Serialized Scikit-Learn pipeline
│       └── model_metadata.json       # Trained weights and feature importances
├── src/
│   ├── components/
│   │   ├── layout/                   # Enterprise AppLayout, Sidebar, TopNavbar
│   │   ├── common/                   # ThemeToggle, RiskBadge, LoadingSkeleton, EmptyState
│   │   ├── PredictionAnalysis.tsx    # Explainable AI factor contribution visualizer
│   │   ├── CGPAGauge.tsx             # Radial gauge component
│   │   └── ui/                       # shadcn/ui design primitives
│   ├── context/
│   │   └── AuthContext.tsx           # Session, role, and profile state provider
│   ├── hooks/
│   │   └── useAuth.tsx               # Auth hook
│   ├── integrations/supabase/
│   │   ├── client.ts                 # Supabase client instantiation
│   │   └── types.ts                  # Database types
│   ├── pages/
│   │   ├── Index.tsx                 # Landing page
│   │   ├── Auth.tsx                  # Sign in / Register with role selection
│   │   ├── StudentDashboard.tsx      # Student forecast & analytics portal
│   │   ├── faculty/
│   │   │   └── FacultyDashboard.tsx  # Faculty grading & risk intervention portal
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx    # Admin user management & course catalog
│   │   │   └── DatasetManager.tsx    # CSV validation & database ingestion
│   │   ├── Analytics.tsx             # Institution & department analytics
│   │   └── ClassRankings.tsx         # Privacy-compliant leaderboard
│   ├── services/
│   │   ├── mlService.ts              # ML client with FastAPI + client-side inference
│   │   └── csvValidator.ts           # Academic CSV validation & error reporting engine
│   └── types/
│       └── index.ts                  # Shared domain types
├── supabase/
│   └── migrations/
│       └── 20261112000000_enterprise_upgrade.sql # Hardened schema & RLS policies
└── tests/
    ├── test_ml_pipeline.py           # ML model unit tests
    └── test_csv_validator.mjs        # CSV validator unit tests
```

---

## 🚀 Quick Start Guide (For Beginners)

### Step 1: Clone and Install Frontend Dependencies
Open PowerShell or your terminal in the project directory:

```bash
# 1. Install Node.js packages
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:

```bash
# Windows PowerShell
Copy-Item .env.example .env
```

Your `.env` file should contain:
```env
VITE_SUPABASE_PROJECT_ID=agezjplcwosvftlmftmk
VITE_SUPABASE_URL=https://agezjplcwosvftlmftmk.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_sP5cdR2kObchnzkBmvIwqA_T4H7GYuv
VITE_ML_API_URL=http://localhost:8000
```

### Step 3: Run the Frontend Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 🤖 Machine Learning Pipeline Instructions

The project includes an authentic Scikit-Learn regression pipeline in Python.

### 1. Install Python ML Dependencies
Make sure Python 3.10+ is installed:
```bash
pip install -r ml/requirements.txt
```

### 2. Train and Compare Models
To train the Ridge, Random Forest, and Gradient Boosting models:
```bash
npm run ml:train
# or: python ml/train.py
```

Output:
```
======================================================================
EDUCATION FORECAST: GENUINE MACHINE LEARNING PIPELINE TRAINING
======================================================================
Loaded dataset: 1200 records across 6 departments.
Dataset split: 960 training records, 240 holdout test records.

Algorithm                      | MAE      | RMSE     | R² Score | CV R² (Mean)
---------------------------------------------------------------------------
Ridge Regression               | 0.1821   | 0.2300   | 0.9434   | 0.9552      
Random Forest Regressor        | 0.1992   | 0.2468   | 0.9348   | 0.9454      
Gradient Boosting Regressor    | 0.2018   | 0.2521   | 0.9320   | 0.9450      
---------------------------------------------------------------------------
Champion Model Selected: >>> Ridge Regression <<< (Lowest RMSE: 0.2300)
```

### 3. Evaluate the Model
```bash
npm run ml:evaluate
# or: python ml/evaluate.py
```

### 4. Start the FastAPI Inference Server
```bash
npm run ml:api
# or: python ml/api.py
```
* **Swagger API Documentation:** `http://localhost:8000/docs`
* **Prediction Endpoint:** `POST http://localhost:8000/predict`
* **Health Check:** `GET http://localhost:8000/health`

*(Note: If the Python API is not running, the frontend automatically falls back to client-side high-precision execution using the exact trained weights, guaranteeing zero downtime!)*

---

## 🧪 Running Automated Tests

Run the full automated test suite:

```bash
# Run CSV Validator unit tests
npm test

# Run ML Pipeline unit tests
npm run ml:test

# Check code quality and formatting
npm run lint

# Build production bundle
npm run build
```

---

## 🛡️ Database Migrations (Supabase)

The complete SQL migration script is located at:
`supabase/migrations/20261112000000_enterprise_upgrade.sql`

To apply it:
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **SQL Editor**.
3. Copy the contents of `supabase/migrations/20261112000000_enterprise_upgrade.sql` and click **Run**.
4. This will create all required tables (`departments`, `faculty_assignments`, `academic_records`, `model_versions`, `dataset_uploads`, `audit_logs`) and harden your Row Level Security policies.

---

## 📜 User Roles & Test Credentials

You can register accounts directly on the `/auth` page using the **Role** selector:
* **Student:** View personal CGPA gauge, next-semester forecast, and actionable study advice.
* **Faculty:** Oversee cohorts, update marks, generate student predictions, and identify high-risk students.
* **Administrator:** User management, course catalog, CSV dataset ingestion, and audit logs.
