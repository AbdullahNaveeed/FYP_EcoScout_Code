from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import cv2
import numpy as np
import easyocr
from ultralytics import YOLO
import base64
from datetime import datetime

# Initialize App
app = FastAPI(title="EcoScout API", version="1.0.0")

# --- CORS SETUP (Crucial for connecting to React) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- GLOBAL MODELS ---
print("⏳ Loading AI Models...")
try:
    # Ensure 'best.pt' is in the backend folder, or change to 'yolov8n.pt' for testing
    model = YOLO("best.pt") 
    reader = easyocr.Reader(['en']) 
    print("✅ Models Loaded Successfully!")
except Exception as e:
    print(f"❌ Error loading models: {e}")

# --- HELPER FUNCTIONS ---

def preprocess_plate(plate_img):
    """
    User-defined preprocessing logic for better OCR results.
    """
    gray = cv2.cvtColor(plate_img, cv2.COLOR_BGR2GRAY)
    # Resize for OCR
    gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    # Improve contrast
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    gray = clahe.apply(gray)
    # Light threshold (NOT aggressive)
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return thresh

def image_to_base64(img):
    """Converts OpenCV image to Base64 string for React frontend."""
    _, buffer = cv2.imencode('.jpg', img)
    return base64.b64encode(buffer).decode('utf-8')

# --- API ENDPOINTS ---

@app.get("/")
def home():
    return {"message": "EcoScout Backend is Running"}

@app.post("/detect")
async def detect_plate(file: UploadFile = File(...)):
    # 1. READ IMAGE
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise HTTPException(status_code=400, detail="Could not process image")

    # 2. RUN YOLO DETECTION
    results = model(img)
    detection_data = None
    
    # We create a copy to draw annotations on (for the preview)
    annotated_img = img.copy()

    for r in results:
        for box in r.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            
            # Crop Plate
            plate_img = img[y1:y2, x1:x2]
            
            # 3. RUN YOUR PREPROCESSING
            plate_preprocessed = preprocess_plate(plate_img)

            # 4. RUN OCR
            ocr_result = reader.readtext(
                plate_preprocessed,
                allowlist='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
                paragraph=False,
                detail=1
            )

            # Extract Text and Confidence
            detected_text = ""
            confidences = []
            for (_, text, conf) in ocr_result:
                detected_text += text
                confidences.append(conf)

            plate_confidence = sum(confidences) / len(confidences) if confidences else 0.0

            # Draw Box on the main image for preview
            cv2.rectangle(annotated_img, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(annotated_img, detected_text, (x1, y1 - 10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

            # Construct Result Object
            if len(detected_text) > 1:
                detection_data = {
                    "plate_number": detected_text.upper(),
                    "confidence": round(plate_confidence, 2),
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "preview_image": f"data:image/jpeg;base64,{image_to_base64(annotated_img)}",
                    "status": "Success"
                }
                break # Return the first valid plate found

    if not detection_data:
        return JSONResponse(content={"status": "Failed", "message": "No plate detected"}, status_code=200)

    return JSONResponse(content=detection_data)

# Run with: uvicorn main:app --reload