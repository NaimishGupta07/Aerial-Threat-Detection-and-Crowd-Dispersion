# Crowd Management Module - Density Analysis & Panic Detection

import cv2
import numpy as np
from typing import List, Dict, Tuple
from scipy.ndimage import label
from collections import deque
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CrowdDensityAnalyzer:
    """Analyze crowd density and distribution using computer vision"""
    
    def __init__(self, grid_size: int = 32, density_threshold: float = 0.7):
        """
        Initialize crowd analyzer
        
        Args:
            grid_size: Size of density analysis grid
            density_threshold: Threshold for high-density detection
        """
        self.grid_size = grid_size
        self.density_threshold = density_threshold
        self.density_history = deque(maxlen=30)
        
    def detect_crowd(self, frame: np.ndarray) -> Tuple[np.ndarray, Dict]:
        """
        Detect crowd regions in frame
        
        Args:
            frame: Input video frame
            
        Returns:
            Crowd mask and statistics
        """
        # Convert to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian blur
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Detect edges
        edges = cv2.Canny(blurred, 50, 150)
        
        # Dilate to connect nearby points
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        dilated = cv2.dilate(edges, kernel, iterations=2)
        
        # Find contours
        contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, 
                                       cv2.CHAIN_APPROX_SIMPLE)
        
        # Create crowd mask
        crowd_mask = np.zeros_like(gray)
        cv2.drawContours(crowd_mask, contours, -1, 255, -1)
        
        # Calculate statistics
        crowd_pixels = np.count_nonzero(crowd_mask)
        total_pixels = crowd_mask.shape[0] * crowd_mask.shape[1]
        crowd_density = crowd_pixels / total_pixels
        
        stats = {
            'crowd_pixels': crowd_pixels,
            'crowd_density': crowd_density,
            'crowd_percentage': crowd_density * 100,
            'num_regions': len(contours)
        }
        
        self.density_history.append(crowd_density)
        
        return crowd_mask, stats
    
    def analyze_grid_density(self, crowd_mask: np.ndarray) -> Dict:
        """
        Analyze density in grid cells
        
        Args:
            crowd_mask: Binary mask of crowd regions
            
        Returns:
            Grid-based density analysis
        """
        height, width = crowd_mask.shape
        cell_height = height // self.grid_size
        cell_width = width // self.grid_size
        
        density_grid = np.zeros((self.grid_size, self.grid_size))
        high_density_zones = []
        low_density_zones = []
        
        for i in range(self.grid_size):
            for j in range(self.grid_size):
                y_start = i * cell_height
                y_end = (i + 1) * cell_height
                x_start = j * cell_width
                x_end = (j + 1) * cell_width
                
                cell = crowd_mask[y_start:y_end, x_start:x_end]
                cell_density = np.sum(cell) / (cell.size * 255)
                density_grid[i, j] = cell_density
                
                if cell_density > self.density_threshold:
                    high_density_zones.append({
                        'grid_pos': (i, j),
                        'pixel_pos': (x_start, y_start),
                        'density': cell_density
                    })
                elif cell_density < 0.1:
                    low_density_zones.append({
                        'grid_pos': (i, j),
                        'pixel_pos': (x_start, y_start),
                        'density': cell_density
                    })
        
        return {
            'density_grid': density_grid,
            'high_density_zones': high_density_zones,
            'low_density_zones': low_density_zones,
            'max_density': np.max(density_grid),
            'avg_density': np.mean(density_grid)
        }
    
    def detect_bottlenecks(self, crowd_mask: np.ndarray) -> List[Dict]:
        """
        Detect bottleneck regions where crowd is congested
        
        Args:
            crowd_mask: Binary mask of crowd regions
            
        Returns:
            List of bottleneck regions
        """
        # Label connected components
        labeled, num_features = label(crowd_mask)
        
        bottlenecks = []
        
        for region_id in range(1, num_features + 1):
            region = (labeled == region_id)
            
            # Calculate region properties
            contours, _ = cv2.findContours(region.astype(np.uint8) * 255,
                                          cv2.RETR_EXTERNAL,
                                          cv2.CHAIN_APPROX_SIMPLE)
            
            if len(contours) > 0:
                contour = contours[0]
                area = cv2.contourArea(contour)
                perimeter = cv2.arcLength(contour, True)
                
                # Compactness metric (high = compact/bottleneck)
                if perimeter > 0:
                    compactness = (4 * np.pi * area) / (perimeter ** 2)
                    
                    if compactness > 0.5:  # Compact regions = bottlenecks
                        M = cv2.moments(contour)
                        if M['m00'] != 0:
                            cx = int(M['m10'] / M['m00'])
                            cy = int(M['m01'] / M['m00'])
                            
                            bottlenecks.append({
                                'center': (cx, cy),
                                'area': area,
                                'compactness': compactness,
                                'perimeter': perimeter,
                                'severity': min(1.0, compactness * 1.5)
                            })
        
        return sorted(bottlenecks, key=lambda x: x['severity'], reverse=True)


class PanicDetector:
    """Detect panic and anomalous crowd behavior"""
    
    def __init__(self, sensitivity: float = 0.7):
        """
        Initialize panic detector
        
        Args:
            sensitivity: Detection sensitivity (0-1)
        """
        self.sensitivity = sensitivity
        self.motion_history = deque(maxlen=30)
        self.panic_score_history = deque(maxlen=30)
        
    def analyze_motion(self, frame1: np.ndarray, frame2: np.ndarray) -> Dict:
        """
        Analyze motion between consecutive frames
        
        Args:
            frame1: Previous frame
            frame2: Current frame
            
        Returns:
            Motion analysis
        """
        # Convert to grayscale
        gray1 = cv2.cvtColor(frame1, cv2.COLOR_BGR2GRAY)
        gray2 = cv2.cvtColor(frame2, cv2.COLOR_BGR2GRAY)
        
        # Calculate optical flow
        flow = cv2.calcOpticalFlowFarneback(gray1, gray2, None, 0.5, 3, 15, 3, 5, 1.2, 0)
        
        # Calculate motion magnitude
        magnitude, angle = cv2.cartToPolar(flow[..., 0], flow[..., 1])
        
        # Statistics
        avg_motion = np.mean(magnitude)
        max_motion = np.max(magnitude)
        motion_variance = np.var(magnitude)
        
        # Count high-motion regions
        high_motion_threshold = np.mean(magnitude) + np.std(magnitude)
        high_motion_regions = np.sum(magnitude > high_motion_threshold)
        high_motion_percentage = high_motion_regions / magnitude.size
        
        motion_data = {
            'avg_motion': avg_motion,
            'max_motion': max_motion,
            'motion_variance': motion_variance,
            'high_motion_percentage': high_motion_percentage,
            'motion_magnitude': magnitude
        }
        
        self.motion_history.append(motion_data)
        
        return motion_data
    
    def detect_panic_behavior(self, crowd_mask: np.ndarray, 
                             motion_data: Dict) -> Dict:
        """
        Detect panic behavior indicators
        
        Args:
            crowd_mask: Binary crowd mask
            motion_data: Motion analysis data
            
        Returns:
            Panic detection results
        """
        panic_indicators = 0
        max_score = 0
        
        # Indicator 1: High motion variance
        if motion_data.get('motion_variance', 0) > 5:
            panic_indicators += 1
            max_score += 0.3
        
        # Indicator 2: High percentage of high-motion regions
        if motion_data.get('high_motion_percentage', 0) > 0.4:
            panic_indicators += 1
            max_score += 0.3
        
        # Indicator 3: Sudden motion spikes
        if len(self.motion_history) > 5:
            recent_motions = [m['avg_motion'] for m in list(self.motion_history)[-5:]]
            motion_spike = max(recent_motions) > 2 * np.mean(recent_motions)
            if motion_spike:
                panic_indicators += 1
                max_score += 0.4
        
        # Calculate panic score
        panic_score = min(max_score, 1.0) * self.sensitivity
        
        # Determine panic level
        if panic_score > 0.7:
            panic_level = 'CRITICAL_PANIC'
        elif panic_score > 0.5:
            panic_level = 'HIGH_PANIC'
        elif panic_score > 0.3:
            panic_level = 'MODERATE_PANIC'
        else:
            panic_level = 'NORMAL'
        
        self.panic_score_history.append(panic_score)
        
        return {
            'panic_score': panic_score,
            'panic_level': panic_level,
            'panic_indicators': panic_indicators,
            'motion_severity': motion_data.get('avg_motion', 0)
        }
    
    def detect_stampede_risk(self) -> bool:
        """
        Detect stampede risk based on panic score trend
        
        Returns:
            True if stampede risk detected
        """
        if len(self.panic_score_history) < 5:
            return False
        
        recent_scores = list(self.panic_score_history)[-5:]
        
        # Stampede if panic scores consistently high and increasing
        avg_score = np.mean(recent_scores)
        trend = np.polyfit(range(len(recent_scores)), recent_scores, 1)[0]
        
        stampede_risk = avg_score > 0.6 and trend > 0.05
        
        if stampede_risk:
            logger.warning("Stampede risk detected!")
        
        return stampede_risk


class CrowdMovementTracker:
    """Track crowd movement patterns"""
    
    def __init__(self, max_history: int = 30):
        self.max_history = max_history
        self.movement_history = deque(maxlen=max_history)
        self.direction_history = deque(maxlen=max_history)
        
    def track_movement(self, frame: np.ndarray) -> Dict:
        """
        Track overall crowd movement direction
        
        Args:
            frame: Current frame
            
        Returns:
            Movement direction and velocity
        """
        # This would integrate with optical flow analysis
        # For now, placeholder
        movement = {
            'direction': np.random.uniform(0, 2*np.pi),  # Angle in radians
            'velocity': np.random.uniform(0, 5),  # Pixels per frame
            'intensity': np.random.uniform(0, 1)
        }
        
        self.movement_history.append(movement)
        
        return movement
    
    def get_evacuation_corridor(self) -> List[Tuple[int, int]]:
        """
        Calculate evacuation corridor based on crowd movement
        
        Returns:
            Points defining evacuation path
        """
        # Extract dominant movement direction
        if len(self.movement_history) > 0:
            directions = [m['direction'] for m in self.movement_history]
            avg_direction = np.mean(directions)
        else:
            avg_direction = np.pi / 4  # Default 45 degrees
        
        # Create corridor points
        start_point = (500, 500)  # Center
        corridor_length = 200
        
        end_x = start_point[0] + corridor_length * np.cos(avg_direction)
        end_y = start_point[1] + corridor_length * np.sin(avg_direction)
        
        corridor = [start_point, (int(end_x), int(end_y))]
        
        return corridor


# Usage Example
if __name__ == "__main__":
    analyzer = CrowdDensityAnalyzer()
    panic_detector = PanicDetector()
    
    # Example with dummy frames
    frame1 = cv2.imread('crowd_frame1.jpg')
    frame2 = cv2.imread('crowd_frame2.jpg')
    
    if frame1 is not None and frame2 is not None:
        crowd_mask, stats = analyzer.detect_crowd(frame2)
        grid_analysis = analyzer.analyze_grid_density(crowd_mask)
        bottlenecks = analyzer.detect_bottlenecks(crowd_mask)
        
        motion = panic_detector.analyze_motion(frame1, frame2)
        panic = panic_detector.detect_panic_behavior(crowd_mask, motion)
        
        print(f"Crowd Stats: {stats}")
        print(f"Panic Level: {panic['panic_level']}")
        print(f"Bottlenecks: {bottlenecks}")
