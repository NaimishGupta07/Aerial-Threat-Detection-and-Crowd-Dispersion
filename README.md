# 🚁 Aerial Threat Detection and Crowd Dispersion System

An AI-powered aerial surveillance and crowd intelligence platform that combines computer vision, geospatial monitoring, and threat assessment for real-time security operations.

The system is designed to detect aerial threats such as drones while simultaneously analyzing crowd dynamics, vehicle movement, and potential security risks from aerial imagery and surveillance feeds.

---

## Features

### Aerial Threat Detection

* YOLOv8-based drone detection engine
* Real-time UAV threat identification
* Confidence-based threat scoring
* Upload and analyze aerial imagery

### Crowd Dynamics Analysis

* Pedestrian detection
* Crowd density estimation
* Vehicle activity monitoring
* Threat classification and situational awareness

### Tactical Monitoring Dashboard

* Live operational monitoring interface
* Geospatial threat visualization
* Alert management system
* Threat level assessment
* Operational lockdown triggers

### Intelligence Analysis

* Manual image upload and inspection
* AI-assisted threat detection
* Detection confidence reporting
* Real-time operational status updates

---

## System Architecture

Frontend:

* React
* TypeScript
* Vite
* Tailwind CSS
* Leaflet Maps
* ShadCN UI

Backend:

* FastAPI
* Python

AI Models:

* YOLOv8 Crowd Detection Model
* YOLOv8 Drone Detection Model

Computer Vision:

* OpenCV
* Ultralytics YOLO

---

## Project Structure

```text
Aerial ML Solution
│
├── client/                 # React Frontend
├── server/                 # Backend Services
├── ai-engine/
│   ├── api/
│   │   └── main.py
│   ├── models/
│   │   ├── crowd_dynamics/
│   │   │   └── best.pt
│   │   └── aerial/
│   │       └── drone_best.pt
│   ├── uploads/
│   └── venv/
│
└── shared/
```

## AI Models

### Crowd Detection Model

Dataset:

* VisDrone2019

Detected Classes:

* Pedestrian
* People
* Bicycle
* Car
* Van
* Truck
* Tricycle
* Awning-Tricycle
* Bus
* Motor

### Drone Detection Model

Dataset:

* Custom UAV Dataset

Detected Classes:

* Drone

---

## API Endpoints

### System Information

```http
GET /
```

### Model Information

```http
GET /model-info
```

### Crowd Detection

```http
GET /detect
```

### Drone Detection

```http
GET /detect-drone
```

### Test Image Analysis

```http
GET /test-image
```

### Upload Drone Image

```http
POST /analyze-drone
```

---

## Installation

### Clone Repository

### Backend Setup

```bash
cd ai-engine

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt
```

Install additional dependency:

```bash
pip install python-multipart
```

### Run AI Backend

```bash
uvicorn api.main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger Documentation:

```text
http://127.0.0.1:8000/docs
```

### Frontend Setup

```bash
npm install
```

or

```bash
pnpm install
```

Run:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5000
```

---

## Current Capabilities

✔ Real-Time Drone Detection

✔ Crowd Monitoring

✔ Vehicle Detection

✔ Tactical Dashboard

✔ Threat Scoring

✔ Geospatial Threat Mapping

✔ Manual Intelligence Analysis

✔ FastAPI AI Engine

✔ React Operational Interface

---

## Future Enhancements

* Multi-UAV Classification
* Bird vs Drone Discrimination
* Missile and Projectile Detection
* Real-Time Video Stream Analysis
* Multi-Sensor Fusion
* GPS-Aided Threat Localization
* Automated Crowd Dispersion Recommendations
* Digital Sensor Twin Integration
* Explainable AI Threat Assessment

---

## Author

Naimish Gupta

B.Tech Computer Science and Engineering

Research Interests:
Computer Vision • Artificial Intelligence • Intelligent Surveillance Systems • Multi-Sensor Fusion • Autonomous Threat Detection
