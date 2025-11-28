# Core Detection Module - YOLO & R-CNN Implementation

import cv2
import numpy as np
import tensorflow as tf
from ultralytics import YOLO
from torchvision.models import detection
import torch
from typing import List, Dict, Tuple
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AerialThreatDetector:
    """Multi-source threat detection using YOLO and Faster R-CNN"""
    
    def __init__(self, yolo_model_path: str, rcnn_model_path: str = None):
        """
        Initialize detector with YOLO and optional R-CNN models
        
        Args:
            yolo_model_path: Path to YOLOv8 model (e.g., 'yolov8x.pt')
            rcnn_model_path: Path to Faster R-CNN model
        """
        self.yolo_model = YOLO(yolo_model_path)
        self.confidence_threshold = 0.5
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # Threat classes mapping
        self.threat_classes = {
            'drone': True,
            'quadcopter': True,
            'uav': True,
            'aircraft': True,
            'helicopter': True,
            'bird': False,
            'airplane': False
        }
        
    def detect_threats(self, frame: np.ndarray) -> List[Dict]:
        """
        Detect aerial threats from video frame
        
        Args:
            frame: Input video frame (BGR format)
            
        Returns:
            List of detected threats with bounding boxes and confidence
        """
        # YOLO detection
        results = self.yolo_model(frame, conf=self.confidence_threshold)
        
        threats = []
        for r in results:
            boxes = r.boxes
            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)
                conf = box.conf[0].cpu().numpy()
                cls = int(box.cls[0].cpu().numpy())
                
                # Get class name
                class_name = r.names[cls] if cls < len(r.names) else "unknown"
                
                # Check if threat
                is_threat = self.threat_classes.get(class_name.lower(), True)
                
                threat_obj = {
                    'class': class_name,
                    'confidence': float(conf),
                    'bbox': [int(x1), int(y1), int(x2), int(y2)],
                    'center': [(int(x1) + int(x2)) // 2, (int(y1) + int(y2)) // 2],
                    'area': int((x2 - x1) * (y2 - y1)),
                    'is_threat': is_threat,
                    'detection_time': cv2.getTickCount()
                }
                
                if is_threat and conf > self.confidence_threshold:
                    threats.append(threat_obj)
        
        logger.info(f"Detected {len(threats)} threats in frame")
        return threats
    
    def classify_threat_severity(self, threat: Dict, altitude: float = None, 
                                 proximity_to_crowd: float = None) -> Dict:
        """
        Classify threat severity using multiple parameters
        
        Args:
            threat: Threat object from detection
            altitude: Altitude in meters (optional)
            proximity_to_crowd: Distance to nearest crowd center (optional)
            
        Returns:
            Threat with severity classification
        """
        severity_score = 0.0
        
        # Size-based scoring (larger objects = higher threat)
        area = threat['area']
        if area > 50000:
            severity_score += 0.4
        elif area > 20000:
            severity_score += 0.3
        elif area > 5000:
            severity_score += 0.2
        else:
            severity_score += 0.1
            
        # Confidence scoring
        severity_score += threat['confidence'] * 0.3
        
        # Proximity to crowd
        if proximity_to_crowd is not None:
            if proximity_to_crowd < 50:  # Less than 50m
                severity_score += 0.3
            elif proximity_to_crowd < 200:
                severity_score += 0.2
            else:
                severity_score += 0.1
        
        # Altitude scoring (lower = more dangerous)
        if altitude is not None:
            if altitude < 50:
                severity_score += 0.3
            elif altitude < 100:
                severity_score += 0.2
            else:
                severity_score += 0.05
        
        # Normalize score to 0-1
        severity_score = min(severity_score, 1.0)
        
        # Classify threat level
        if severity_score > 0.75:
            threat_level = 'CRITICAL'
        elif severity_score > 0.5:
            threat_level = 'HIGH'
        elif severity_score > 0.25:
            threat_level = 'MEDIUM'
        else:
            threat_level = 'LOW'
        
        threat['severity_score'] = float(severity_score)
        threat['threat_level'] = threat_level
        
        return threat
    
    def filter_false_positives(self, threats: List[Dict], 
                               frame: np.ndarray) -> List[Dict]:
        """
        Filter false positives using frame analysis
        
        Args:
            threats: List of detected threats
            frame: Current frame
            
        Returns:
            Filtered threats with high confidence
        """
        filtered_threats = []
        
        for threat in threats:
            x1, y1, x2, y2 = threat['bbox']
            roi = frame[y1:y2, x1:x2]
            
            # Check motion characteristics
            if roi.size > 0:
                # Extract color histogram
                hist = cv2.calcHist([roi], [0, 1, 2], None, [8, 8, 8],
                                  [0, 256, 0, 256, 0, 256])
                
                # Check if object has sufficient visual distinctiveness
                if np.sum(hist) > 100:  # Sufficient pixels
                    filtered_threats.append(threat)
        
        logger.info(f"Filtered to {len(filtered_threats)} valid threats from {len(threats)}")
        return filtered_threats


class MultiSourceDataFusion:
    """Integrate data from multiple sources (camera, radar, thermal)"""
    
    def __init__(self):
        self.source_weights = {
            'camera': 0.5,
            'radar': 0.3,
            'thermal': 0.2
        }
        
    def fuse_detections(self, camera_threats: List[Dict],
                       radar_data: Dict = None,
                       thermal_data: Dict = None) -> List[Dict]:
        """
        Fuse detections from multiple sources
        
        Args:
            camera_threats: Detections from camera
            radar_data: Detections from radar
            thermal_data: Detections from thermal sensor
            
        Returns:
            Fused threat list with combined confidence
        """
        fused_threats = camera_threats.copy()
        
        if radar_data:
            for radar_threat in radar_data.get('threats', []):
                # Match with existing threats
                matched = False
                for camera_threat in fused_threats:
                    distance = np.sqrt(
                        (camera_threat['center'][0] - radar_threat['center'][0])**2 +
                        (camera_threat['center'][1] - radar_threat['center'][1])**2
                    )
                    
                    if distance < 50:  # Within 50 pixels
                        # Combine confidence scores
                        combined_conf = (
                            camera_threat['confidence'] * self.source_weights['camera'] +
                            radar_threat['confidence'] * self.source_weights['radar']
                        )
                        camera_threat['confidence'] = combined_conf
                        camera_threat['sources'] = ['camera', 'radar']
                        matched = True
                        break
                
                if not matched:
                    radar_threat['sources'] = ['radar']
                    fused_threats.append(radar_threat)
        
        if thermal_data:
            for thermal_threat in thermal_data.get('threats', []):
                # Similar matching logic for thermal
                for fused_threat in fused_threats:
                    distance = np.sqrt(
                        (fused_threat['center'][0] - thermal_threat['center'][0])**2 +
                        (fused_threat['center'][1] - thermal_threat['center'][1])**2
                    )
                    
                    if distance < 50:
                        thermal_weight = self.source_weights['thermal']
                        fused_threat['confidence'] = min(
                            fused_threat['confidence'] + thermal_weight * 0.1,
                            1.0
                        )
                        if 'sources' not in fused_threat:
                            fused_threat['sources'] = []
                        fused_threat['sources'].append('thermal')
        
        logger.info(f"Fused detections from multiple sources: {len(fused_threats)} threats")
        return fused_threats


# Usage Example
if __name__ == "__main__":
    detector = AerialThreatDetector('yolov8x.pt')
    fusion = MultiSourceDataFusion()
    
    # Example frame detection
    frame = cv2.imread('sample_frame.jpg')
    threats = detector.detect_threats(frame)
    
    # Classify severity
    for threat in threats:
        threat = detector.classify_threat_severity(
            threat, 
            altitude=45.0, 
            proximity_to_crowd=150.0
        )
    
    print(f"Detected threats: {threats}")
