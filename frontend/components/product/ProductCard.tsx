import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { Star, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const discount =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : null;

  return (
    <Link href={`/stores/${product.store_id}`}>
      <div className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md hover:border-primary/30 transition-all cursor-pointer">
        {/* Image */}
        <div className="relative h-36 bg-muted">
          {product.image_url ? (
            <Image src={product.image_url} alt={product.name} fill className="object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-4xl">📦</div>
          )}
          {discount && (
            <span className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {discount}% OFF
            </span>
          )}
          {product.status === "out_of_stock" && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-xs font-semibold bg-black/60 px-2 py-1 rounded">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="font-semibold text-sm text-foreground truncate">{product.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-bold text-primary text-sm">{formatPrice(product.price)}</span>
            {product.mrp && product.mrp > product.price && (
              <span className="text-xs text-muted-foreground line-through">{formatPrice(product.mrp)}</span>
            )}
          </div>

          {/* Store info */}
          {product.store_name && (
            <div className="mt-2 space-y-0.5">
              <p className="text-xs text-muted-foreground font-medium truncate">🏪 {product.store_name}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {product.store_rating != null && (
                  <>
                    <Star size={10} className="text-yellow-500 fill-yellow-500" />
                    <span>{product.store_rating.toFixed(1)}</span>
                    <span>·</span>
                  </>
                )}
                {product.distance_km != null && (
                  <span className="text-primary font-medium">
                    {product.distance_km < 1
                      ? `${Math.round(product.distance_km * 1000)}m`
                      : `${product.distance_km.toFixed(1)}km`}
                  </span>
                )}
                {product.store_city && <span className="truncate">· {product.store_city}</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
