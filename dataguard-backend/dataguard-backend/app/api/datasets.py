from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse

from pathlib import Path
from datetime import datetime, timezone

from app.config import settings
from app.database.mongodb import store
from app.services.dataset_service import service
from app.schemas.models import (
    AnalyzeRequest,
    SimulationRequest,
    ApplyRequest,
    DecisionRequest,
)
from app.core.cleaning import apply_actions
from app.utils.data import read_csv


router = APIRouter(
    prefix="/api/datasets",
    tags=["datasets"],
)


# ============================================================
# HELPER
# ============================================================

def get_or_404(did):
    try:
        return service.get(did)
    except KeyError:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found",
        )


# ============================================================
# DATASET UPLOAD
# ============================================================

@router.post("/upload")
async def upload(file: UploadFile = File(...)):

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Filename is required",
        )

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="CSV format is required",
        )

    if (
        file.size
        and file.size > settings.max_upload_mb * 1024 * 1024
    ):
        raise HTTPException(
            status_code=413,
            detail="Dataset exceeds the current processing limit.",
        )

    path = (
        Path(settings.uploads_dir)
        / file.filename.replace("/", "_")
    )

    with open(path, "wb") as f:
        while chunk := await file.read(1024 * 1024):
            f.write(chunk)

    try:
        return service.create(
            file.filename,
            path,
        )

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Unable to process dataset: {e}",
        )


# ============================================================
# GET ALL DATASETS
# ============================================================

@router.get("")
def datasets():
    return store.all_datasets()


# ============================================================
# GET SINGLE DATASET
# ============================================================

@router.get("/{dataset_id}")
def dataset(dataset_id: str):
    return get_or_404(dataset_id)


# ============================================================
# ANALYZE DATASET
# ============================================================

@router.post("/{dataset_id}/analyze")
def analyze(
    dataset_id: str,
    req: AnalyzeRequest,
):

    try:
        return service.analyze(
            dataset_id,
            req.target_column,
        )

    except KeyError:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found",
        )

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Analysis failed: {e}",
        )


# ============================================================
# DATA QUALITY
# ============================================================

@router.get("/{dataset_id}/quality")
def quality(dataset_id: str):

    return (
        get_or_404(dataset_id)
        .get("analysis", {})
        .get("quality", {})
    )


# ============================================================
# ANOMALIES
# ============================================================

@router.get("/{dataset_id}/anomalies")
def anomalies(dataset_id: str):

    return (
        get_or_404(dataset_id)
        .get("analysis", {})
        .get("anomalies", {})
    )


# ============================================================
# CLEANING RECOMMENDATIONS
# ============================================================

@router.get("/{dataset_id}/cleaning")
def cleaning(dataset_id: str):

    return (
        get_or_404(dataset_id)
        .get("analysis", {})
        .get("cleaning", {})
    )


# ============================================================
# CLEANING SIMULATION
# ============================================================

@router.post("/{dataset_id}/cleaning/simulate")
def simulate(
    dataset_id: str,
    req: SimulationRequest,
):

    # --------------------------------------------------------
    # Get dataset
    # --------------------------------------------------------

    d = get_or_404(dataset_id)

    # --------------------------------------------------------
    # Get analysis
    # --------------------------------------------------------

    analysis = d.get("analysis")

    if not analysis:
        raise HTTPException(
            status_code=409,
            detail="Analyze dataset before cleaning simulation",
        )

    # --------------------------------------------------------
    # Read original dataset
    # --------------------------------------------------------

    before = read_csv(d["path"])

    # --------------------------------------------------------
    # Get selected actions
    #
    # If frontend does not send actions, use the
    # recommended cleaning plan from analysis.
    # --------------------------------------------------------

    actions = (
        req.actions
        or analysis
        .get("cleaning", {})
        .get("beam_search_plan", [])
    )

    if not actions:
        raise HTTPException(
            status_code=400,
            detail="No cleaning actions selected",
        )

    # --------------------------------------------------------
    # Apply cleaning actions
    # --------------------------------------------------------

    after = apply_actions(
        before,
        actions,
    )

    # --------------------------------------------------------
    # Quality before and after
    # --------------------------------------------------------

    from app.core.quality import quality_analysis

    q_before = analysis["quality"]["score"]

    q_after = quality_analysis(
        after,
        analysis.get("target_column"),
    )["score"]

    # --------------------------------------------------------
    # ML readiness after cleaning
    # --------------------------------------------------------

    original_readiness = analysis["ml_readiness"]["score"]

    readiness_after = min(
        100,
        round(
            original_readiness
            + (q_after - q_before) * 0.7
        ),
    )

    # --------------------------------------------------------
    # Missing percentage
    # --------------------------------------------------------

    total_missing = sum(
        after[column].null_count()
        for column in after.columns
    )

    total_cells = max(
        after.height * after.width,
        1,
    )

    missing_pct = round(
        total_missing / total_cells * 100,
        2,
    )

    # --------------------------------------------------------
    # Duplicate count
    # --------------------------------------------------------

    duplicate_count = (
        after.height
        - after.unique().height
    )

    # --------------------------------------------------------
    # Simulation response
    # --------------------------------------------------------

    return {
        "quality": q_after,
        "readiness": readiness_after,
        "missing": missing_pct,
        "duplicates": duplicate_count,
        "invalid": 0,
        "anomalies": (
            analysis
            .get("anomalies", {})
            .get("count", 0)
        ),
        "actions": actions,
    }


# ============================================================
# APPLY CLEANING
# ============================================================

@router.post("/{dataset_id}/cleaning/apply")
def apply(
    dataset_id: str,
    req: ApplyRequest,
):

    # --------------------------------------------------------
    # Get dataset
    # --------------------------------------------------------

    d = get_or_404(dataset_id)

    # --------------------------------------------------------
    # Get selected actions
    #
    # If actions are supplied by frontend, use them.
    # Otherwise use the recommended cleaning plan.
    # --------------------------------------------------------

    actions = (
        req.actions
        or d.get("analysis", {})
        .get("cleaning", {})
        .get("beam_search_plan", [])
    )

    if not actions:
        raise HTTPException(
            status_code=400,
            detail="No cleaning actions selected",
        )

    # --------------------------------------------------------
    # Read original dataset
    # --------------------------------------------------------

    before = read_csv(d["path"])

    # --------------------------------------------------------
    # Apply cleaning actions
    # --------------------------------------------------------

    try:
        after = apply_actions(
            before,
            actions,
        )

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Cleaning failed: {e}",
        )

    # --------------------------------------------------------
    # Create processed directory
    # --------------------------------------------------------

    processed_dir = (
        Path(settings.model_dir).parent
        / "processed"
    )

    processed_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    # --------------------------------------------------------
    # Output cleaned CSV
    # --------------------------------------------------------

    output_file = (
        processed_dir
        / f"{dataset_id}_cleaned.csv"
    )

    try:
        after.write_csv(output_file)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to create cleaned dataset: {e}",
        )

    # --------------------------------------------------------
    # Store audit event
    # --------------------------------------------------------

    store.event(
        dataset_id,
        "cleaning_applied",
        {
            "actions": actions,
            "approved_by": req.approved_by,
            "output": str(output_file),
        },
    )

    # --------------------------------------------------------
    # Download URL
    # --------------------------------------------------------

    download_url = (
        f"/api/datasets/"
        f"{dataset_id}/cleaning/download"
    )

    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return {
        "status": "applied",
        "dataset_id": dataset_id,
        "actions": actions,
        "output_file": str(output_file),
        "download_url": download_url,
        "filename": f"{dataset_id}_cleaned.csv",
        "rows": after.height,
        "columns": after.width,
    }


# ============================================================
# DOWNLOAD CLEANED DATASET
# ============================================================

@router.get("/{dataset_id}/cleaning/download")
def download_cleaned_dataset(dataset_id: str):

    # --------------------------------------------------------
    # Verify dataset exists
    # --------------------------------------------------------

    get_or_404(dataset_id)

    # --------------------------------------------------------
    # Locate processed directory
    # --------------------------------------------------------

    processed_dir = (
        Path(settings.model_dir).parent
        / "processed"
    )

    output_file = (
        processed_dir
        / f"{dataset_id}_cleaned.csv"
    )

    # --------------------------------------------------------
    # Check cleaned file
    # --------------------------------------------------------

    if not output_file.exists():
        raise HTTPException(
            status_code=404,
            detail="Cleaned dataset not found. Apply cleaning first.",
        )

    # --------------------------------------------------------
    # Return CSV file
    # --------------------------------------------------------

    return FileResponse(
        path=str(output_file),
        media_type="text/csv",
        filename=f"{dataset_id}_cleaned.csv",
    )


# ============================================================
# ML READINESS
# ============================================================

@router.get("/{dataset_id}/ml-readiness")
def ml_readiness(dataset_id: str):

    return (
        get_or_404(dataset_id)
        .get("analysis", {})
        .get("ml_readiness", {})
    )


# ============================================================
# ML RISKS
# ============================================================

@router.get("/{dataset_id}/ml-risks")
def ml_risks(dataset_id: str):

    return (
        get_or_404(dataset_id)
        .get("analysis", {})
        .get("ml_risks", [])
    )


# ============================================================
# PIPELINE GATE
# ============================================================

@router.get("/{dataset_id}/gate")
def gate(dataset_id: str):

    d = get_or_404(dataset_id)

    analysis = d.get("analysis", {})

    return analysis.get(
        "gate",
        d.get("gate", {}),
    )


# ============================================================
# APPROVE PIPELINE GATE
# ============================================================

@router.post("/{dataset_id}/gate/approve")
def approve(
    dataset_id: str,
    req: DecisionRequest,
):

    d = get_or_404(dataset_id)

    if "gate" not in d:
        d["gate"] = {}

    d["gate"]["decision"] = "Approved"

    d["gate"]["approved_by"] = (
        req.reason or "user"
    )

    store.put_dataset(d)

    store.event(
        dataset_id,
        "gate_approved",
        req.model_dump(),
    )

    return d["gate"]


# ============================================================
# REJECT PIPELINE GATE
# ============================================================

@router.post("/{dataset_id}/gate/reject")
def reject(
    dataset_id: str,
    req: DecisionRequest,
):

    d = get_or_404(dataset_id)

    if "gate" not in d:
        d["gate"] = {}

    d["gate"]["decision"] = "Blocked"

    d["gate"]["rejected_reason"] = req.reason

    store.put_dataset(d)

    store.event(
        dataset_id,
        "gate_rejected",
        req.model_dump(),
    )

    return d["gate"]


# ============================================================
# DATA QUALITY PASSPORT
# ============================================================

@router.get("/{dataset_id}/passport")
def passport(dataset_id: str):

    d = get_or_404(dataset_id)

    return {
        "dataset": d,
        "passport_version": "1.0",
        "generated_at": datetime.now(
            timezone.utc
        ).isoformat(),
        "audit_events": [
            e
            for e in store.mem["events"]
            if e["dataset_id"] == dataset_id
        ],
    }


# ============================================================
# MONITORING
# ============================================================

@router.get("/{dataset_id}/monitoring")
def monitoring(dataset_id: str):

    d = get_or_404(dataset_id)

    return [
        {
            "date": d["created_at"][:10],
            "quality": d.get("quality", 0),
            "readiness": d.get("readiness", 0),
            "missing": d.get("missing", 0),
            "anomalies": d.get("anomalies", 0),
        }
    ]