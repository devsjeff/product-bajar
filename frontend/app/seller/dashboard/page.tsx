"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { storeApi, productApi, dealApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Store, Package, Tag, Star, Plus, ChevronRight, Edit3, Trash2, BarChart3 } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export default function SellerDashboard() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
    else if (user?.role !== "seller" && user?.role !== "admin") router.push("/settings?tab=seller");
  }, [isAuthenticated, user, router]);

  const { data: storesData, isLoading } = useQuery({
    queryKey: ["my-stores"],
    queryFn: () => storeApi.list(),
    enabled: isAuthenticated && (user?.role === "seller" || user?.role === "admin"),
  });

  const deleteMutation = useMutation({
    mutationFn: storeApi.delete,
    onSuccess: () => { toast.success("Store deleted"); qc.invalidateQueries({ queryKey: ["my-stores"] }); },
  });

  const stores = storesData?.items || [];
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  const { data: productsData } = useQuery({
    queryKey: ["seller-products", selectedStoreId],
    queryFn: () => productApi.list(selectedStoreId!),
    enabled: !!selectedStoreId,
  });

  const { data: dealsData } = useQuery({
    queryKey: ["seller-deals", selectedStoreId],
    queryFn: () => dealApi.storeDeals(selectedStoreId!),
    enabled: !!selectedStoreId,
  });

  const selectedStore = stores.find((s) => s.id === selectedStoreId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="h-8 bg-muted rounded-xl animate-pulse mb-4 w-1/2" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Seller Dashboard</h1>
            <p className="text-sm text-muted-foreground">{stores.length} store{stores.length !== 1 ? "s" : ""} registered</p>
          </div>
          <Link href="/stores/create">
            <button className="flex items-center gap-1.5 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-xl">
              <Plus size={16} /> New Store
            </button>
          </Link>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{stores.length}</p>
            <p className="text-xs text-muted-foreground">Stores</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{productsData?.total || 0}</p>
            <p className="text-xs text-muted-foreground">Products</p>
          </div>
          <div className="bg-pink-50 dark:bg-pink-900/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-pink-600">{dealsData?.total || 0}</p>
            <p className="text-xs text-muted-foreground">Active Deals</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {stores.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏪</div>
            <h3 className="font-bold text-lg">No stores yet</h3>
            <p className="text-muted-foreground text-sm mt-1">Create your first store to start selling</p>
            <Link href="/stores/create" className="mt-4 inline-block">
              <button className="bg-primary text-white font-semibold px-6 py-3 rounded-2xl">
                Create Store
              </button>
            </Link>
          </div>
        ) : (
          stores.map((store) => (
            <div
              key={store.id}
              className={cn(
                "bg-card border rounded-2xl p-4 transition-all cursor-pointer",
                selectedStoreId === store.id ? "border-primary shadow-md" : "border-border"
              )}
              onClick={() => setSelectedStoreId(selectedStoreId === store.id ? null : store.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm truncate">{store.name}</h3>
                    <span className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                      store.status === "active" ? "bg-green-100 text-green-700" :
                      store.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    )}>{store.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{store.city} · {store.category}</p>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <Star size={12} className="text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold">{store.rating_avg.toFixed(1)}</span>
                </div>
              </div>

              {selectedStoreId === store.id && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="grid grid-cols-2 gap-2">
                    <Link href={`/stores/${store.id}`}>
                      <button className="w-full text-xs border border-border rounded-xl py-2 hover:bg-muted transition">
                        View Public Page
                      </button>
                    </Link>
                    <button
                      onClick={(e) => { e.stopPropagation(); toast("Edit store feature coming soon"); }}
                      className="text-xs border border-border rounded-xl py-2 hover:bg-muted transition flex items-center justify-center gap-1"
                    >
                      <Edit3 size={12} /> Edit Store
                    </button>
                  </div>

                  {/* Products quick view */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-muted-foreground">PRODUCTS ({productsData?.total || 0})</p>
                    </div>
                    <div className="space-y-1">
                      {productsData?.items?.slice(0, 3).map((p) => (
                        <div key={p.id} className="flex items-center justify-between bg-muted rounded-lg px-3 py-2">
                          <p className="text-xs font-medium truncate flex-1">{p.name}</p>
                          <p className="text-xs text-primary font-bold ml-2">{formatPrice(p.price)}</p>
                        </div>
                      ))}
                      {(productsData?.total || 0) > 3 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{(productsData?.total || 0) - 3} more products
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Deals quick view */}
                  {(dealsData?.total || 0) > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">ACTIVE DEALS ({dealsData?.total})</p>
                      <div className="space-y-1">
                        {dealsData?.items?.slice(0, 2).map((d) => (
                          <div key={d.id} className="flex items-center justify-between bg-muted rounded-lg px-3 py-2">
                            <p className="text-xs font-medium truncate flex-1">{d.title}</p>
                            <p className="text-xs text-green-600 font-bold ml-2">{d.discount_value}%</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Delete this store and all its products?")) deleteMutation.mutate(store.id);
                    }}
                    className="mt-3 w-full text-xs text-red-500 border border-red-200 dark:border-red-800 rounded-xl py-2 flex items-center justify-center gap-1 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                  >
                    <Trash2 size={12} /> Delete Store
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
