# DataGuard AI Backend

FastAPI backend for the DataGuard AI Data Quality & ML Pipeline Gatekeeper.

## Features
- CSV upload and dataset registry
- Polars profiling
- Data quality dimensions and issue detection
- Isolation Forest anomaly detection
- Cleaning recommendations
- Cost/risk-aware Beam Search plan selection
- What-if cleaning simulation and apply flow
- ML readiness and heuristic ML-risk checks
- Pipeline Gate with hard safety checks
- Human approval/rejection endpoints
- Data Quality Passport/audit events
- MongoDB Atlas persistence with in-memory fallback for local demo
- CORS for Lovable/Vite frontend
- Docker and tests

## Run locally
```bash
python -m venv .venv
# Windows
.venv\\Scripts\\activate
# macOS/Linux
source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env   # Windows
# cp .env.example .env  # macOS/Linux
uvicorn app.main:app --reload
```
Open http://127.0.0.1:8000/docs

## MongoDB
Set `MONGO_URI` and `MONGO_DB` in `.env`. If MongoDB is not configured/reachable, the backend uses in-memory metadata so the API can still be demoed.

## Frontend integration
Set the frontend API base URL to `http://127.0.0.1:8000`. The API paths intentionally follow the contract documented in the uploaded Lovable project:
POST `/api/datasets/upload`
GET `/api/datasets`
GET `/api/datasets/{dataset_id}`
POST `/api/datasets/{dataset_id}/analyze`
GET `/api/datasets/{dataset_id}/quality`
GET `/api/datasets/{dataset_id}/anomalies`
GET `/api/datasets/{dataset_id}/cleaning`
POST `/api/datasets/{dataset_id}/cleaning/simulate`
POST `/api/datasets/{dataset_id}/cleaning/apply`
GET `/api/datasets/{dataset_id}/ml-readiness`
GET `/api/datasets/{dataset_id}/ml-risks`
GET `/api/datasets/{dataset_id}/gate`
POST `/api/datasets/{dataset_id}/gate/approve`
POST `/api/datasets/{dataset_id}/gate/reject`
GET `/api/datasets/{dataset_id}/passport`
GET `/api/datasets/{dataset_id}/monitoring`

## Important
Isolation Forest flags unusual records; an anomaly is not automatically an error. Leakage checks are heuristic unless the user supplies a target column and deployment-time feature availability rules. XGBoost/SHAP/MLflow dependencies are included for extension, while the gate itself also uses independent hard safety checks.
