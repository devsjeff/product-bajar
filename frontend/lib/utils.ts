import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDistance(km?: number): string {
  if (km == null) return "";
  if (km < 1) return `${Math.round(km * 1000)}m away`;
  return `${km.toFixed(1)}km away`;
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDiscount(deal: { deal_type: string; discount_value: number }): string {
  if (deal.deal_type === "percentage") return `${deal.discount_value}% OFF`;
  if (deal.deal_type === "flat") return `₹${deal.discount_value} OFF`;
  if (deal.deal_type === "bogo") return "Buy 1 Get 1";
  if (deal.deal_type === "bundle") return "Bundle Deal";
  if (deal.deal_type === "trip_offer") return "Trip Offer";
  if (deal.deal_type === "seasonal") return "Seasonal";
  return "Deal";
}

export function getRatingStars(rating: number): string {
  return "★".repeat(Math.round(rating)) + "☆".repeat(5 - Math.round(rating));
}

export const CATEGORY_ICONS: Record<string, string> = {
  grocery: "🛒",
  kitchen: "🍳",
  electronics: "📱",
  clothing: "👗",
  pharmacy: "💊",
  bakery: "🥐",
  restaurant: "🍽️",
  hardware: "🔧",
  stationery: "📝",
  toys: "🧸",
  sports: "⚽",
  furniture: "🛋️",
  beauty: "💄",
  other: "🏪",
};

export const CATEGORY_LABELS: Record<string, string> = {
  grocery: "Grocery",
  kitchen: "Kitchen",
  electronics: "Electronics",
  clothing: "Clothing",
  pharmacy: "Pharmacy",
  bakery: "Bakery",
  restaurant: "Restaurant",
  hardware: "Hardware",
  stationery: "Stationery",
  toys: "Toys",
  sports: "Sports",
  furniture: "Furniture",
  beauty: "Beauty",
  other: "Other",
};
