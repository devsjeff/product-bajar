"use client";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { searchApi } from "@/lib/api";
import { useLocation } from "@/hooks/useLocation";
import { StoreCard } from "@/components/store/StoreCard";
import { ProductCard } from "@/components/product/ProductCard";
import { CATEGORY_ICONS, CATEGORY_LABELS } from "@/lib/utils";
import { Search, SlidersHorizontal, X, ChevronLeft, Store, Package } from "lucide-react";
import type { StoreCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "distance", label: "Nearest" },
  { value: "rating", label: "Top Rated" },
  { value: "relevance", label: "Relevance" },
];

const CATEGORIES: { value: StoreCategory; label: string }[] = [
  { value: "grocery", label: "Grocery" },
  { value: "kitchen", label: "Kitchen" },
  { value: "electronics", label: "Electronics" },
  { value: "clothing", label: "Clothing" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "bakery", label: "Bakery" },
  { value: "restaurant", label: "Restaurant" },
  { value: "hardware", label: "Hardware" },
];

export default function SearchPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const { lat, lng } = useLocation();

  const [query, setQuery] = useState(sp.get("q") || "");
  const [activeQuery, setActiveQuery] = useState(sp.get("q") || "");
  const [tab, setTab] = useState<"stores" | "products">("products");
  const [category, setCategory] = useState<StoreCategory | "">(sp.get("category") as StoreCategory || "");
  const [sortBy, setSortBy] = useState<"distance" | "rating" | "relevance">("distance");
  const [radiusKm, setRadiusKm] = useState(10);
  const [showFilters, setShowFilters] = useState(false);

  // Sync URL param on mount
  useEffect(() => {
    const q = sp.get("q") || "";
    setQuery(q);
    setActiveQuery(q);
  }, [sp]);

  // Store search
  const storeQuery = useQuery({
    queryKey: ["search-stores", activeQuery, lat, lng, category, sortBy, radiusKm],
    queryFn: () => searchApi.stores({
      lat: lat!, lng: lng!,
      q: activeQuery || undefined,
      radius_km: radiusKm,
      category: category as StoreCategory || undefined,
      sort_by: sortBy,
      limit: 20,
    }),
    enabled: !!lat && !!lng && tab === "stores",
  });

  // Product search
  const productQuery = useQuery({
    queryKey: ["search-products", activeQuery, lat, lng, category, sortBy, radiusKm],
    queryFn: () => searchApi.products({
      q: activeQuery,
      lat: lat!, lng: lng!,
      radius_km: radiusKm,
      category: category || undefined,
      sort_by: sortBy === "relevance" ? "distance" : sortBy,
      limit: 20,
    }),
    enabled: !!lat && !!lng && tab === "products" && !!activeQuery,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveQuery(query);
  };

  const stores = storeQuery.data?.items || [];
  const products = productQuery.data?.items || [];
  const isLoading = tab === "stores" ? storeQuery.isLoading : productQuery.isLoading;
  const total = tab === "stores" ? storeQuery.data?.total : productQuery.data?.total;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background border-b border-border px-4 py-3 space-y-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <button type="button" onClick={() => router.back()}>
            <ChevronLeft size={22} className="text-muted-foreground" />
          </button>
          <div className="flex-1 flex items-center bg-muted rounded-xl px-3 py-2 gap-2">
            <Search size={16} className="text-muted-foreground shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search spoon, cooker, medicine…"
              className="flex-1 bg-transparent text-sm outline-none"
            />
            {query && (
              <button type="button" onClick={() => { setQuery(""); setActiveQuery(""); }}>
                <X size={14} className="text-muted-foreground" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={cn("p-2 rounded-xl border transition-all",
              showFilters ? "bg-primary text-white border-primary" : "border-border"
            )}
          >
            <SlidersHorizontal size={18} />
          </button>
        </form>

        {/* Tabs */}
        <div className="flex gap-2">
          {(["products", "stores"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                tab === t
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "stores" ? <Store size={14} /> : <Package size={14} />}
              {t === "products" ? "Products" : "Stores"}
            </button>
          ))}
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="space-y-3 pb-2">
            {/* Sort */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">SORT BY</p>
              <div className="flex gap-2 flex-wrap">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value as typeof sortBy)}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-full border transition-all",
                      sortBy === opt.value
                        ? "bg-primary text-white border-primary"
                        : "border-border text-muted-foreground"
                    )}
                  >{opt.label}</button>
                ))}
              </div>
            </div>
            {/* Radius */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">RADIUS: {radiusKm}km</p>
              <input
                type="range" min={1} max={50} value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
            {/* Categories */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">CATEGORY</p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setCategory("")}
                  className={cn("text-xs px-3 py-1.5 rounded-full border transition-all",
                    category === "" ? "bg-primary text-white border-primary" : "border-border text-muted-foreground"
                  )}
                >All</button>
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setCategory(c.value)}
                    className={cn("text-xs px-3 py-1.5 rounded-full border transition-all",
                      category === c.value ? "bg-primary text-white border-primary" : "border-border text-muted-foreground"
                    )}
                  >
                    {CATEGORY_ICONS[c.value]} {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="p-4">
        {total != null && (
          <p className="text-sm text-muted-foreground mb-3">
            {total} {tab} found{activeQuery ? ` for "${activeQuery}"` : ""}
          </p>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-52 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : tab === "stores" ? (
          <div className="grid grid-cols-2 gap-3">
            {stores.length > 0
              ? stores.map((s) => <StoreCard key={s.id} store={s} />)
              : <p className="col-span-2 text-center text-muted-foreground py-12">No stores found nearby</p>}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.length > 0
              ? products.map((p) => <ProductCard key={p.id} product={p} />)
              : !activeQuery
                ? <p className="col-span-2 text-center text-muted-foreground py-12">Type something to search products</p>
                : <p className="col-span-2 text-center text-muted-foreground py-12">No products found for "{activeQuery}"</p>}
          </div>
        )}
      </div>
    </div>
  );
}
