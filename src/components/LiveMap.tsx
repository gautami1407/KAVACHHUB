import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";

interface LiveMapProps {
  className?: string;
  showRoute?: boolean;
  ambulanceProgress?: number; // 0-100
  startCoords?: [number, number];
  endCoords?: [number, number];
  children?: React.ReactNode;
}

const NOIDA_START: [number, number] = [28.6139, 77.2090]; // Delhi
const HOSPITAL_END: [number, number] = [28.5672, 77.2100]; // AIIMS area

export function LiveMap({
  className,
  showRoute = false,
  ambulanceProgress = 0,
  startCoords = NOIDA_START,
  endCoords = HOSPITAL_END,
  children,
}: LiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const ambulanceMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const corridorGlowRef = useRef<L.Polyline | null>(null);

  // Generate a realistic curved route between two points
  const routePoints = useRef<[number, number][]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [(startCoords[0] + endCoords[0]) / 2, (startCoords[1] + endCoords[1]) / 2],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    // Clean white-themed map tiles
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    // Add zoom control to bottom-right
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Generate curved route points
    const points: [number, number][] = [];
    const steps = 50;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lat = startCoords[0] + (endCoords[0] - startCoords[0]) * t +
        Math.sin(t * Math.PI) * 0.008 * Math.sin(t * 3 * Math.PI);
      const lng = startCoords[1] + (endCoords[1] - startCoords[1]) * t +
        Math.cos(t * Math.PI * 2) * 0.005;
      points.push([lat, lng]);
    }
    routePoints.current = points;

    // Hospital marker
    const hospitalIcon = L.divIcon({
      className: "custom-marker",
      html: `<div style="width:32px;height:32px;background:#22c55e;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(34,197,94,0.4);font-size:16px;">🏥</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    L.marker(endCoords, { icon: hospitalIcon }).addTo(map);

    // Patient marker
    const patientIcon = L.divIcon({
      className: "custom-marker",
      html: `<div style="width:28px;height:28px;background:#ff3b30;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(255,59,48,0.4);font-size:14px;">📍</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    L.marker(startCoords, { icon: patientIcon }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle route and ambulance position updates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !showRoute || routePoints.current.length === 0) return;

    // Draw corridor glow (wider, semi-transparent green line)
    if (!corridorGlowRef.current) {
      corridorGlowRef.current = L.polyline(routePoints.current, {
        color: "#22c55e",
        weight: 12,
        opacity: 0.2,
      }).addTo(map);
    }

    // Draw route line
    if (!routeLineRef.current) {
      routeLineRef.current = L.polyline(routePoints.current, {
        color: "#007AFF",
        weight: 4,
        opacity: 0.8,
        dashArray: "10, 8",
      }).addTo(map);
    }

    // Update ambulance position
    const idx = Math.min(
      Math.floor((ambulanceProgress / 100) * (routePoints.current.length - 1)),
      routePoints.current.length - 1
    );
    const pos = routePoints.current[idx];

    if (!ambulanceMarkerRef.current) {
      const ambIcon = L.divIcon({
        className: "ambulance-marker",
        html: `<div style="width:40px;height:40px;background:white;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #ff3b30;box-shadow:0 0 16px rgba(255,59,48,0.5),0 4px 12px rgba(0,0,0,0.15);font-size:20px;animation:ambulancePulse 1.5s infinite;">🚑</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });
      ambulanceMarkerRef.current = L.marker(pos, { icon: ambIcon, zIndexOffset: 1000 }).addTo(map);
    } else {
      ambulanceMarkerRef.current.setLatLng(pos);
    }

    // Color the traversed portion green
    const traversed = routePoints.current.slice(0, idx + 1);
    if (traversed.length > 1) {
      // Update corridor glow to show traversed portion
      corridorGlowRef.current?.setLatLngs(traversed);
      corridorGlowRef.current?.setStyle({ color: "#22c55e", opacity: 0.35, weight: 14 });
    }

    // Pan map to follow ambulance
    map.panTo(pos, { animate: true, duration: 1 });
  }, [showRoute, ambulanceProgress]);

  return (
    <div className={cn("relative rounded-2xl overflow-hidden border border-border", className)}>
      <div ref={mapRef} className="w-full h-full" />

      {/* Overlay badges */}
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-1.5 bg-card/90 backdrop-blur-sm px-3 py-2 rounded-xl border border-border text-xs font-medium shadow-sm">
        <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
        Live Tracking
      </div>

      {showRoute && (
        <div className="absolute bottom-3 right-3 z-[1000] flex items-center gap-1.5 bg-success/10 backdrop-blur-sm px-3 py-2 rounded-xl border border-success/20 text-xs text-success font-medium">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          Green Corridor Active
        </div>
      )}

      {children}

      <style>{`
        @keyframes ambulancePulse {
          0%, 100% { box-shadow: 0 0 16px rgba(255,59,48,0.5), 0 4px 12px rgba(0,0,0,0.15); }
          50% { box-shadow: 0 0 28px rgba(255,59,48,0.7), 0 4px 16px rgba(0,0,0,0.2); }
        }
      `}</style>
    </div>
  );
}
