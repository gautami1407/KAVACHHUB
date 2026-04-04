import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";

interface SignalMarker {
  lat: number;
  lng: number;
  mode: 'normal' | 'emergency' | 'corridor';
  code: string;
}

interface LiveMapProps {
  className?: string;
  showRoute?: boolean;
  ambulanceProgress?: number; // 0-100 (used only when real coords unavailable)
  startCoords?: [number, number];  // emergency/patient location
  endCoords?: [number, number];    // hospital
  ambulanceLatLng?: [number, number]; // real-time ambulance position from DB
  signalMarkers?: SignalMarker[];
  children?: React.ReactNode;
}

const DELHI_CENTER: [number, number] = [28.6139, 77.2090];
const HOSPITAL_DEFAULT: [number, number] = [28.5672, 77.2100];

export function LiveMap({
  className,
  showRoute = false,
  ambulanceProgress = 0,
  startCoords = DELHI_CENTER,
  endCoords = HOSPITAL_DEFAULT,
  ambulanceLatLng,
  signalMarkers = [],
  children,
}: LiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const ambulanceMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const corridorGlowRef = useRef<L.Polyline | null>(null);
  const signalMarkersRef = useRef<L.Marker[]>([]);
  const routePoints = useRef<[number, number][]>([]);

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const center: [number, number] = [
      (startCoords[0] + endCoords[0]) / 2,
      (startCoords[1] + endCoords[1]) / 2,
    ];

    const map = L.map(mapRef.current, {
      center,
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    // Clean light-themed map tiles
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Generate route points between start and end
    const points: [number, number][] = [];
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Add slight curve to represent real road variation
      const lat = startCoords[0] + (endCoords[0] - startCoords[0]) * t +
        Math.sin(t * Math.PI) * 0.006 * Math.sin(t * 3 * Math.PI);
      const lng = startCoords[1] + (endCoords[1] - startCoords[1]) * t +
        Math.cos(t * Math.PI * 2) * 0.004;
      points.push([lat, lng]);
    }
    routePoints.current = points;

    // Hospital marker
    const hospitalIcon = L.divIcon({
      className: "custom-marker",
      html: `<div style="width:34px;height:34px;background:#22c55e;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 12px rgba(34,197,94,0.5);font-size:18px;">🏥</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });
    L.marker(endCoords, { icon: hospitalIcon }).addTo(map)
      .bindPopup('<b>Hospital</b>');

    // Patient/Emergency marker
    const patientIcon = L.divIcon({
      className: "custom-marker",
      html: `<div style="width:30px;height:30px;background:#ef4444;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 10px rgba(239,68,68,0.5);font-size:16px;">📍</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
    L.marker(startCoords, { icon: patientIcon }).addTo(map)
      .bindPopup('<b>Emergency Location</b>');

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      ambulanceMarkerRef.current = null;
      routeLineRef.current = null;
      corridorGlowRef.current = null;
      signalMarkersRef.current = [];
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Draw route lines when showRoute changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !showRoute || routePoints.current.length === 0) return;

    if (!corridorGlowRef.current) {
      corridorGlowRef.current = L.polyline(routePoints.current, {
        color: "#22c55e",
        weight: 14,
        opacity: 0.18,
      }).addTo(map);
    }

    if (!routeLineRef.current) {
      routeLineRef.current = L.polyline(routePoints.current, {
        color: "#3b82f6",
        weight: 4,
        opacity: 0.85,
        dashArray: "10, 8",
      }).addTo(map);
    }
  }, [showRoute]);

  // Update ambulance marker — uses REAL coords if available, else synthetic route interpolation
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    let pos: [number, number];

    if (ambulanceLatLng && ambulanceLatLng[0] && ambulanceLatLng[1]) {
      // Use real GPS position from DB
      pos = ambulanceLatLng;
    } else if (showRoute && routePoints.current.length > 0) {
      // Fallback: synthetic progress along route
      const idx = Math.min(
        Math.floor((ambulanceProgress / 100) * (routePoints.current.length - 1)),
        routePoints.current.length - 1
      );
      pos = routePoints.current[idx];
    } else {
      return;
    }

    const ambIcon = L.divIcon({
      className: "ambulance-marker",
      html: `<div style="width:42px;height:42px;background:white;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #ef4444;box-shadow:0 0 18px rgba(239,68,68,0.6),0 4px 12px rgba(0,0,0,0.15);font-size:22px;">🚑</div>`,
      iconSize: [42, 42],
      iconAnchor: [21, 21],
    });

    if (!ambulanceMarkerRef.current) {
      ambulanceMarkerRef.current = L.marker(pos, { icon: ambIcon, zIndexOffset: 1000 }).addTo(map)
        .bindPopup('<b>Ambulance</b>');
    } else {
      ambulanceMarkerRef.current.setLatLng(pos);
    }

    // Update corridor glow to traversed portion when using real coords
    if (showRoute && routePoints.current.length > 0) {
      const idx = Math.min(
        Math.floor((ambulanceProgress / 100) * (routePoints.current.length - 1)),
        routePoints.current.length - 1
      );
      const traversed = routePoints.current.slice(0, idx + 1);
      if (traversed.length > 1 && corridorGlowRef.current) {
        corridorGlowRef.current.setLatLngs(traversed);
        corridorGlowRef.current.setStyle({ color: "#22c55e", opacity: 0.4, weight: 16 });
      }
    }

    // Pan to follow ambulance
    map.panTo(pos, { animate: true, duration: 1 });
  }, [ambulanceLatLng, ambulanceProgress, showRoute]);

  // Update traffic signal markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || signalMarkers.length === 0) return;

    // Remove old signal markers
    signalMarkersRef.current.forEach(m => m.remove());
    signalMarkersRef.current = [];

    // Add updated signal markers
    signalMarkers.forEach(sig => {
      const color = sig.mode === 'corridor' ? '#22c55e' : sig.mode === 'emergency' ? '#f59e0b' : '#6b7280';
      const emoji = sig.mode === 'corridor' ? '🟢' : sig.mode === 'emergency' ? '🟡' : '🔴';

      const sigIcon = L.divIcon({
        className: "signal-marker",
        html: `<div style="width:24px;height:24px;background:${color};border-radius:4px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 1px 6px rgba(0,0,0,0.3);font-size:12px;">${emoji}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([sig.lat, sig.lng], { icon: sigIcon })
        .addTo(map)
        .bindPopup(`<b>${sig.code}</b><br>Status: ${sig.mode}`);

      signalMarkersRef.current.push(marker);
    });
  }, [signalMarkers]);

  return (
    <div className={cn("relative rounded-2xl overflow-hidden border border-border", className)}>
      <div ref={mapRef} className="w-full h-full" />

      {/* Live Tracking badge */}
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-1.5 bg-card/90 backdrop-blur-sm px-3 py-2 rounded-xl border border-border text-xs font-medium shadow-sm">
        <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
        {ambulanceLatLng ? 'Live GPS Tracking' : 'Live Tracking'}
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
          0%, 100% { box-shadow: 0 0 18px rgba(239,68,68,0.6), 0 4px 12px rgba(0,0,0,0.15); }
          50% { box-shadow: 0 0 30px rgba(239,68,68,0.8), 0 4px 18px rgba(0,0,0,0.2); }
        }
      `}</style>
    </div>
  );
}
