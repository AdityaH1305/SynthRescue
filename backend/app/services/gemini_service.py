from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def generate_report(summary: str):
    prompt = f"""
You are an emergency response AI system.

Based on the following detection summary:
{summary}

Generate a short, urgent disaster response report for rescue teams.
Keep it realistic and professional.
"""

    response = client.models.generate_content(
        model="gemini-1.5-flash",
        contents=prompt,
    )

    return response.text