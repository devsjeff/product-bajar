import type { Deal } from "@/lib/types";
import { formatDiscount, formatDistance } from "@/lib/utils";
import { Clock, MapPin, Tag, Star } from "lucide-react";
import { format, isPast } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DealCardProps {
  deal: Deal;
  onSave?: (id: string) => void;
}

const DEAL_TYPE_COLORS: Record<string, string> = {
  percentage: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  flat: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  bogo: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  bundle: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  trip_offer: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
  seasonal: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
};

export function DealCard({ deal, onSave }: DealCardProps) {
  const expired = deal.status === "expired" || (deal.ends_at ? isPast(new Date(deal.ends_at)) : false);

  return (
    <Link href={`/stores/${deal.store_id}`}>
      <div className={cn(
        "bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-all cursor-pointer",
        expired && "opacity-70"
      )}>
        {/* Image */}
        <div className="relative h-32 bg-gradient-to-br from-primary/10 to-accent">
          {deal.image_url ? (
            <Image src={deal.image_url} alt={deal.title} fill className="object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-4xl">🏷️</div>
          )}
          {/* Discount badge */}
          <div className="absolute top-2 left-2">
            <span className={cn(
              "text-[11px] font-bold px-2 py-1 rounded-full",
              DEAL_TYPE_COLORS[deal.deal_type] || DEAL_TYPE_COLORS.percentage
            )}>
              {formatDiscount(deal)}
            </span>
          </div>
          {expired && (
            <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
              Expired
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="font-semibold text-sm text-foreground line-clamp-1">{deal.title}</h3>
          {deal.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{deal.description}</p>
          )}

          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
            {deal.store_name && (
              <span className="font-medium text-foreground truncate">🏪 {deal.store_name}</span>
            )}
            {deal.distance_km != null && (
              <span className="flex items-center gap-0.5 text-primary">
                <MapPin size={10} /> {formatDistance(deal.distance_km)}
              </span>
            )}
            {deal.store_rating != null && (
              <span className="flex items-center gap-0.5">
                <Star size={10} className="text-yellow-500 fill-yellow-500" />
                {deal.store_rating.toFixed(1)}
              </span>
            )}
          </div>

          {deal.ends_at && !expired && (
            <div className="flex items-center gap-1 mt-2 text-xs text-orange-500 font-medium">
              <Clock size={11} />
              <span>Ends {format(new Date(deal.ends_at), "d MMM")}</span>
            </div>
          )}
          {deal.coupon_code && (
            <div className="mt-2 bg-muted rounded-lg px-2 py-1 text-xs font-mono font-semibold text-primary tracking-widest">
              {deal.coupon_code}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
