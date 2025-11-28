import { MapContainer, TileLayer, Circle, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

// Fix Leaflet icon issue
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export function ThreatMap() {
  const position: [number, number] = [40.7128, -74.0060]; // NYC Example
  
  const threats = [
    { pos: [40.7148, -74.0060] as [number, number], radius: 200, type: "threat" },
    { pos: [40.7118, -74.0090] as [number, number], radius: 150, type: "threat" },
  ];

  const safeZones = [
    { pos: [40.7100, -74.0020] as [number, number], radius: 300, type: "safe" }
  ];

  const evacuationRoute: [number, number][] = [
    [40.7148, -74.0060],
    [40.7138, -74.0040],
    [40.7110, -74.0030],
    [40.7100, -74.0020]
  ];

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-border relative">
      <MapContainer 
        center={position} 
        zoom={14} 
        scrollWheelZoom={false} 
        className="w-full h-full bg-card"
        style={{ background: '#0f172a' }} // Match theme background
      >
        {/* Dark Map Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Threat Zones */}
        {threats.map((t, i) => (
          <Circle 
            key={`threat-${i}`}
            center={t.pos} 
            pathOptions={{ 
              color: 'var(--color-destructive)', 
              fillColor: 'var(--color-destructive)', 
              fillOpacity: 0.2,
              weight: 1,
              dashArray: '5, 10'
            }} 
            radius={t.radius} 
          />
        ))}

        {/* Safe Zones */}
        {safeZones.map((z, i) => (
          <Circle 
            key={`safe-${i}`}
            center={z.pos} 
            pathOptions={{ 
              color: 'var(--color-status-ok)', 
              fillColor: 'var(--color-status-ok)', 
              fillOpacity: 0.2,
              weight: 2
            }} 
            radius={z.radius} 
          />
        ))}

        {/* Evacuation Route */}
        <Polyline 
          positions={evacuationRoute}
          pathOptions={{
            color: 'var(--color-status-ok)',
            weight: 3,
            dashArray: '10, 10',
            opacity: 0.8
          }}
        />
        
        {/* Animated Pulse for Threats */}
        {threats.map((t, i) => (
           <Marker key={`m-${i}`} position={t.pos}>
             <Popup className="font-mono text-xs">
               THREAT DETECTED<br/>
               CONFIDENCE: 98%
             </Popup>
           </Marker>
        ))}

      </MapContainer>

      {/* Map Overlay UI */}
      <div className="absolute top-4 right-4 z-[1000] bg-black/80 backdrop-blur p-4 rounded-md border border-border text-xs font-mono space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive/50 border border-destructive" />
          <span>THREAT ZONE</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-status-ok/50 border border-status-ok" />
          <span>SAFE ZONE</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-1 bg-status-ok" />
          <span>EVACUATION RTE</span>
        </div>
      </div>
    </div>
  );
}
