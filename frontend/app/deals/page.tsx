"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dealApi } from "@/lib/api";
import { useLocation } from "@/hooks/useLocation";
import { DealCard } from "@/components/deal/DealCard";
import { Clock, History, MapPin, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { DealType } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";

const TABS = [
  { id: "nearby", label: "Nearby", icon: MapPin },
  { id: "active", label: "Active", icon: Clock },
  { id: "past", label: "Old/Trip Offers", icon: History },
  { id: "saved", label: "Saved", icon: Heart },
] as const;

const DEAL_FILTERS: { value: DealType | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "percentage", label: "% Off" },
  { value: "flat", label: "Flat Off" },
  { value: "trip_offer", label: "Trip Offers" },
  { value: "seasonal", label: "Seasonal" },
  { value: "bogo", label: "BOGO" },
];

export default function DealsPage() {
  const { lat, lng } = useLocation();
  const { isAuthenticated } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState<typeof TABS[number]["id"]>("nearby");
  const [dealType, setDealType] = useState<DealType | "">("");

  const nearbyQuery = useQuery({
    queryKey: ["deals", "nearby", lat, lng, dealType],
    queryFn: () => dealApi.list({ lat: lat!, lng: lng!, radius_km: 15, deal_type: dealType as DealType || undefined, sort_by: "distance" }),
    enabled: !!lat && !!lng && tab === "nearby",
  });

  const activeQuery = useQuery({
    queryKey: ["deals", "active", dealType],
    queryFn: () => dealApi.list({ deal_type: dealType as DealType || undefined, sort_by: "created_at" }),
    enabled: tab === "active",
  });

  // Past/Old trip offers — include_expired=true
  const pastQuery = useQuery({
    queryKey: ["deals", "past", dealType],
    queryFn: () => dealApi.list({ include_expired: true, deal_type: dealType as DealType || undefined, sort_by: "created_at" }),
    enabled: tab === "past",
  });

  const savedQuery = useQuery({
    queryKey: ["deals", "saved"],
    queryFn: () => dealApi.savedList(),
    enabled: tab === "saved" && isAuthenticated,
  });

  const saveMutation = useMutation({
    mutationFn: dealApi.save,
    onSuccess: () => { toast.success("Deal saved!"); qc.invalidateQueries({ queryKey: ["deals", "saved"] }); },
  });

  const currentQuery = tab === "nearby" ? nearbyQuery : tab === "active" ? activeQuery : tab === "past" ? pastQuery : savedQuery;
  const deals = currentQuery.data?.items || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-2xl font-bold">🏷️ Deals & Offers</h1>
        <p className="text-sm text-muted-foreground mt-1">Active deals, flash sales & old trip offers</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 overflow-x-auto no-scrollbar pb-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              tab === id ? "bg-primary text-white" : "bg-muted text-muted-foreground"
            )}
          >
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {/* Deal type filter */}
      <div className="flex gap-2 px-4 overflow-x-auto no-scrollbar py-2">
        {DEAL_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setDealType(f.value)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition-all",
              dealType === f.value ? "bg-primary text-white border-primary" : "border-border text-muted-foreground"
            )}
          >{f.label}</button>
        ))}
      </div>

      {/* Results */}
      <div className="p-4">
        {tab === "past" && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 mb-4 text-sm text-amber-800 dark:text-amber-200">
            📋 Showing past & expired offers for reference. Great for planning your next trip!
          </div>
        )}

        {currentQuery.isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => <div key={i} className="h-52 bg-muted rounded-2xl animate-pulse" />)}
          </div>
        ) : deals.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} onSave={isAuthenticated ? (id) => saveMutation.mutate(id) : undefined} />
            ))}
          </div>
        ) : tab === "saved" && !isAuthenticated ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔒</p>
            <p className="font-semibold">Login to see saved deals</p>
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🏷️</p>
            <p className="font-semibold text-foreground">No deals found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {tab === "past" ? "No past offers available" : "Check back later for new deals"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
