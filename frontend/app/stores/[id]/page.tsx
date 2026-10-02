"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { storeApi, productApi, dealApi, reviewApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatPrice, formatDistance, CATEGORY_ICONS } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, MapPin, Phone, Star, Heart, Navigation,
  Clock, Package, Tag, MessageSquare, Globe, ExternalLink
} from "lucide-react";
import { DealCard } from "@/components/deal/DealCard";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useState } from "react";

export default function StoreDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"products" | "deals" | "reviews">("products");
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });

  const { data: store, isLoading } = useQuery({
    queryKey: ["store", id],
    queryFn: () => storeApi.get(id),
  });

  const { data: productsData } = useQuery({
    queryKey: ["store-products", id],
    queryFn: () => productApi.list(id),
  });

  const { data: dealsData } = useQuery({
    queryKey: ["store-deals", id],
    queryFn: () => dealApi.storeDeals(id, true), // include expired for history
  });

  const { data: reviewsData } = useQuery({
    queryKey: ["store-reviews", id],
    queryFn: () => reviewApi.list(id),
  });

  const saveMutation = useMutation({
    mutationFn: () => storeApi.save(id),
    onSuccess: () => toast.success("Store saved!"),
  });

  const reviewMutation = useMutation({
    mutationFn: () => reviewApi.create(id, newReview),
    onSuccess: () => {
      toast.success("Review submitted!");
      setNewReview({ rating: 5, comment: "" });
      qc.invalidateQueries({ queryKey: ["store-reviews", id] });
      qc.invalidateQueries({ queryKey: ["store", id] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || "Failed to submit review"),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-56 bg-muted animate-pulse" />
        <div className="p-4 space-y-3">
          <div className="h-6 bg-muted rounded-xl animate-pulse w-2/3" />
          <div className="h-4 bg-muted rounded-xl animate-pulse w-1/2" />
        </div>
      </div>
    );
  }

  if (!store) return <div className="p-8 text-center">Store not found</div>;

  const coverUrl = store.cover_image_url || store.photos?.[0]?.url;
  const icon = CATEGORY_ICONS[store.category] || "🏪";

  return (
    <div className="min-h-screen bg-background">
      {/* Cover image */}
      <div className="relative h-56 bg-muted">
        {coverUrl ? (
          <Image src={coverUrl} alt={store.name} fill className="object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-7xl">{icon}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent" />
        <div className="absolute top-12 left-4 right-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="bg-white/90 backdrop-blur rounded-full p-2 shadow"
          >
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <div className="flex gap-2">
            {isAuthenticated && (
              <button
                onClick={() => saveMutation.mutate()}
                className="bg-white/90 backdrop-blur rounded-full p-2 shadow"
              >
                <Heart size={20} className="text-muted-foreground" />
              </button>
            )}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`}
              target="_blank" rel="noreferrer"
              className="bg-white/90 backdrop-blur rounded-full p-2 shadow"
            >
              <Navigation size={20} className="text-primary" />
            </a>
          </div>
        </div>
      </div>

      {/* Store info */}
      <div className="px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="font-bold text-xl">{store.name}</h1>
            <p className="text-muted-foreground text-sm capitalize mt-0.5">{store.category}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-2.5 py-1.5 rounded-xl">
              <Star size={14} className="text-yellow-500 fill-yellow-500" />
              <span className="font-bold text-sm">{store.rating_avg.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({store.rating_count})</span>
            </div>
            {store.distance_km != null && (
              <span className="text-xs text-primary font-medium">{formatDistance(store.distance_km)}</span>
            )}
          </div>
        </div>

        {store.description && (
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{store.description}</p>
        )}

        {/* Contact row */}
        <div className="flex gap-2 mt-4">
          {store.phone && (
            <a href={`tel:${store.phone}`} className="flex-1">
              <button className="w-full flex items-center justify-center gap-2 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-muted transition">
                <Phone size={15} /> Call
              </button>
            </a>
          )}
          {store.whatsapp && (
            <a href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex-1">
              <button className="w-full flex items-center justify-center gap-2 bg-green-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-green-600 transition">
                💬 WhatsApp
              </button>
            </a>
          )}
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`}
            target="_blank" rel="noreferrer"
            className="flex-1"
          >
            <button className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-xl py-2.5 text-sm font-medium hover:opacity-90 transition">
              <Navigation size={15} /> Directions
            </button>
          </a>
        </div>

        {/* Address */}
        <div className="flex items-start gap-2 mt-3 text-sm text-muted-foreground">
          <MapPin size={14} className="shrink-0 mt-0.5 text-primary" />
          <span>{store.address}, {store.city}, {store.state} {store.pincode}</span>
        </div>

        {/* Opening hours */}
        {store.opening_hours && (
          <div className="flex items-start gap-2 mt-2 text-sm text-muted-foreground">
            <Clock size={14} className="shrink-0 mt-0.5" />
            <span>Mon–Sat: {store.opening_hours.mon || "Check store"}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-3 px-4 border-b border-border">
        {(["products", "deals", "reviews"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={cn(
              "flex items-center gap-1.5 pb-3 text-sm font-medium border-b-2 transition-all capitalize",
              activeTab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground"
            )}
          >
            {t === "products" && <Package size={14} />}
            {t === "deals" && <Tag size={14} />}
            {t === "reviews" && <MessageSquare size={14} />}
            {t}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="grid grid-cols-2 gap-3">
            {productsData?.items?.map((product) => (
              <div key={product.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="h-28 bg-muted relative">
                  {product.image_url ? (
                    <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-3xl">📦</div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="font-semibold text-xs truncate">{product.name}</p>
                  <p className="text-primary font-bold text-sm mt-0.5">{formatPrice(product.price)}</p>
                  {product.unit && <p className="text-[10px] text-muted-foreground">{product.unit}</p>}
                </div>
              </div>
            )) || <p className="col-span-2 text-center text-muted-foreground py-8">No products listed</p>}
          </div>
        )}

        {/* Deals Tab */}
        {activeTab === "deals" && (
          <div className="space-y-3">
            {dealsData?.items?.length ? (
              <div className="grid grid-cols-2 gap-3">
                {dealsData.items.map((deal) => <DealCard key={deal.id} deal={deal} />)}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No deals available</p>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <div className="space-y-4">
            {/* Write review */}
            {isAuthenticated && (
              <div className="bg-card border border-border rounded-2xl p-4">
                <h3 className="font-semibold text-sm mb-3">Write a Review</h3>
                <div className="flex gap-2 mb-3">
                  {[1,2,3,4,5].map((r) => (
                    <button key={r} onClick={() => setNewReview((p) => ({ ...p, rating: r }))}>
                      <Star
                        size={24}
                        className={r <= newReview.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview((p) => ({ ...p, comment: e.target.value }))}
                  placeholder="Share your experience…"
                  rows={3}
                  className="w-full bg-muted rounded-xl px-3 py-2 text-sm outline-none resize-none"
                />
                <button
                  onClick={() => reviewMutation.mutate()}
                  disabled={reviewMutation.isPending}
                  className="mt-2 w-full bg-primary text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-60"
                >
                  {reviewMutation.isPending ? "Submitting…" : "Submit Review"}
                </button>
              </div>
            )}

            {/* Reviews list */}
            {reviewsData?.items?.map((review) => (
              <div key={review.id} className="bg-card border border-border rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-sm">{review.user_name || "User"}</p>
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map((r) => (
                      <Star key={r} size={12} className={r <= review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"} />
                    ))}
                  </div>
                </div>
                {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(review.created_at).toLocaleDateString("en-IN")}
                </p>
              </div>
            ))}
            {!reviewsData?.items?.length && (
              <p className="text-center text-muted-foreground py-8">No reviews yet. Be the first!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
