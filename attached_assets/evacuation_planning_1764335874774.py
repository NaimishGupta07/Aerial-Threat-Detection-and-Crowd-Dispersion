# Evacuation Planning Module - Route Optimization & GIS Integration

import numpy as np
from typing import List, Dict, Tuple, Optional
import heapq
import logging
from dataclasses import dataclass
from enum import Enum

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class Location:
    x: float
    y: float
    
    def distance_to(self, other: 'Location') -> float:
        """Calculate Euclidean distance"""
        return np.sqrt((self.x - other.x)**2 + (self.y - other.y)**2)

class ZoneType(Enum):
    SAFE = 1
    DANGER = 2
    EVACUATION = 3
    SHELTER = 4
    BOTTLENECK = 5

@dataclass
class Zone:
    zone_id: str
    zone_type: ZoneType
    center: Location
    radius: float
    capacity: int = None
    current_occupancy: int = 0
    severity: float = 0.0  # 0-1, relevance for danger zones

class EvacuationPlanner:
    """Dynamic evacuation route planning using graph algorithms"""
    
    def __init__(self, map_width: int = 1000, map_height: int = 1000):
        """
        Initialize evacuation planner
        
        Args:
            map_width: Width of operational area
            map_height: Height of operational area
        """
        self.map_width = map_width
        self.map_height = map_height
        self.safe_zones: List[Zone] = []
        self.danger_zones: List[Zone] = []
        self.shelters: List[Zone] = []
        self.routes_cache: Dict = {}
        
    def register_safe_zone(self, zone_id: str, center: Location, 
                          radius: float, capacity: int):
        """Register a safe evacuation zone"""
        zone = Zone(zone_id, ZoneType.SAFE, center, radius, capacity)
        self.safe_zones.append(zone)
        logger.info(f"Registered safe zone: {zone_id}")
    
    def register_danger_zone(self, zone_id: str, center: Location, 
                            radius: float, severity: float = 0.5):
        """Register a danger zone from threat impact"""
        zone = Zone(zone_id, ZoneType.DANGER, center, radius, severity=severity)
        self.danger_zones.append(zone)
        logger.warning(f"Registered danger zone: {zone_id} with severity {severity}")
    
    def register_shelter(self, zone_id: str, center: Location, 
                        radius: float, capacity: int):
        """Register a shelter"""
        zone = Zone(zone_id, ZoneType.SHELTER, center, radius, capacity)
        self.shelters.append(zone)
        logger.info(f"Registered shelter: {zone_id}")
    
    def calculate_optimal_route(self, start: Location, 
                               avoid_danger: bool = True,
                               max_distance: float = None) -> Dict:
        """
        Calculate optimal route from start position to safe zone
        
        Args:
            start: Starting location
            avoid_danger: Whether to avoid danger zones
            max_distance: Maximum allowed route distance
            
        Returns:
            Route information with waypoints
        """
        best_route = None
        best_distance = float('inf')
        best_time = float('inf')
        
        for safe_zone in self.safe_zones:
            # Simple straight-line distance first
            distance = start.distance_to(safe_zone.center)
            
            # Check if route passes through danger zone
            route_safe = True
            if avoid_danger:
                route_safe = self._check_route_safety(start, safe_zone.center)
            
            # Add capacity consideration
            if safe_zone.current_occupancy < safe_zone.capacity:
                # Estimate time (assume 1 unit distance = 1 time unit)
                time = distance
                
                if route_safe and time < best_time:
                    if max_distance is None or distance <= max_distance:
                        best_time = time
                        best_distance = distance
                        best_route = {
                            'destination': safe_zone.zone_id,
                            'destination_center': safe_zone.center,
                            'distance': distance,
                            'estimated_time': time,
                            'waypoints': [start, safe_zone.center],
                            'feasibility': 'HIGH',
                            'risk_level': 'LOW' if route_safe else 'MEDIUM'
                        }
        
        if best_route is None:
            # Fallback to nearest zone even if not ideal
            nearest_zone = min(self.safe_zones, 
                             key=lambda z: start.distance_to(z.center))
            best_route = {
                'destination': nearest_zone.zone_id,
                'destination_center': nearest_zone.center,
                'distance': start.distance_to(nearest_zone.center),
                'estimated_time': start.distance_to(nearest_zone.center),
                'waypoints': [start, nearest_zone.center],
                'feasibility': 'MEDIUM',
                'risk_level': 'MEDIUM'
            }
        
        return best_route
    
    def _check_route_safety(self, start: Location, end: Location) -> bool:
        """Check if route intersects with danger zones"""
        for danger_zone in self.danger_zones:
            # Calculate distance from danger zone center to line segment
            distance = self._point_to_segment_distance(
                danger_zone.center, start, end
            )
            
            if distance < danger_zone.radius:
                return False
        
        return True
    
    def _point_to_segment_distance(self, point: Location, 
                                   seg_start: Location, 
                                   seg_end: Location) -> float:
        """Calculate distance from point to line segment"""
        px, py = point.x, point.y
        x1, y1 = seg_start.x, seg_start.y
        x2, y2 = seg_end.x, seg_end.y
        
        # Vector from start to end
        dx = x2 - x1
        dy = y2 - y1
        
        if dx == 0 and dy == 0:
            return point.distance_to(seg_start)
        
        # Parameter t of closest point on line
        t = max(0, min(1, ((px - x1) * dx + (py - y1) * dy) / (dx*dx + dy*dy)))
        
        # Closest point on segment
        closest_x = x1 + t * dx
        closest_y = y1 + t * dy
        
        # Distance
        return np.sqrt((px - closest_x)**2 + (py - closest_y)**2)
    
    def optimize_crowd_routes(self, crowd_positions: List[Location],
                             threat_impact_zone: Dict) -> List[Dict]:
        """
        Optimize routes for crowd based on threat impact
        
        Args:
            crowd_positions: List of crowd member positions
            threat_impact_zone: Threat impact zone info
            
        Returns:
            List of optimized routes per person
        """
        # Create danger zone from threat
        impact_center = Location(
            threat_impact_zone['impact_center'][0],
            threat_impact_zone['impact_center'][1]
        )
        
        self.register_danger_zone(
            'threat_impact',
            impact_center,
            threat_impact_zone['impact_radius'],
            severity=0.9
        )
        
        # Calculate routes for all crowd members
        routes = []
        for position in crowd_positions:
            route = self.calculate_optimal_route(position, avoid_danger=True)
            routes.append(route)
        
        # Load balance routes to avoid congestion
        route_counts = {}
        for route in routes:
            dest = route['destination']
            route_counts[dest] = route_counts.get(dest, 0) + 1
        
        # Adjust routes if one destination is overloaded
        for route in routes:
            dest = route['destination']
            dest_zone = next(z for z in self.safe_zones if z.zone_id == dest)
            
            if route_counts[dest] > dest_zone.capacity * 0.8:
                # Find alternative route
                # This would trigger rerouting logic
                route['feasibility'] = 'LOW'
                route['needs_rerouting'] = True
        
        return routes
    
    def get_evacuation_map(self) -> Dict:
        """Generate evacuation map data"""
        return {
            'safe_zones': [(z.center.x, z.center.y, z.radius) for z in self.safe_zones],
            'danger_zones': [(z.center.x, z.center.y, z.radius, z.severity) 
                           for z in self.danger_zones],
            'shelters': [(z.center.x, z.center.y, z.radius) for z in self.shelters]
        }


class GISIntegrator:
    """Integrate with GIS systems for map-based planning"""
    
    def __init__(self, map_api_key: Optional[str] = None):
        """
        Initialize GIS integrator
        
        Args:
            map_api_key: API key for mapping service (e.g., Google Maps)
        """
        self.map_api_key = map_api_key
        self.building_map = {}
        self.street_map = {}
        
    def load_building_data(self, building_geojson: Dict):
        """Load building footprints from GeoJSON"""
        for feature in building_geojson.get('features', []):
            building_id = feature['properties'].get('id')
            coordinates = feature['geometry']['coordinates']
            self.building_map[building_id] = coordinates
            
        logger.info(f"Loaded {len(self.building_map)} buildings")
    
    def load_street_network(self, street_geojson: Dict):
        """Load street network topology"""
        for feature in street_geojson.get('features', []):
            street_id = feature['properties'].get('id')
            coordinates = feature['geometry']['coordinates']
            self.street_map[street_id] = coordinates
            
        logger.info(f"Loaded {len(self.street_map)} street segments")
    
    def calculate_accessibility(self, location: Location) -> Dict:
        """Calculate accessibility from location"""
        # Find nearest accessible points
        nearest_streets = self._find_nearest_streets(location, k=3)
        
        return {
            'location': (location.x, location.y),
            'accessibility_score': 0.8,
            'nearest_streets': nearest_streets,
            'walkability': 'HIGH'
        }
    
    def _find_nearest_streets(self, location: Location, k: int = 3) -> List:
        """Find k nearest street segments"""
        distances = []
        
        for street_id, coordinates in self.street_map.items():
            # Simple distance to first coordinate
            coord = coordinates[0]
            dist = location.distance_to(Location(coord[0], coord[1]))
            distances.append((dist, street_id))
        
        return sorted(distances, key=lambda x: x[0])[:k]
    
    def generate_evacuation_map_html(self, evacuation_data: Dict) -> str:
        """Generate interactive HTML map for evacuation"""
        html = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8' />
            <title>Evacuation Map</title>
            <meta name='viewport' content='initial-scale=1,maximum-scale=1,user-scalable=no' />
            <script src='https://cdn.jsdelivr.net/npm/mapbox-gl@2/dist/mapbox-gl.js'></script>
            <link href='https://cdn.jsdelivr.net/npm/mapbox-gl@2/dist/mapbox-gl.css' rel='stylesheet' />
            <style>
                body { margin:0; padding:0; }
                #map { position: absolute; top:0; bottom:0; width:100%; }
            </style>
        </head>
        <body>
            <div id='map'></div>
            <script>
                // Map initialization would go here
                // Display safe zones, danger zones, and recommended routes
            </script>
        </body>
        </html>
        """
        return html


class DynamicRouteAdjuster:
    """Dynamically adjust evacuation routes based on real-time conditions"""
    
    def __init__(self, replan_threshold: float = 0.2):
        """
        Initialize dynamic adjuster
        
        Args:
            replan_threshold: Change threshold to trigger replanning
        """
        self.replan_threshold = replan_threshold
        self.last_plan_time = 0
        self.plan_update_interval = 2.0  # Seconds
        
    def should_replan(self, current_state: Dict, previous_state: Dict) -> bool:
        """Determine if route replanning is needed"""
        # Calculate change metrics
        
        # Crowd density change
        density_change = abs(
            current_state.get('crowd_density', 0) - 
            previous_state.get('crowd_density', 0)
        )
        
        # Threat position change
        threat_change = current_state.get('threat_distance_change', 0)
        
        # Bottleneck change
        bottleneck_change = len(current_state.get('bottlenecks', [])) - \
                          len(previous_state.get('bottlenecks', []))
        
        # Decide if replanning needed
        needs_replan = (
            density_change > self.replan_threshold or
            threat_change > 10 or
            bottleneck_change > 0
        )
        
        return needs_replan
    
    def adjust_route(self, current_route: Dict, 
                    current_conditions: Dict) -> Dict:
        """Adjust a single route based on current conditions"""
        adjusted_route = current_route.copy()
        
        # Check for congestion
        if current_conditions.get('destination_congestion', 0) > 0.8:
            adjusted_route['feasibility'] = 'LOW'
            adjusted_route['needs_alternative'] = True
        
        # Check for new obstacles
        if len(current_conditions.get('new_obstacles', [])) > 0:
            adjusted_route['needs_alternative'] = True
        
        return adjusted_route


# Usage Example
if __name__ == "__main__":
    planner = EvacuationPlanner(1000, 1000)
    gis = GISIntegrator()
    
    # Register zones
    planner.register_safe_zone('zone_1', Location(100, 100), 50, 500)
    planner.register_safe_zone('zone_2', Location(800, 800), 50, 300)
    planner.register_shelter('shelter_1', Location(500, 500), 100, 1000)
    
    # Calculate route
    start = Location(250, 250)
    route = planner.calculate_optimal_route(start)
    print(f"Optimal route: {route}")
    
    # Test with multiple crowd positions
    crowd = [Location(250 + i*10, 250 + i*5) for i in range(20)]
    threat_zone = {
        'impact_center': (100, 100),
        'impact_radius': 150
    }
    
    routes = planner.optimize_crowd_routes(crowd, threat_zone)
    print(f"Generated {len(routes)} routes")
