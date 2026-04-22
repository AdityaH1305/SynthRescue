"""
Detection service — YOLO-based person detection with soft-count logic.

Classifies detections into strong (≥0.5) and weak (0.3–0.5) confidence tiers.
Infers possible additional people from weak detections for realistic summaries.
Falls back safely if YOLO fails.
"""

import logging
from typing import Any, Dict, List

import cv2
import numpy as np
from ultralytics import YOLO

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Model (lazy-loaded on first use, cached thereafter)
# ---------------------------------------------------------------------------
from pathlib import Path

# Resolve relative to *this* file so the path is correct regardless of cwd
_SERVICE_DIR = Path(__file__).resolve().parent          # app/services/
_BACKEND_DIR = _SERVICE_DIR.parent.parent               # backend/
MODEL_PATH = _BACKEND_DIR / "models" / "best.pt"

logger.info("Resolved YOLO model path: %s", MODEL_PATH)
logger.info("Model file exists: %s", MODEL_PATH.exists())

_model = None  # will be populated by _get_model()


def _get_model():
    """Return the cached YOLO model, loading it on first call."""
    global _model
    if _model is not None:
        return _model

    if not MODEL_PATH.exists():
        logger.error("YOLO model NOT found at %s — detections will use fallback", MODEL_PATH)
        return None

    try:
        _model = YOLO(str(MODEL_PATH))
        logger.info("YOLO model loaded successfully from %s", MODEL_PATH)
    except Exception as exc:
        logger.error("Failed to load YOLO model: %s — detections will use fallback", exc)
        _model = None

    return _model

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
ALLOWED_CLASSES = {"person"}
STRONG_CONF = 0.5       # high-confidence threshold
WEAK_CONF = 0.3         # low-confidence threshold (included but flagged)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def detect(image_bytes: bytes) -> Dict[str, Any]:
    """
    Run object detection on raw image bytes.

    Returns dict with:
        boxes           — list of detection dicts (label, confidence, x, y, w, h, tier)
        summary         — human-readable summary with uncertainty language
        people_strong   — count of high-confidence person detections
        people_weak     — count of low-confidence person detections
        people_estimate — best-guess total (strong + ceil(weak * 0.5))
        image_width     — original image width (for frontend overlay)
        image_height    — original image height
    """
    model = _get_model()
    if model is None:
        return _fallback_detect()
    try:
        return _yolo_detect(image_bytes, model)
    except Exception as exc:
        logger.error("YOLO detection failed, using fallback: %s", exc)
        return _fallback_detect()


# ---------------------------------------------------------------------------
# YOLO inference + post-processing
# ---------------------------------------------------------------------------
def _yolo_detect(image_bytes: bytes, model) -> Dict[str, Any]:
    # Decode image
    img_array = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image bytes")

    img_h, img_w = img.shape[:2]
    results = model(img)

    boxes: List[Dict[str, Any]] = []
    person_strong = 0
    person_weak = 0

    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            raw_label = model.names[cls_id]
            confidence = float(box.conf[0])

            # Filter below minimum threshold
            if confidence < WEAK_CONF:
                continue

            # --- THE HACKATHON FIX --- 
            # 1. Force the correct labels based on data.yaml
            if cls_id == 0 or raw_label == "Trapped_Person":
                label = "person"
            elif cls_id == 1 or raw_label == "Rubble":
                label = "Rubble"
            else:
                label = raw_label

            # Classify tier
            if confidence >= STRONG_CONF:
                tier = "strong"
                if label == "person":
                    person_strong += 1
            else:
                tier = "weak"
                if label == "person":
                    person_weak += 1

            x1, y1, x2, y2 = box.xyxy[0].tolist()

            boxes.append({
                "label": "Survivor" if label == "person" else label, # Make it look pro for the UI
                "confidence": round(confidence, 2),
                "x": round(x1, 1),
                "y": round(y1, 1),
                "w": round(x2 - x1, 1),
                "h": round(y2 - y1, 1),
                "tier": tier,
            })

    # --- Build realistic summary ---
    summary = _build_summary(person_strong, person_weak)
    # --- People estimate (strong + half of weak, rounded up) ---
    people_estimate = person_strong + -(-person_weak // 2)   # ceil division
    

    return {
        "boxes": boxes,
        "summary": summary,
        "people_strong": person_strong,
        "people_weak": person_weak,
        "people_estimate": people_estimate,
        "image_width": img_w,
        "image_height": img_h,
    }


def _build_summary(strong: int, weak: int) -> str:
    """
    Produce a natural-language summary that communicates uncertainty.
    """
    total_confirmed = strong

    if strong == 0 and weak == 0:
        return "No people directly detected. Significant structural debris present."

    if strong == 0 and weak > 0:
        return (
            f"No high-confidence detections, but {weak} possible "
            f"{'person' if weak == 1 else 'people'} detected at low confidence. "
            f"Visual confirmation recommended."
        )

    parts = []
    parts.append(
        f"At least {total_confirmed} {'person' if total_confirmed == 1 else 'people'} "
        f"detected with high confidence."
    )

    if weak > 0:
        parts.append(
            f"{weak} additional possible {'person' if weak == 1 else 'people'} "
            f"detected at lower confidence — likely more present."
        )

    return " ".join(parts)


# ---------------------------------------------------------------------------
# Fallback (no external dependency)
# ---------------------------------------------------------------------------
def _fallback_detect() -> Dict[str, Any]:
    return {
        "boxes": [],
        "summary": "Detection system unavailable. Manual visual assessment required.",
        "people_strong": 0,
        "people_weak": 0,
        "people_estimate": 0,
        "image_width": 0,
        "image_height": 0,
    }