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


from google import genai

def _get_client():
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        logger.info("GEMINI_API_KEY present: %s", bool(api_key))
        if not api_key:
            logger.warning("GEMINI_API_KEY not set — AI reports will use fallback.")
            return None
        try:
            # New SDK initialization
            _client = genai.Client(api_key=api_key)
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
You are an AI disaster response assistant generating a structured emergency dispatch report.

Your output will be rendered directly in a UI, so formatting MUST be clean, readable, and consistent.

STRICT FORMATTING RULES:

1. DO NOT use markdown symbols like **, ##, or ###
2. DO NOT use asterisks (*) anywhere
3. DO NOT output raw paragraphs longer than 2-3 lines
4. Use clean section titles in ALL CAPS
5. Use bullet points (•) for lists
6. Use numbered steps ONLY for actions
7. Maintain clear spacing between sections
8. Keep language concise, professional, and operational
9. Highlight critical terms using UPPERCASE (e.g., HIGH RISK, CRITICAL)
10. Ensure output is visually scannable (like a real command report)

----------------------------------------

OUTPUT STRUCTURE (MANDATORY):

SITUATION OVERVIEW
Short, broken-down statements describing:
- Number of individuals detected
- Structural condition
- Any uncertainty

RISKS
• List key risks (short phrases only)

RECOMMENDED ACTIONS
1. Step-by-step operational actions
2. Keep each step concise (1 line max)

RESOURCE REQUIREMENTS

PERSONNEL
• List roles

VEHICLES
• List required vehicles

EQUIPMENT
• List required equipment

----------------------------------------

STYLE REQUIREMENTS:

- No long paragraphs
- No decorative text
- No emojis
- No explanations outside sections
- Keep tone like a real emergency response system
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
        f"DETECTION DATA TO PROCESS:\n"
        f"Detection summary: {summary}\n"
        f"Confirmed people: {people_strong}\n"
        f"Possible people: {people_weak}\n"
        f"Estimated people: {people_estimate}\n"
        f"Assessed severity: {severity}\n\n"
        f"Now generate the dispatch report using this exact structure and formatting based on the detection data provided above."
    )


# ---------------------------------------------------------------------------
# Gemini call with retry
# ---------------------------------------------------------------------------
_MAX_RETRIES = 2
_RETRY_DELAY_SECS = 2.0
_MODEL = "gemini-2.5-flash-lite"


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
            # Using the new SDK format and upgrading to Gemini 2.0 Flash
            response = client.models.generate_content(
                model="gemini-2.5-flash-lite", 
                contents=prompt,
            )
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
    
    # --- Risks ---
    risks = []
    if severity == "HIGH":
        risks.append("• HIGH RISK of secondary collapse")
        risks.append("• CRITICAL condition likely for trapped victims")
    elif severity == "MEDIUM":
        risks.append("• MODERATE RISK of structural instability")
    else:
        risks.append("• LOW RISK of immediate structural failure")
    
    risks_str = "\n".join(risks)

    # --- Actions (adapted to detection results) ---
    actions = []
    if people_strong > 0 or people_weak > 0:
        actions.append("Deploy search-and-rescue team to the identified location immediately")
        actions.append("Prioritise areas with confirmed person detections for extraction")
    if people_weak > 0:
        actions.append("Conduct secondary sweep for partially obscured survivors")
    actions.append("Establish a safety perimeter and assess structural integrity before entry")
    actions.append("Coordinate with local emergency medical services for on-site triage")
    if people_strong == 0 and people_weak == 0:
        actions.append("Dispatch reconnaissance team for manual visual assessment of the area")

    actions_str = "\n".join(f"{i+1}. {a}" for i, a in enumerate(actions))

    # --- Resources ---
    if severity == "HIGH":
        personnel = "• Search and Rescue Technicians\n• Medical Personnel (Trauma)"
        vehicles = "• Heavy Rescue Units\n• Ambulances"
        equipment = "• Heavy extrication equipment\n• Communication relay"
    elif severity == "MEDIUM":
        personnel = "• First Responders"
        vehicles = "• Utility Vehicles\n• Ambulances"
        equipment = "• Portable rescue equipment\n• Basic medical supplies"
    else:
        personnel = "• Reconnaissance Personnel"
        vehicles = "• Command Vehicle"
        equipment = "• Basic first-aid kit\n• Drone for aerial survey"

    report = (
        f"SITUATION OVERVIEW\n{situation}\n\n"
        f"RISKS\n{risks_str}\n\n"
        f"RECOMMENDED ACTIONS\n{actions_str}\n\n"
        f"RESOURCE REQUIREMENTS\n\n"
        f"PERSONNEL\n{personnel}\n\n"
        f"VEHICLES\n{vehicles}\n\n"
        f"EQUIPMENT\n{equipment}\n\n"
        f"NOTE\n• AI analysis temporarily unavailable ({reason})"
    )

    return {
        "report": report,
        "severity_level": severity,
        "ai_source": "fallback",
    }
