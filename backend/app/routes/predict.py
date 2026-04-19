"""
/predict route — accepts an image upload, runs detection + AI analysis,
and returns a structured response that never crashes.
"""

import logging

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.ai_service import generate_report
from app.services.detection_service import detect

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/predict")
async def predict(file: UploadFile = File(...)):
    # --- 1. Validate upload ------------------------------------------------
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload an image (JPEG, PNG, etc.).",
        )

    try:
        image_bytes = await file.read()
    except Exception as exc:
        logger.error("Failed to read uploaded file: %s", exc)
        raise HTTPException(status_code=400, detail="Could not read the uploaded file.")

    # --- 2. Detection ------------------------------------------------------
    try:
        detection = detect(image_bytes)
    except Exception as exc:
        logger.error("Detection service error: %s", exc)
        raise HTTPException(status_code=500, detail="Detection service failed.")

    # --- 3. AI report (never crashes — worst case returns fallback) ---------
    try:
        ai_result = generate_report(
            summary=detection["summary"],
            people_strong=detection.get("people_strong", 0),
            people_weak=detection.get("people_weak", 0),
            people_estimate=detection.get("people_estimate", 0),
        )
    except Exception as exc:
        logger.error("AI service unexpected error: %s", exc)
        ai_result = {
            "report": "AI report generation encountered an unexpected error.",
            "severity_level": "MEDIUM",
            "ai_source": "error",
        }

    # --- 4. Structured response --------------------------------------------
    return {
        "boxes": detection["boxes"],
        "summary": detection["summary"],
        "report": ai_result["report"],
        "severity_level": ai_result["severity_level"],
        "ai_source": ai_result["ai_source"],
        "image_width": detection.get("image_width", 0),
        "image_height": detection.get("image_height", 0),
    }