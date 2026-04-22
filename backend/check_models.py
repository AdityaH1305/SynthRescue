import os
from google import genai
from dotenv import load_dotenv

# Load your perfectly working .env file
load_dotenv()

# Initialize the client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

print("Here are the models you are allowed to use:")
for model in client.models.list():
    # We only care about models that can generate text
    if "generateContent" in model.supported_actions:
        print(f"- {model.name}")