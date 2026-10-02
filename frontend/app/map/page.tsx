"use client";
import { useQuery } from "@tanstack/react-query";
import { searchApi } from "@/lib/api";
import { useLocation } from "@/hooks/useLocation";
import dynamic from "next/dynamic";
import { useState } from "react";
import type { Store, StoreCategory } from "@/lib/types";
import { CATEGORY_ICONS, formatDistance } from "@/lib/utils";
import { Star, MapPin, Phone, Navigation, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Leaflet must be loaded client-side only
const MapView = dynamic(() => import("@/components/map/MapView"), { ssr: false });

export default function MapPage() {
  const { lat, lng, loading } = useLocation();
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [radiusKm, setRadiusKm] = useState(5);
  const [category, setCategory] = useState<StoreCategory | "">("");

  const { data } = useQuery({
    queryKey: ["map-stores", lat, lng, radiusKm, category],
    queryFn: () => searchApi.stores({
      lat: lat!, lng: lng!,
      radius_km: radiusKm,
      category: category as StoreCategory || undefined,
      limit: 50,
    }),
    enabled: !!lat && !!lng,
  });

  const stores = data?.items || [];

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3">
        <div className="text-4xl animate-bounce">📍</div>
        <p className="text-muted-foreground">Getting your location…</p>
      </div>
    );
  }

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Filter bar */}
      <div className="absolute top-4 left-4 right-4 z-30 flex gap-2">
        <div className="bg-card border border-border rounded-2xl px-3 py-2 flex items-center gap-2 shadow-sm flex-1">
          <span className="text-xs font-medium text-muted-foreground">Radius:</span>
          <input
            type="range" min={1} max={30} value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <span className="text-xs font-semibold text-primary w-10">{radiusKm}km</span>
        </div>
      </div>

      {/* Map */}
      {lat && lng && (
        <MapView
          center={[lat, lng]}
          stores={stores}
          onSelectStore={setSelectedStore}
        />
      )}

      {/* Store count */}
      <div className="absolute top-20 right-4 z-30 bg-card border border-border rounded-xl px-3 py-1.5 shadow-sm">
        <p className="text-xs font-semibold">{stores.length} stores</p>
      </div>

      {/* Store bottom sheet */}
      {selectedStore && (
        <div className="absolute bottom-24 left-4 right-4 z-40 bg-card border border-border rounded-2xl p-4 shadow-xl">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="min-w-0">
              <h3 className="font-bold text-base truncate">{selectedStore.name}</h3>
              <p className="text-xs text-muted-foreground capitalize">{selectedStore.category}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-lg">
                <Star size={12} className="text-yellow-500 fill-yellow-500" />
                <span className="text-xs font-bold">{selectedStore.rating_avg.toFixed(1)}</span>
              </div>
              <button onClick={() => setSelectedStore(null)} className="p-1">
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
            <MapPin size={11} />
            <span className="truncate">{selectedStore.address}, {selectedStore.city}</span>
          </div>
          {selectedStore.distance_km != null && (
            <p className="text-xs text-primary font-semibold mb-3">{formatDistance(selectedStore.distance_km)}</p>
          )}

          <div className="flex gap-2">
            <Link href={`/stores/${selectedStore.id}`} className="flex-1">
              <button className="w-full bg-primary text-white text-sm font-semibold py-2.5 rounded-xl">
                View Store
              </button>
            </Link>
            {selectedStore.phone && (
              <a href={`tel:${selectedStore.phone}`}>
                <button className="px-4 py-2.5 border border-border rounded-xl hover:bg-muted transition">
                  <Phone size={16} className="text-muted-foreground" />
                </button>
              </a>
            )}
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${selectedStore.latitude},${selectedStore.longitude}`} target="_blank" rel="noreferrer">
              <button className="px-4 py-2.5 border border-border rounded-xl hover:bg-muted transition">
                <Navigation size={16} className="text-primary" />
              </button>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
