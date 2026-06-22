from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil
from ultralytics import YOLO
from contextlib import asynccontextmanager
import cv2
import os

# =====================================
# LOAD MODELS
# =====================================

CROWD_MODEL_PATH = "models/crowd_dynamics/best.pt"
DRONE_MODEL_PATH = "models/aerial/drone_best.pt"

try:

    crowd_model = YOLO(CROWD_MODEL_PATH)

    print("\n==============================")
    print("✅ Crowd Model Loaded")
    print("📦 Path:", CROWD_MODEL_PATH)
    print("🏷 Classes:", crowd_model.names)
    print("==============================\n")

    drone_model = YOLO(DRONE_MODEL_PATH)

    print("\n==============================")
    print("✅ Drone Model Loaded")
    print("📦 Path:", DRONE_MODEL_PATH)
    print("🏷 Classes:", drone_model.names)
    print("==============================\n")

except Exception as e:
    print(f"❌ Model loading failed: {e}")
    raise


# =====================================
# CAMERA
# =====================================

cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("⚠ Camera could not be opened")


# =====================================
# FASTAPI LIFESPAN
# =====================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

    if cap.isOpened():
        cap.release()
        print("📷 Camera Released")


app = FastAPI(
    title="Aerial Threat Detection API",
    version="2.0",
    lifespan=lifespan
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================
# HOME
# =====================================

@app.get("/")
def home():

    return {
        "message": "AI Engine Running",
        "crowd_model": CROWD_MODEL_PATH,
        "drone_model": DRONE_MODEL_PATH
    }


# =====================================
# MODEL INFO
# =====================================

@app.get("/model-info")
def model_info():

    return {
        "crowd_model_classes": crowd_model.names,
        "drone_model_classes": drone_model.names
    }


# =====================================
# CROWD DETECTION
# =====================================

@app.get("/detect")
def detect():

    ret, frame = cap.read()

    if not ret:
        return {
            "status": "error",
            "message": "Camera not working"
        }

    results = crowd_model(
        frame,
        conf=0.20
    )

    detections = []

    vehicle_count = 0
    person_count = 0

    for box in results[0].boxes:

        x1, y1, x2, y2 = box.xyxy[0].tolist()

        conf = float(box.conf[0])
        cls = int(box.cls[0])

        class_name = crowd_model.names[cls]

        detections.append({
            "class": class_name,
            "confidence": round(conf, 3),
            "bbox": [
                round(x1, 2),
                round(y1, 2),
                round(x2, 2),
                round(y2, 2)
            ]
        })

        if class_name.lower() in [
            "car",
            "van",
            "truck",
            "bus",
            "vehicle"
        ]:
            vehicle_count += 1

        elif class_name.lower() in [
            "pedestrian",
            "people",
            "person"
        ]:
            person_count += 1

    threat_score = (
        vehicle_count * 10 +
        person_count * 2
    )

    if threat_score < 20:
        threat_level = "LOW"
    elif threat_score < 50:
        threat_level = "MEDIUM"
    else:
        threat_level = "HIGH"

    return {
        "status": "success",
        "count": len(detections),
        "vehicles": vehicle_count,
        "persons": person_count,
        "threat_score": threat_score,
        "threat_level": threat_level,
        "detections": detections
    }


# =====================================
# DRONE DETECTION
# =====================================

@app.get("/detect-drone")
def detect_drone():

    ret, frame = cap.read()

    if not ret:
        return {
            "status": "error",
            "message": "Camera not working"
        }

    results = drone_model(
        frame,
        conf=0.20
    )

    detections = []

    drone_count = 0

    for box in results[0].boxes:

        cls = int(box.cls[0])
        conf = float(box.conf[0])

        class_name = drone_model.names[cls]

        detections.append({
            "class": class_name,
            "confidence": round(conf, 3)
        })

        drone_count += 1

    threat_level = "HIGH" if drone_count > 0 else "LOW"

    return {
        "status": "success",
        "count": drone_count,
        "threat_level": threat_level,
        "detections": detections
    }


# =====================================
# TEST CROWD IMAGE
# =====================================

@app.get("/test-image")
def test_image():

    image_path = "test.jpg"

    if not os.path.exists(image_path):

        return {
            "status": "error",
            "message": f"{image_path} not found",
            "current_directory": os.getcwd()
        }

    results = crowd_model.predict(
        source=image_path,
        conf=0.20,
        save=True
    )

    detections = []

    for box in results[0].boxes:

        cls = int(box.cls[0])

        detections.append({
            "class": crowd_model.names[cls],
            "confidence": round(float(box.conf[0]), 3)
        })

    return {
        "status": "success",
        "image": image_path,
        "count": len(detections),
        "detections": detections
    }
# =====================================
# DRONE IMAGE UPLOAD ANALYSIS
# =====================================

@app.post("/analyze-drone")
async def analyze_drone(file: UploadFile = File(...)):

    os.makedirs("uploads", exist_ok=True)

    filepath = os.path.join(
        "uploads",
        file.filename
    )

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(
            file.file,
            buffer
        )

    results = drone_model.predict(
        source=filepath,
        conf=0.20,
        save=True
    )

    detections = []

    for box in results[0].boxes:

        cls = int(box.cls[0])

        conf = float(box.conf[0])

        x1, y1, x2, y2 = box.xyxy[0].tolist()

        detections.append({
            "class": drone_model.names[cls],
            "confidence": round(conf, 3),
            "bbox": [
                round(x1, 2),
                round(y1, 2),
                round(x2, 2),
                round(y2, 2)
            ]
        })

    return {
        "status": "success",
        "filename": file.filename,
        "count": len(detections),
        "detections": detections
    }