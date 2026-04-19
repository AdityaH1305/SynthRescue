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
# Model (loaded once at import time)
# ---------------------------------------------------------------------------
_model = YOLO("yolov8n.pt")

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
    try:
        return _yolo_detect(image_bytes)
    except Exception as exc:
        logger.error("YOLO detection failed, using fallback: %s", exc)
        return _fallback_detect()


# ---------------------------------------------------------------------------
# YOLO inference + post-processing
# ---------------------------------------------------------------------------
def _yolo_detect(image_bytes: bytes) -> Dict[str, Any]:
    # Decode image
    img_array = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image bytes")

    img_h, img_w = img.shape[:2]
    results = _model(img)

    boxes: List[Dict[str, Any]] = []
    strong = 0
    weak = 0

    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            label = _model.names[cls_id]
            confidence = float(box.conf[0])

            # Filter to allowed classes only
            if label not in ALLOWED_CLASSES:
                continue

            # Filter below minimum threshold
            if confidence < WEAK_CONF:
                continue

            # Classify tier
            if confidence >= STRONG_CONF:
                tier = "strong"
                strong += 1
            else:
                tier = "weak"
                weak += 1

            x1, y1, x2, y2 = box.xyxy[0].tolist()

            boxes.append({
                "label": label,
                "confidence": round(confidence, 2),
                "x": round(x1, 1),
                "y": round(y1, 1),
                "w": round(x2 - x1, 1),
                "h": round(y2 - y1, 1),
                "tier": tier,
            })

    # --- Build realistic summary ---
    summary = _build_summary(strong, weak)

    # --- People estimate (strong + half of weak, rounded up) ---
    people_estimate = strong + -(-weak // 2)   # ceil division

    return {
        "boxes": boxes,
        "summary": summary,
        "people_strong": strong,
        "people_weak": weak,
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
        return "No people clearly detected in the scene."

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