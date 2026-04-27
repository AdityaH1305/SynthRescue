# 🧠 SynthRescue - Vision & Cognitive Engine (Backend)

This is the central nervous system of **SynthRescue**. It is a high-performance Python microservice built to ingest drone imagery, run local object detection to find trapped survivors, and interface with Google's Gemini AI to generate tactical emergency dispatch reports.

## 🚀 Tech Stack

* **API Framework:** FastAPI (Asynchronous Python)
* **Server:** Uvicorn
* **Computer Vision:** Ultralytics YOLOv8 (Custom weights trained on synthetic data)
* **Cognitive AI:** Google GenAI SDK (`gemini-2.5-flash-lite`)
* **Deployment:** Docker & Google Cloud Run

## 📂 Architecture

* `/app/main.py`: The FastAPI entry point and CORS configuration.
* `/app/routes/predict.py`: The main endpoint (`/api/predict`) that receives image uploads.
* `/app/services/detection_service.py`: Handles the YOLOv8 inference and confidence filtering.
* `/app/services/ai_service.py` & `gemini_service.py`: Formats the telemetry and triggers the Google Gemini API for report generation.
* `/models/best.pt`: The custom-trained YOLOv8 weights (Not tracked in Git, must be generated from the ML pipeline).

## ⚙️ Local Development Setup

### 1. Create a Virtual Environment
It is highly recommended to isolate your Python dependencies.
```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Create a `.env` file in the root of the `backend` folder. You must provide a valid Google Gemini API key for the cognitive reporting to function.
```env
GEMINI_API_KEY=your_google_api_key_here
```

### 4. Run the Server
Start the FastAPI server using Uvicorn.
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
The API will now be listening on `http://localhost:8000`. You can view the interactive API documentation at `http://localhost:8000/docs`.

## ☁️ Deployment (Google Cloud Run)

This backend is designed to be containerized and run on Google Cloud Run. Because YOLOv8 and OpenCV require heavy system dependencies and RAM, a standard serverless function (like Vercel functions) will crash.

**1. Build the Docker Container:**
The included `Dockerfile` automatically installs the required Debian dependencies (like `libgl1`) for OpenCV.

**2. Deploy to Cloud Run:**
When deploying to Google Cloud Run, ensure you configure the service with at least **4GB of Memory (4Gi)** to prevent Out-Of-Memory (OOM) errors during PyTorch/YOLO inference. Pass your `GEMINI_API_KEY` into the Cloud Run Environment Variables dashboard.