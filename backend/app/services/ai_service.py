"""
AI service — generates emergency reports using Gemini (with fallback).

Severity is now derived from detection counts + uncertainty, not keywords.
Fallback reports are structured and professional.
"""

import logging
import os
import time
from typing import Any, Dict

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Gemini client (lazy-initialised so import never crashes)
# ---------------------------------------------------------------------------
_client = None


import google.generativeai as genai

def _get_client():
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        logger.info("GEMINI_API_KEY present: %s", bool(api_key))
        if not api_key:
            logger.warning("GEMINI_API_KEY not set — AI reports will use fallback.")
            return None
        try:
            genai.configure(api_key=api_key)
            _client = genai.GenerativeModel("gemini-1.5-flash-latest")
        except Exception as exc:
            logger.error("Failed to initialise Gemini client: %s", exc)
            return None
    return _client


# ---------------------------------------------------------------------------
# Severity — based on detection signals, NOT keywords
# ---------------------------------------------------------------------------
def classify_severity(
    people_strong: int,
    people_weak: int,
    people_estimate: int,
) -> str:
    """
    Derive severity from detection counts + uncertainty.

    Rules:
        ≥2 confirmed OR any uncertainty  → HIGH
        1 confirmed, no uncertainty       → MEDIUM
        0 confirmed, 0 weak               → LOW
    """
    if people_strong >= 2 or people_weak > 0 or people_estimate >= 2:
        return "HIGH"
    if people_strong == 1:
        return "MEDIUM"
    return "LOW"


# ---------------------------------------------------------------------------
# Gemini prompt
# ---------------------------------------------------------------------------
_SYSTEM_PROMPT = """\
You are **SynthRescue AI**, an emergency-response analysis system used by
rescue coordinators during disaster events.

Given the detection summary below, produce a concise emergency report with
exactly these three sections:

**Situation Overview**
One paragraph: what was detected, likely scenario, and immediate risks.

**Recommended Actions**
3–5 numbered steps, concrete and prioritised.

**Resource Estimate**
Bullet list of personnel, vehicles, and equipment likely needed.

Rules:
- Be realistic, professional, and actionable.
- Keep the entire report under 200 words.
- Never include disclaimers about being an AI.
- If uncertainty is indicated, acknowledge it and recommend visual confirmation.
"""


def _build_prompt(
    summary: str,
    severity: str,
    people_strong: int,
    people_weak: int,
    people_estimate: int,
) -> str:
    return (
        f"{_SYSTEM_PROMPT}\n\n"
        f"Detection summary:\n{summary}\n\n"
        f"Detection details:\n"
        f"- Confirmed people: {people_strong}\n"
        f"- Possible people: {people_weak}\n"
        f"- Estimated people: {people_estimate}\n\n"
        f"Context:\n"
        f"- The detection model identifies rubble and structural debris.\n"
        f"- Human presence may be inferred indirectly from debris patterns.\n\n"
        f"Task:\n"
        f"- Infer likelihood of trapped individuals based on rubble density and uncertainty.\n"
        f"- Adjust response recommendations accordingly.\n\n"
        f"Assessed severity: {severity}"
    )


# ---------------------------------------------------------------------------
# Gemini call with retry
# ---------------------------------------------------------------------------
_MAX_RETRIES = 2
_RETRY_DELAY_SECS = 2.0
_MODEL = "gemini-1.5-flash"


def generate_report(
    summary: str,
    people_strong: int = 0,
    people_weak: int = 0,
    people_estimate: int = 0,
) -> Dict[str, Any]:
    """
    Generate an AI emergency report from detection data.

    Returns dict with "report", "severity_level", and "ai_source".
    """
    severity = classify_severity(people_strong, people_weak, people_estimate)

    client = _get_client()
    if client is None:
        return _fallback_report(summary, severity, people_strong, people_weak,
                                reason="Gemini client unavailable")

    prompt = _build_prompt(
        summary,
        severity,
        people_strong,
        people_weak,
        people_estimate,
    )

    for attempt in range(1, _MAX_RETRIES + 1):
        try:
            response = client.generate_content(prompt)
            report_text = (getattr(response, "text", "") or "").strip()
            if not report_text:
                raise ValueError("Empty response from Gemini")

            logger.info("Gemini report generated (attempt %d)", attempt)
            return {
                "report": report_text,
                "severity_level": severity,
                "ai_source": "gemini",
            }

        except Exception as exc:
            exc_str = str(exc)
            is_quota = "429" in exc_str or "RESOURCE_EXHAUSTED" in exc_str
            logger.warning(
                "Gemini attempt %d/%d failed (%s): %s",
                attempt, _MAX_RETRIES,
                "quota" if is_quota else "error",
                exc_str[:200],
            )
            if attempt < _MAX_RETRIES:
                delay = _RETRY_DELAY_SECS * (2 if is_quota else 1)
                time.sleep(delay)

    return _fallback_report(summary, severity, people_strong, people_weak,
                            reason="Gemini unavailable after retries")


# ---------------------------------------------------------------------------
# Fallback report — structured, professional, no external dependency
# ---------------------------------------------------------------------------
def _fallback_report(
    summary: str,
    severity: str,
    people_strong: int,
    people_weak: int,
    reason: str,
) -> Dict[str, Any]:
    logger.info("Using fallback report — %s", reason)

    # --- Situation overview ---
    situation = f"Automated detection analysis reports: {summary}"

    # --- Actions (adapted to detection results) ---
    actions = []
    if people_strong > 0 or people_weak > 0:
        actions.append("Deploy search-and-rescue team to the identified location immediately.")
        actions.append("Prioritise areas with confirmed person detections for extraction.")
    if people_weak > 0:
        actions.append(
            "Conduct secondary sweep — low-confidence detections suggest "
            "additional survivors may be obscured or partially visible."
        )
    actions.append("Establish a safety perimeter and assess structural integrity before entry.")
    actions.append("Coordinate with local emergency medical services for on-site triage.")
    if people_strong == 0 and people_weak == 0:
        actions.append("Dispatch reconnaissance team for manual visual assessment of the area.")

    actions_str = "\n".join(f"  {i+1}. {a}" for i, a in enumerate(actions))

    # --- Resources ---
    if severity == "HIGH":
        resources = (
            "  • 4–6 search-and-rescue personnel\n"
            "  • Medical unit with trauma capability\n"
            "  • Heavy extrication equipment (if structural collapse present)\n"
            "  • Communication relay for coordination"
        )
    elif severity == "MEDIUM":
        resources = (
            "  • 2–4 first responders\n"
            "  • Medical unit on standby\n"
            "  • Portable rescue equipment"
        )
    else:
        resources = (
            "  • 2 reconnaissance personnel\n"
            "  • Basic first-aid kit\n"
            "  • Drone for aerial survey (if available)"
        )

    report = (
        f"Situation Overview:\n{situation}\n\n"
        f"Recommended Actions:\n{actions_str}\n\n"
        f"Resource Estimate:\n{resources}\n\n"
        f"Note: AI analysis temporarily unavailable ({reason}). "
        f"Report generated from detection data only."
    )

    return {
        "report": report,
        "severity_level": severity,
        "ai_source": "fallback",
    }
