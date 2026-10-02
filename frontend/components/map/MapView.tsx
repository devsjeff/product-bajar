"use client";
import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import type { Store } from "@/lib/types";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default Leaflet icon issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const userIcon = new L.DivIcon({
  html: `<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  className: "",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const storeIcon = (rating: number) =>
  new L.DivIcon({
    html: `<div style="background:white;border:2px solid #3b82f6;border-radius:20px;padding:3px 7px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.2);color:#1e40af">⭐${rating.toFixed(1)}</div>`,
    className: "",
    iconSize: [60, 28],
    iconAnchor: [30, 14],
  });

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center, map.getZoom()); }, [center, map]);
  return null;
}

interface MapViewProps {
  center: [number, number];
  stores: Store[];
  onSelectStore: (store: Store) => void;
}

export default function MapView({ center, stores, onSelectStore }: MapViewProps) {
  return (
    <MapContainer
      center={center}
      zoom={14}
      className="h-screen w-full"
      zoomControl={false}
    >
      <RecenterMap center={center} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* User location */}
      <Marker position={center} icon={userIcon}>
        <Popup>You are here</Popup>
      </Marker>

      {/* Store markers */}
      {stores.map((store) => (
        <Marker
          key={store.id}
          position={[store.latitude, store.longitude]}
          icon={storeIcon(store.rating_avg)}
          eventHandlers={{ click: () => onSelectStore(store) }}
        >
          <Popup>
            <strong>{store.name}</strong><br />
            {store.city}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
