# Main API - FastAPI Backend

from fastapi import FastAPI, WebSocket, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
import asyncio
import logging
from typing import List, Dict
import cv2
import numpy as np
from datetime import datetime
import json

from threat_detection import AerialThreatDetector, MultiSourceDataFusion
from trajectory_prediction import TrajectoryPredictor, AnomalyDetector
from crowd_management import CrowdDensityAnalyzer, PanicDetector
from evacuation_planning import EvacuationPlanner, Location, GISIntegrator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Aerial Threat Detection & Crowd Dispersion API",
    description="Real-time threat detection and evacuation management system",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize core modules
detector = AerialThreatDetector('yolov8x.pt')
trajectory_predictor = TrajectoryPredictor()
anomaly_detector = AnomalyDetector()
crowd_analyzer = CrowdDensityAnalyzer()
panic_detector = PanicDetector()
evacuation_planner = EvacuationPlanner()
gis_integrator = GISIntegrator()

# System state
system_state = {
    'threats': [],
    'crowd_data': {},
    'evacuation_routes': [],
    'status': 'IDLE',
    'last_update': None,
    'alert_level': 'GREEN'
}

# WebSocket connections
active_connections: List[WebSocket] = []

@app.on_event("startup")
async def startup_event():
    """Initialize system on startup"""
    logger.info("Aerial Threat Detection System starting...")
    # Load models, initialize databases, etc.
    logger.info("System ready")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Aerial Threat Detection & Crowd Dispersion System",
        "status": "online",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "threats_monitored": len(system_state['threats']),
        "alert_level": system_state['alert_level']
    }

@app.post("/detect/frame")
async def detect_threats_frame(file: UploadFile = File(...)):
    """
    Detect threats in uploaded frame
    
    Args:
        file: Image file
        
    Returns:
        Detection results
    """
    try:
        # Read image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Run detection
        threats = detector.detect_threats(frame)
        
        # Classify severity
        for threat in threats:
            threat = detector.classify_threat_severity(threat)
        
        # Update system state
        system_state['threats'] = threats
        system_state['last_update'] = datetime.now().isoformat()
        
        # Determine alert level
        if len(threats) > 0:
            max_severity = max([t.get('severity_score', 0) for t in threats])
            if max_severity > 0.75:
                system_state['alert_level'] = 'RED'
            elif max_severity > 0.5:
                system_state['alert_level'] = 'YELLOW'
            else:
                system_state['alert_level'] = 'ORANGE'
        else:
            system_state['alert_level'] = 'GREEN'
        
        # Broadcast to WebSocket clients
        await broadcast_update({'type': 'threat_detection', 'threats': threats})
        
        return {
            'success': True,
            'threats_detected': len(threats),
            'threats': threats,
            'alert_level': system_state['alert_level']
        }
        
    except Exception as e:
        logger.error(f"Detection error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/trajectory/predict")
async def predict_trajectory(threat_id: str, num_frames: int = 30):
    """
    Predict trajectory for a threat
    
    Args:
        threat_id: ID of the threat
        num_frames: Number of frames to predict
        
    Returns:
        Trajectory predictions
    """
    try:
        # Find threat
        threat = next((t for t in system_state['threats'] 
                      if t.get('id') == threat_id), None)
        
        if not threat:
            raise HTTPException(status_code=404, detail="Threat not found")
        
        # Predict trajectory
        predictions = trajectory_predictor.predict_trajectory(steps=num_frames)
        
        # Calculate impact zone
        impact_time = 5.0  # seconds
        impact_zone = trajectory_predictor.get_impact_zone(impact_time)
        
        return {
            'threat_id': threat_id,
            'predictions': predictions,
            'impact_zone': impact_zone,
            'anomaly_detected': anomaly_detector.detect_acceleration_spike()
        }
        
    except Exception as e:
        logger.error(f"Trajectory prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/crowd/analyze")
async def analyze_crowd(file: UploadFile = File(...)):
    """
    Analyze crowd in frame
    
    Args:
        file: Image file
        
    Returns:
        Crowd analysis results
    """
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Analyze crowd
        crowd_mask, stats = crowd_analyzer.detect_crowd(frame)
        grid_analysis = crowd_analyzer.analyze_grid_density(crowd_mask)
        bottlenecks = crowd_analyzer.detect_bottlenecks(crowd_mask)
        
        system_state['crowd_data'] = {
            'stats': stats,
            'grid_analysis': {
                'max_density': float(grid_analysis['max_density']),
                'avg_density': float(grid_analysis['avg_density']),
                'high_density_zones': grid_analysis['high_density_zones']
            },
            'bottlenecks': bottlenecks
        }
        
        await broadcast_update({'type': 'crowd_analysis', 'data': system_state['crowd_data']})
        
        return {
            'success': True,
            'crowd_stats': stats,
            'grid_analysis': {
                'max_density': float(grid_analysis['max_density']),
                'avg_density': float(grid_analysis['avg_density'])
            },
            'bottleneck_count': len(bottlenecks),
            'bottlenecks': bottlenecks[:5]  # Top 5
        }
        
    except Exception as e:
        logger.error(f"Crowd analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/evacuation/plan")
async def plan_evacuation(threat_impact: Dict):
    """
    Plan evacuation based on threat impact
    
    Args:
        threat_impact: Threat impact zone information
        
    Returns:
        Evacuation plan with routes
    """
    try:
        # Generate evacuation routes
        crowd_start_position = Location(500, 500)  # Example
        route = evacuation_planner.calculate_optimal_route(
            crowd_start_position,
            avoid_danger=True
        )
        
        system_state['evacuation_routes'] = [route]
        
        # Get evacuation map
        evac_map = evacuation_planner.get_evacuation_map()
        
        # Generate HTML map
        html_map = gis_integrator.generate_evacuation_map_html(evac_map)
        
        await broadcast_update({
            'type': 'evacuation_plan',
            'routes': [route]
        })
        
        return {
            'success': True,
            'evacuation_routes': [route],
            'safe_zones': len(evacuation_planner.safe_zones),
            'estimated_evacuation_time': route.get('estimated_time'),
            'map_html': html_map
        }
        
    except Exception as e:
        logger.error(f"Evacuation planning error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/system/status")
async def get_system_status():
    """Get current system status"""
    return {
        'status': system_state['status'],
        'alert_level': system_state['alert_level'],
        'threats': len(system_state['threats']),
        'crowd_monitored': system_state['crowd_data'] != {},
        'evacuation_active': len(system_state['evacuation_routes']) > 0,
        'last_update': system_state['last_update']
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await websocket.accept()
    active_connections.append(websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
            logger.info(f"WebSocket message: {data}")
            
            # Echo back or process message
            await websocket.send_json({
                'type': 'ack',
                'message': 'Message received',
                'timestamp': datetime.now().isoformat()
            })
            
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        active_connections.remove(websocket)

async def broadcast_update(message: Dict):
    """Broadcast update to all connected WebSocket clients"""
    for connection in active_connections:
        try:
            await connection.send_json(message)
        except Exception as e:
            logger.error(f"Broadcast error: {e}")

@app.get("/api/documentation")
async def get_documentation():
    """Get API documentation"""
    return {
        "endpoints": {
            "/detect/frame": "POST - Detect threats in image",
            "/trajectory/predict": "POST - Predict threat trajectory",
            "/crowd/analyze": "POST - Analyze crowd in image",
            "/evacuation/plan": "POST - Plan evacuation routes",
            "/system/status": "GET - Get system status",
            "/ws": "WebSocket - Real-time updates"
        },
        "alert_levels": {
            "GREEN": "No threats",
            "ORANGE": "Low threat",
            "YELLOW": "Medium threat",
            "RED": "High threat - Evacuation recommended"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
