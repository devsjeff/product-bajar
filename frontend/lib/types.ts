// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: "buyer" | "seller" | "admin";
  is_active: boolean;
  is_verified: boolean;
  avatar_url?: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export type StoreCategory =
  | "grocery" | "kitchen" | "electronics" | "clothing"
  | "pharmacy" | "bakery" | "restaurant" | "hardware"
  | "stationery" | "toys" | "sports" | "furniture"
  | "beauty" | "other";

export type StoreStatus = "pending" | "active" | "suspended" | "closed";

export interface StorePhoto {
  id: string;
  url: string;
  caption?: string;
  is_cover: boolean;
  order: number;
}

export interface Store {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description?: string;
  category: StoreCategory;
  status: StoreStatus;
  address: string;
  city: string;
  state: string;
  pincode?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  opening_hours?: Record<string, string>;
  rating_avg: number;
  rating_count: number;
  is_featured: boolean;
  cover_image_url?: string;
  photos: StorePhoto[];
  created_at: string;
  distance_km?: number;
}

export interface StoreCreate {
  name: string;
  description?: string;
  category: StoreCategory;
  address: string;
  city: string;
  state: string;
  pincode?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  opening_hours?: Record<string, string>;
}

// ─── Product ─────────────────────────────────────────────────────────────────

export type ProductStatus = "active" | "out_of_stock" | "discontinued";

export interface ProductImage {
  id: string;
  url: string;
  alt_text?: string;
  order: number;
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  tags?: string[];
  price: number;
  mrp?: number;
  unit?: string;
  status: ProductStatus;
  image_url?: string;
  is_featured: boolean;
  stock_quantity?: number;
  images: ProductImage[];
  created_at: string;
  // search enrichment
  store_name?: string;
  store_slug?: string;
  store_city?: string;
  distance_km?: number;
  store_rating?: number;
}

// ─── Deal ────────────────────────────────────────────────────────────────────

export type DealType =
  | "percentage" | "flat" | "bogo" | "bundle"
  | "trip_offer" | "seasonal";

export type DealStatus = "active" | "expired" | "draft" | "scheduled";

export interface Deal {
  id: string;
  store_id: string;
  product_id?: string;
  title: string;
  description?: string;
  deal_type: DealType;
  status: DealStatus;
  discount_value: number;
  original_price?: number;
  deal_price?: number;
  coupon_code?: string;
  starts_at?: string;
  ends_at?: string;
  is_recurring: boolean;
  image_url?: string;
  terms?: string;
  view_count: number;
  save_count: number;
  created_at: string;
  // joined
  store_name?: string;
  store_city?: string;
  store_rating?: number;
  distance_km?: number;
}

// ─── Review ──────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  store_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  is_verified_purchase: boolean;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
}

// ─── Common ──────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface MessageResponse {
  message: string;
  success: boolean;
}

export interface SearchStoreParams {
  lat: number;
  lng: number;
  radius_km?: number;
  q?: string;
  category?: StoreCategory;
  min_rating?: number;
  sort_by?: "distance" | "rating" | "relevance";
  page?: number;
  limit?: number;
}

export interface SearchProductParams {
  q: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
  category?: string;
  min_price?: number;
  max_price?: number;
  min_store_rating?: number;
  sort_by?: "distance" | "rating";
  page?: number;
  limit?: number;
}

export interface DealListParams {
  lat?: number;
  lng?: number;
  radius_km?: number;
  deal_type?: DealType;
  include_expired?: boolean;
  sort_by?: "created_at" | "distance" | "discount";
  page?: number;
  limit?: number;
}
