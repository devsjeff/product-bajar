"use client";
import { useQuery } from "@tanstack/react-query";
import { searchApi, dealApi } from "@/lib/api";
import { useLocation } from "@/hooks/useLocation";
import { StoreCard } from "@/components/store/StoreCard";
import { DealCard } from "@/components/deal/DealCard";
import { ProductCard } from "@/components/product/ProductCard";
import { CATEGORY_ICONS, CATEGORY_LABELS } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, MapPin, ChevronRight, Bell, ShoppingBag } from "lucide-react";
import { useState } from "react";
import type { StoreCategory } from "@/lib/types";

const CATEGORIES: StoreCategory[] = [
  "grocery", "kitchen", "electronics", "clothing",
  "pharmacy", "bakery", "restaurant", "hardware",
];

export default function HomePage() {
  const router = useRouter();
  const { lat, lng, loading: locLoading } = useLocation();
  const [searchInput, setSearchInput] = useState("");

  // Top-rated nearby stores
  const { data: storesData } = useQuery({
    queryKey: ["home-stores", lat, lng],
    queryFn: () => searchApi.stores({ lat: lat!, lng: lng!, radius_km: 10, sort_by: "rating", limit: 6 }),
    enabled: !!lat && !!lng,
  });

  // Active nearby deals
  const { data: dealsData } = useQuery({
    queryKey: ["home-deals", lat, lng],
    queryFn: () => dealApi.list({ lat: lat!, lng: lng!, radius_km: 15, limit: 4 }),
    enabled: !!lat && !!lng,
  });

  // Trending products
  const { data: productsData } = useQuery({
    queryKey: ["home-products", lat, lng],
    queryFn: () => searchApi.products({ q: "offer", lat: lat!, lng: lng!, radius_km: 10, limit: 4 }),
    enabled: !!lat && !!lng,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary px-4 pt-12 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">🛍️ ProductBajar</h1>
            <div className="flex items-center gap-1 text-white/80 text-sm mt-0.5">
              <MapPin size={12} />
              <span>{locLoading ? "Locating…" : "Near You"}</span>
            </div>
          </div>
          <Link href="/settings" className="p-2 bg-white/20 rounded-full">
            <Bell size={20} className="text-white" />
          </Link>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch}>
          <div className="flex items-center bg-white rounded-2xl px-4 py-3 shadow-sm gap-3">
            <Search size={18} className="text-muted-foreground shrink-0" />
            <input
              className="flex-1 text-sm outline-none bg-transparent placeholder:text-muted-foreground"
              placeholder="Search spoon, cooker, medicine…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button type="submit" className="text-primary font-semibold text-sm">Go</button>
          </div>
        </form>
      </div>

      <div className="px-4 space-y-6 py-6">
        {/* Categories */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-base">Categories</h2>
            <Link href="/search" className="text-primary text-sm flex items-center gap-1">
              All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/search?category=${cat}`}
                className="flex flex-col items-center gap-1.5 bg-card border border-border rounded-xl p-3 hover:border-primary/50 transition-all"
              >
                <span className="text-2xl">{CATEGORY_ICONS[cat]}</span>
                <span className="text-[11px] font-medium text-center text-foreground">{CATEGORY_LABELS[cat]}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Top-rated stores */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-base">⭐ Top Rated Nearby</h2>
            <Link href="/search" className="text-primary text-sm flex items-center gap-1">
              See all <ChevronRight size={14} />
            </Link>
          </div>
          {storesData?.items?.length ? (
            <div className="grid grid-cols-2 gap-3">
              {storesData.items.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-44 bg-muted rounded-2xl animate-pulse" />
              ))}
            </div>
          )}
        </section>

        {/* Active deals */}
        {dealsData?.items?.length ? (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-base">🏷️ Deals Near You</h2>
              <Link href="/deals" className="text-primary text-sm flex items-center gap-1">
                See all <ChevronRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {dealsData.items.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          </section>
        ) : null}

        {/* Trending products */}
        {productsData?.items?.length ? (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-base">🔥 Trending Products</h2>
              <Link href="/search" className="text-primary text-sm flex items-center gap-1">
                See all <ChevronRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {productsData.items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        ) : null}

        {/* Become Seller CTA */}
        <section>
          <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-3">
              <ShoppingBag size={32} className="shrink-0" />
              <div>
                <h3 className="font-bold text-base">Sell on ProductBajar</h3>
                <p className="text-sm text-white/80 mt-0.5">Register your store and reach local customers</p>
              </div>
            </div>
            <Link href="/settings?tab=seller" className="mt-4 block">
              <button className="w-full bg-white text-primary font-semibold text-sm py-2.5 rounded-xl hover:bg-white/90 transition">
                Register as Seller
              </button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
