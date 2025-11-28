import { MapContainer, TileLayer, Circle, Marker, Popup, Polyline, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useState, useEffect } from "react";
import { Search, Crosshair, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

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

// Map Controller Component for handling view changes
function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom);
  }, [center, zoom, map]);
  return null;
}

// Click Handler for "Capturing Location"
function LocationMarker({ setPosition }: { setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      toast({
        title: "Location Capturing",
        description: `Coordinates captured: ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`,
        className: "bg-card border-primary text-foreground",
      });
    },
  });
  return null;
}

export function ThreatMap() {
  const [position, setPosition] = useState<[number, number]>([40.7128, -74.0060]); // NYC Default
  const [searchQuery, setSearchQuery] = useState("");
  const [capturedLocation, setCapturedLocation] = useState<[number, number] | null>(null);

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setPosition(newPos);
          toast({
            title: "Location Acquired",
            description: "Map centered on your current position.",
          });
        },
        () => {
          toast({
            title: "Geolocation Error",
            description: "Could not retrieve your location.",
            variant: "destructive",
          });
        }
      );
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock search for prototype - in real app, use OpenStreetMap Nominatim API
    if (searchQuery.toLowerCase().includes("times square")) {
      setPosition([40.7580, -73.9855]);
    } else if (searchQuery.toLowerCase().includes("central park")) {
      setPosition([40.7829, -73.9654]);
    } else {
      toast({
        title: "Simulated Search",
        description: "Try 'Times Square' or 'Central Park' for demo.",
      });
    }
  };

  const threats = [
    { pos: [position[0] + 0.002, position[1]] as [number, number], radius: 200, type: "threat" },
    { pos: [position[0] - 0.001, position[1] - 0.003] as [number, number], radius: 150, type: "threat" },
  ];

  const safeZones = [
    { pos: [position[0] - 0.0028, position[1] + 0.004] as [number, number], radius: 300, type: "safe" }
  ];

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-border relative group">
      {/* Search & Controls Overlay */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2 w-64">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search location..." 
            className="pl-9 bg-black/80 backdrop-blur border-border text-xs h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-black/80 backdrop-blur border-border text-xs justify-start gap-2 hover:bg-primary/20 hover:text-primary"
          onClick={handleLocateMe}
        >
          <Crosshair className="w-4 h-4" />
          LOCATE SQUAD
        </Button>
      </div>

      <MapContainer 
        center={position} 
        zoom={14} 
        scrollWheelZoom={true} 
        className="w-full h-full bg-card"
        style={{ background: '#0f172a' }}
      >
        <MapController center={position} zoom={14} />
        <LocationMarker setPosition={setCapturedLocation} />

        {/* Dark Map Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* User/Captured Location Marker */}
        {capturedLocation && (
          <Marker position={capturedLocation}>
             <Popup className="font-mono text-xs">
               TARGET LOCATION<br/>
               CAPTURED
             </Popup>
          </Marker>
        )}

        {/* Dynamic Threat Zones relative to center */}
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

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-black/80 backdrop-blur p-4 rounded-md border border-border text-xs font-mono space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive/50 border border-destructive" />
          <span>THREAT ZONE</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-status-ok/50 border border-status-ok" />
          <span>SAFE ZONE</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-primary rounded-full" />
          <span>TARGET LOCK</span>
        </div>
      </div>
    </div>
  );
}
