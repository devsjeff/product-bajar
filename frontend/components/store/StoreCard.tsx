import { cn } from "@/lib/utils";
import type { Store } from "@/lib/types";
import { formatDistance, getRatingStars, CATEGORY_ICONS } from "@/lib/utils";
import { MapPin, Phone, Star, Heart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface StoreCardProps {
  store: Store;
  onSave?: (id: string) => void;
}

export function StoreCard({ store, onSave }: StoreCardProps) {
  const icon = CATEGORY_ICONS[store.category] || "🏪";
  const coverUrl = store.cover_image_url || store.photos?.[0]?.url;

  return (
    <Link href={`/stores/${store.id}`}>
      <div className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md hover:border-primary/30 transition-all group cursor-pointer">
        {/* Cover image */}
        <div className="relative h-36 bg-muted">
          {coverUrl ? (
            <Image src={coverUrl} alt={store.name} fill className="object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-5xl">
              {icon}
            </div>
          )}
          {/* Save button */}
          {onSave && (
            <button
              onClick={(e) => { e.preventDefault(); onSave(store.id); }}
              className="absolute top-2 right-2 bg-white/90 backdrop-blur rounded-full p-1.5 shadow hover:bg-white transition-all"
            >
              <Heart size={16} className="text-muted-foreground" />
            </button>
          )}
          {/* Featured badge */}
          {store.is_featured && (
            <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
              Featured
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-sm text-foreground truncate">{store.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">{store.category}</p>
            </div>
            <div className="flex items-center gap-1 text-xs shrink-0">
              <Star size={12} className="text-yellow-500 fill-yellow-500" />
              <span className="font-semibold">{store.rating_avg.toFixed(1)}</span>
              <span className="text-muted-foreground">({store.rating_count})</span>
            </div>
          </div>

          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <MapPin size={11} className="shrink-0" />
            <span className="truncate">{store.city}</span>
            {store.distance_km != null && (
              <>
                <span>·</span>
                <span className="text-primary font-medium">{formatDistance(store.distance_km)}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
