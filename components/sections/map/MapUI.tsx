"use client";

import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Expert } from "@/data/experts";

export interface MapUIProps {
  userLocation: [number, number];
  experts: Expert[];
  activeExpert: Expert | null;
  onSelectExpert: (expert: Expert) => void;
  isFallback: boolean;
}

// Custom control to handle Auto-Center
function MapController({ center, activeExpert }: { center: [number, number], activeExpert: Expert | null }) {
  const map = useMap();

  useEffect(() => {
    if (activeExpert) {
      // Pan slightly lower than the marker so the bottom sheet doesn't cover it
      map.flyTo([activeExpert.lat - 0.015, activeExpert.lng], 14, { animate: true, duration: 1.5 });
    } else {
      map.flyTo(center, 13, { animate: true, duration: 1 });
    }
  }, [center, activeExpert, map]);

  return null;
}

// Search this Area Button Logic
function MapEvents({ onDragEnd }: { onDragEnd: () => void }) {
  useMapEvents({
    dragend: () => onDragEnd(),
  });
  return null;
}

export default function MapUI({ userLocation, experts, activeExpert, onSelectExpert, isFallback }: MapUIProps) {
  const [showSearchArea, setShowSearchArea] = useState(false);

  // Generate Custom HTML Markers for Leaflet
  const createCustomIcon = (expert: Expert, isActive: boolean) => {
    const activeClass = isActive ? 'scale-135 z-50' : 'hover:scale-110 z-10';
    const badgeHtml = isActive ? '<div class="absolute -top-4 whitespace-nowrap text-[10px] font-bold bg-[#1B5E20] text-white px-2 py-0.5 rounded-full shadow-lg z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-1">Nearest</div>' : '';
    const borderClass = isActive ? 'border-[#4CAF50] shadow-[0_0_15px_rgba(76,175,80,0.8)]' : 'border-white shadow-md';
    const dotClass = expert.availability === 'Available Now' ? 'bg-green-500' : expert.availability === 'Busy' ? 'bg-yellow-500' : 'bg-red-500';

    const htmlString = '<div class="relative w-12 h-12 flex items-center justify-center transition-transform duration-300 ' + activeClass + '">' +
      badgeHtml +
      '<div class="absolute inset-0 bg-[#4CAF50] rounded-full opacity-30 animate-ping" style="animation-duration: 3s;"></div>' +
      '<div class="relative w-10 h-10 rounded-full border-2 ' + borderClass + ' bg-zinc-100 overflow-hidden flex items-center justify-center text-[#1B5E20] font-black pointer-events-auto">' +
      expert.name.charAt(0) +
      '<div class="absolute bottom-1 right-1 w-2 h-2.5 rounded-full border border-white ' + dotClass + '"></div>' +
      '</div>' +
      '</div>';

    return L.divIcon({
      className: "custom-leaflet-icon",
      html: htmlString,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });
  };

  const userIcon = useMemo(() => {
    return L.divIcon({
      className: "user-leaflet-icon",
      html: `
        <div class="relative w-6 h-6 flex items-center justify-center">
          <div class="absolute inset-0 bg-blue-500 rounded-full opacity-50 animate-ping"></div>
          <div class="relative w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  }, []);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-inner border border-zinc-200">

      {/* Search this Area Floating Button */}
      {showSearchArea && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[400]">
          <button
            onClick={() => setShowSearchArea(false)}
            className="px-6 py-2.5 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-zinc-200 text-sm font-bold text-[#1B5E20] hover:bg-zinc-50 transition-colors flex items-center gap-2 animate-in fade-in slide-in-from-top-4"
          >
            <span>Search in this area</span>
          </button>
        </div>
      )}

      {/* Fallback Warning Overlay */}
      {isFallback && (
        <div className="absolute bottom-6 sm:top-6 sm:bottom-auto left-4 right-4 sm:left-auto sm:right-4 z-[400] bg-white/95 backdrop-blur-md px-4 py-3 rounded-xl border border-zinc-200 shadow-xl flex items-center gap-3">
          <span className="text-xl">📍</span>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Location Restricted</span>
            <span className="text-sm font-bold text-foreground">Showing experts near Lahore (Default)</span>
          </div>
        </div>
      )}

      <MapContainer
        center={userLocation}
        zoom={13}
        scrollWheelZoom={true}
        zoomControl={false}
        className="w-full h-full z-0 font-sans"
      >
        {/* Desaturated Light Tile Layer matching UI Guidelines */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          className="map-tiles"
        />

        <MapController center={userLocation} activeExpert={activeExpert} />
        <MapEvents onDragEnd={() => setShowSearchArea(true)} />

        {/* User Location Node */}
        <Marker position={userLocation} icon={userIcon} />

        {/* Expert Markers */}
        {experts.map(expert => (
          <Marker
            key={expert.id}
            position={[expert.lat, expert.lng]}
            icon={createCustomIcon(expert, activeExpert?.id === expert.id)}
            eventHandlers={{
              click: () => {
                setShowSearchArea(false);
                onSelectExpert(expert);
              }
            }}
          />
        ))}

      </MapContainer>

      {/* Embedded CSS for custom styling of the map to blend it into AgroSphere Theme */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .leaflet-container { background: #fafafa; }
        .map-tiles { 
          filter: sepia(10%) hue-rotate(85deg) saturate(80%) brightness(105%) opacity(0.85); 
          mix-blend-mode: multiply;
        }
        .custom-leaflet-icon { background: transparent; border: none; }
        .user-leaflet-icon { background: transparent; border: none; }
      `}} />
    </div>
  );
}
