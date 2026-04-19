from fastapi import APIRouter, UploadFile, File
from app.services.mock_model import fake_detection

router = APIRouter()

@router.post("/predict")
async def predict(file: UploadFile = File(...)):
    return fake_detection()