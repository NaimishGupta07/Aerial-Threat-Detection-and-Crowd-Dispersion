# Trajectory Prediction Module - Kalman Filter & RNN

import numpy as np
from collections import deque
from typing import List, Dict, Tuple
import logging
from scipy import stats
from tensorflow import keras
from tensorflow.keras import layers

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class KalmanFilter1D:
    """1D Kalman Filter for trajectory estimation"""
    
    def __init__(self, process_variance: float, measurement_variance: float):
        """
        Initialize Kalman filter
        
        Args:
            process_variance: Process noise covariance (Q)
            measurement_variance: Measurement noise covariance (R)
        """
        self.q = process_variance
        self.r = measurement_variance
        self.x = 0.0  # State estimate
        self.p = 1.0  # Estimate error
        self.k = 0.0  # Kalman gain
        
    def update(self, measurement: float) -> float:
        """
        Update filter with measurement
        
        Args:
            measurement: New measurement value
            
        Returns:
            Updated state estimate
        """
        # Predict
        self.p = self.p + self.q
        
        # Update
        self.k = self.p / (self.p + self.r)
        self.x = self.x + self.k * (measurement - self.x)
        self.p = (1 - self.k) * self.p
        
        return self.x
    
    def predict(self, steps: int = 1) -> List[float]:
        """Predict future values"""
        predictions = []
        current_state = self.x
        for _ in range(steps):
            current_state = current_state  # Constant velocity model
            predictions.append(current_state)
        return predictions


class TrajectoryPredictor:
    """Predict aerial threat trajectory using Kalman filters and RNN"""
    
    def __init__(self, prediction_horizon: int = 30, history_size: int = 10):
        """
        Initialize trajectory predictor
        
        Args:
            prediction_horizon: Number of frames to predict ahead
            history_size: Number of past frames to use for prediction
        """
        self.prediction_horizon = prediction_horizon
        self.history_size = history_size
        
        # Initialize Kalman filters for x, y, and velocity components
        self.kf_x = KalmanFilter1D(0.01, 0.1)
        self.kf_y = KalmanFilter1D(0.01, 0.1)
        self.kf_vx = KalmanFilter1D(0.01, 0.1)
        self.kf_vy = KalmanFilter1D(0.01, 0.1)
        
        # History buffers
        self.position_history = deque(maxlen=history_size)
        self.velocity_history = deque(maxlen=history_size)
        
        # Build LSTM model for trajectory prediction
        self.lstm_model = self._build_lstm_model()
        
    def _build_lstm_model(self):
        """Build LSTM model for trajectory prediction"""
        model = keras.Sequential([
            layers.LSTM(64, activation='relu', 
                       input_shape=(self.history_size, 4),
                       return_sequences=True),
            layers.Dropout(0.2),
            layers.LSTM(32, activation='relu'),
            layers.Dropout(0.2),
            layers.Dense(64, activation='relu'),
            layers.Dense(self.prediction_horizon * 2)  # x, y predictions
        ])
        model.compile(optimizer='adam', loss='mse')
        return model
    
    def update_position(self, center: Tuple[int, int], 
                       altitude: float = 0.0) -> Dict:
        """
        Update position and velocity estimates
        
        Args:
            center: Current center coordinates (x, y)
            altitude: Current altitude
            
        Returns:
            Updated trajectory state
        """
        x, y = center
        
        # Update Kalman filters
        filtered_x = self.kf_x.update(x)
        filtered_y = self.kf_y.update(y)
        
        # Calculate velocity if we have history
        if len(self.position_history) > 0:
            prev_x, prev_y, _ = self.position_history[-1]
            vx = filtered_x - prev_x
            vy = filtered_y - prev_y
            
            # Update velocity filters
            filtered_vx = self.kf_vx.update(vx)
            filtered_vy = self.kf_vy.update(vy)
        else:
            filtered_vx = 0.0
            filtered_vy = 0.0
        
        # Store in history
        self.position_history.append((filtered_x, filtered_y, altitude))
        self.velocity_history.append((filtered_vx, filtered_vy))
        
        state = {
            'position': (filtered_x, filtered_y),
            'velocity': (filtered_vx, filtered_vy),
            'altitude': altitude,
            'speed': np.sqrt(filtered_vx**2 + filtered_vy**2)
        }
        
        return state
    
    def predict_trajectory(self, steps: int = None) -> List[Dict]:
        """
        Predict future trajectory
        
        Args:
            steps: Number of frames to predict (default: prediction_horizon)
            
        Returns:
            List of predicted positions
        """
        if steps is None:
            steps = self.prediction_horizon
        
        if len(self.position_history) < 2:
            return []
        
        # Use last position and velocity for linear prediction
        last_x, last_y, last_alt = self.position_history[-1]
        last_vx, last_vy = self.velocity_history[-1] if len(self.velocity_history) > 0 else (0, 0)
        
        predictions = []
        
        for t in range(1, steps + 1):
            # Linear extrapolation
            pred_x = last_x + last_vx * t
            pred_y = last_y + last_vy * t
            pred_alt = last_alt  # Assume constant altitude for now
            
            # Calculate confidence based on velocity consistency
            if len(self.velocity_history) > 2:
                velocity_variance = np.var([v[0] for v in self.velocity_history])
                confidence = max(0.5, 1.0 - min(velocity_variance * 0.01, 0.5))
            else:
                confidence = 0.7
            
            predictions.append({
                'time_step': t,
                'position': (pred_x, pred_y),
                'altitude': pred_alt,
                'confidence': confidence
            })
        
        return predictions
    
    def detect_anomaly(self) -> bool:
        """
        Detect anomalous flight behavior
        
        Returns:
            True if anomalous behavior detected
        """
        if len(self.velocity_history) < 3:
            return False
        
        velocities = list(self.velocity_history)
        vx_values = [v[0] for v in velocities]
        vy_values = [v[1] for v in velocities]
        
        # Calculate Z-scores
        vx_zscore = np.abs(stats.zscore(vx_values)[-1])
        vy_zscore = np.abs(stats.zscore(vy_values)[-1])
        
        # Anomaly if Z-score > 3
        is_anomaly = vx_zscore > 3 or vy_zscore > 3
        
        if is_anomaly:
            logger.warning(f"Anomalous behavior detected! VX Z-score: {vx_zscore}, VY Z-score: {vy_zscore}")
        
        return is_anomaly
    
    def get_impact_zone(self, impact_time: float, 
                       ground_level: float = 0.0) -> Dict:
        """
        Calculate probable impact zone
        
        Args:
            impact_time: Time until impact (seconds)
            ground_level: Ground altitude
            
        Returns:
            Impact zone prediction
        """
        if len(self.position_history) == 0:
            return None
        
        last_x, last_y, last_alt = self.position_history[-1]
        last_vx, last_vy = self.velocity_history[-1] if len(self.velocity_history) > 0 else (0, 0)
        
        # Calculate impact position
        impact_x = last_x + last_vx * impact_time
        impact_y = last_y + last_vy * impact_time
        
        # Estimate impact radius based on velocity
        impact_speed = np.sqrt(last_vx**2 + last_vy**2)
        impact_radius = max(50, impact_speed * 5)  # Minimum 50m radius
        
        return {
            'impact_center': (impact_x, impact_y),
            'impact_radius': impact_radius,
            'confidence': 0.8 if len(self.velocity_history) > 5 else 0.5,
            'time_to_impact': impact_time
        }


class AnomalyDetector:
    """Detect anomalous flight patterns"""
    
    def __init__(self, window_size: int = 30):
        self.window_size = window_size
        self.trajectory_history = deque(maxlen=window_size)
        
    def add_trajectory_point(self, trajectory_data: Dict):
        """Add trajectory point for analysis"""
        self.trajectory_history.append(trajectory_data)
    
    def detect_stationary(self, threshold: float = 5.0) -> bool:
        """Detect if object is stationary"""
        if len(self.trajectory_history) < 5:
            return False
        
        positions = [t['position'] for t in self.trajectory_history]
        distances = [np.sqrt((positions[i+1][0] - positions[i][0])**2 +
                            (positions[i+1][1] - positions[i][1])**2)
                    for i in range(len(positions)-1)]
        
        avg_distance = np.mean(distances)
        return avg_distance < threshold
    
    def detect_erratic_movement(self, threshold: float = 2.0) -> bool:
        """Detect erratic/zigzag movement pattern"""
        if len(self.trajectory_history) < 3:
            return False
        
        velocities = [t.get('velocity', (0, 0)) for t in self.trajectory_history]
        
        # Calculate direction changes
        direction_changes = []
        for i in range(1, len(velocities)):
            v1 = velocities[i-1]
            v2 = velocities[i]
            
            # Calculate angle between consecutive velocities
            dot_product = v1[0]*v2[0] + v1[1]*v2[1]
            mag1 = np.sqrt(v1[0]**2 + v1[1]**2)
            mag2 = np.sqrt(v2[0]**2 + v2[1]**2)
            
            if mag1 > 0 and mag2 > 0:
                angle = np.arccos(np.clip(dot_product / (mag1*mag2), -1, 1))
                direction_changes.append(np.degrees(angle))
        
        avg_direction_change = np.mean(direction_changes) if direction_changes else 0
        return avg_direction_change > threshold
    
    def detect_acceleration_spike(self, threshold: float = 10.0) -> bool:
        """Detect sudden acceleration"""
        if len(self.trajectory_history) < 2:
            return False
        
        speeds = [t.get('speed', 0) for t in self.trajectory_history]
        
        # Check for rapid speed changes
        speed_changes = [abs(speeds[i] - speeds[i-1]) for i in range(1, len(speeds))]
        
        if speed_changes:
            max_acceleration = max(speed_changes)
            return max_acceleration > threshold
        
        return False


# Usage Example
if __name__ == "__main__":
    predictor = TrajectoryPredictor()
    
    # Simulate threat movement
    for i in range(50):
        x = 200 + i * 5  # Linear movement
        y = 150 + i * 2
        state = predictor.update_position((x, y), altitude=100.0)
        
        # Check for anomaly
        if predictor.detect_anomaly():
            print(f"Anomaly detected at frame {i}")
    
    # Predict future trajectory
    predictions = predictor.predict_trajectory(steps=30)
    print(f"Predicted trajectory: {predictions[:5]}")
    
    # Calculate impact zone
    impact = predictor.get_impact_zone(impact_time=5.0)
    print(f"Impact zone: {impact}")
