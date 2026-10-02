"use client";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { userApi, authApi } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  User, Store, ShoppingBag, MapPin, Bell, Shield,
  LogOut, ChevronRight, Star, Heart, History, MessageSquare,
  Sun, Moon, Globe, Trash2, Edit3, Camera
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import Cookies from "js-cookie";

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, setAuth, setUser, logout } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"profile" | "seller" | "app" | "support">("profile");

  const becomeSeller = useMutation({
    mutationFn: (name: string) => userApi.becomeSeller(name),
    onSuccess: (u) => { setUser(u); toast.success("Welcome, Seller! 🏪"); },
    onError: () => toast.error("Failed to register as seller"),
  });

  const handleLogout = async () => {
    try {
      const rt = Cookies.get("refresh_token");
      if (rt) await authApi.logout(rt);
    } catch {}
    logout();
    qc.clear();
    router.push("/");
    toast.success("Logged out");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="px-4 pt-12 pb-6">
          <h1 className="text-2xl font-bold">⚙️ Settings</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
          <div className="text-center">
            <div className="text-6xl mb-4">👤</div>
            <h2 className="text-xl font-bold mb-2">Join ProductBajar</h2>
            <p className="text-muted-foreground text-sm">Sign in to save stores, get deals & sell your products</p>
          </div>
          <Link href="/login" className="w-full max-w-sm">
            <button className="w-full bg-primary text-white font-semibold py-3 rounded-2xl">Sign In</button>
          </Link>
          <Link href="/register" className="w-full max-w-sm">
            <button className="w-full border border-border font-semibold py-3 rounded-2xl text-foreground">Create Account</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Profile header */}
      <div className="bg-primary px-4 pt-12 pb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            {user?.avatar_url ? (
              <Image src={user.avatar_url} alt={user.full_name} width={64} height={64} className="rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                {user?.full_name?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow">
              <Camera size={12} className="text-primary" />
            </div>
          </div>
          <div className="text-white">
            <h2 className="font-bold text-lg">{user?.full_name}</h2>
            <p className="text-white/70 text-sm">{user?.email}</p>
            <span className={cn(
              "text-[11px] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block",
              user?.role === "seller" ? "bg-yellow-400 text-yellow-900" : "bg-white/20 text-white"
            )}>
              {user?.role === "seller" ? "⭐ Seller" : user?.role === "admin" ? "👑 Admin" : "🛒 Buyer"}
            </span>
          </div>
        </div>
      </div>

      {/* Tab pills */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
        {(["profile", "seller", "app", "support"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all capitalize",
              tab === t ? "bg-primary text-white" : "bg-muted text-muted-foreground"
            )}
          >{t === "seller" ? "Seller" : t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      <div className="px-4 pb-8 space-y-3">
        {/* Profile Tab */}
        {tab === "profile" && (
          <>
            <SettingsGroup label="ACCOUNT">
              <SettingsItem icon={<Edit3 size={16}/>} label="Edit Profile" href="#" />
              <SettingsItem icon={<MapPin size={16}/>} label="Saved Addresses" href="#" />
              <SettingsItem icon={<Heart size={16}/>} label="Saved Stores" href="/stores/saved/list" />
              <SettingsItem icon={<History size={16}/>} label="Order History" href="#" />
              <SettingsItem icon={<Star size={16}/>} label="My Reviews" href="#" />
            </SettingsGroup>
            <SettingsGroup label="PREFERENCES">
              <SettingsItem icon={<Bell size={16}/>} label="Notifications" href="#" />
              <SettingsItem icon={<Globe size={16}/>} label="Language" href="#" />
              <SettingsItem icon={<Shield size={16}/>} label="Privacy & Security" href="#" />
            </SettingsGroup>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-2xl px-4 py-3 font-medium"
            >
              <LogOut size={18}/> Log Out
            </button>
          </>
        )}

        {/* Seller Tab */}
        {tab === "seller" && (
          <>
            {user?.role !== "seller" ? (
              <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-5 text-white">
                <h3 className="font-bold text-lg mb-1">🏪 Become a Seller</h3>
                <p className="text-sm text-white/80 mb-4">List your store and products, post deals, and reach local customers.</p>
                <button
                  onClick={() => becomeSeller.mutate(user?.full_name || "My Store")}
                  disabled={becomeSeller.isPending}
                  className="w-full bg-white text-primary font-bold py-3 rounded-xl hover:bg-white/90 transition"
                >
                  {becomeSeller.isPending ? "Registering…" : "Register as Seller"}
                </button>
              </div>
            ) : (
              <>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-2xl p-4">
                  <p className="text-green-700 dark:text-green-300 font-semibold">✅ You are a registered seller</p>
                </div>
                <SettingsGroup label="SELLER TOOLS">
                  <SettingsItem icon={<Store size={16}/>} label="My Stores" href="/seller/dashboard" />
                  <SettingsItem icon={<ShoppingBag size={16}/>} label="Add New Store" href="/stores/create" />
                  <SettingsItem icon={<Star size={16}/>} label="Seller Dashboard" href="/seller/dashboard" />
                </SettingsGroup>
              </>
            )}
          </>
        )}

        {/* App Tab */}
        {tab === "app" && (
          <SettingsGroup label="APP SETTINGS">
            <SettingsItem icon={<MapPin size={16}/>} label="Location Preferences" href="#" />
            <SettingsItem icon={<Bell size={16}/>} label="Notification Settings" href="#" />
            <SettingsItem icon={<Shield size={16}/>} label="Offline Cache" href="#" />
            <SettingsItem icon={<Globe size={16}/>} label="Language & Region" href="#" />
          </SettingsGroup>
        )}

        {/* Support Tab */}
        {tab === "support" && (
          <>
            <SettingsGroup label="HELP">
              <SettingsItem icon={<MessageSquare size={16}/>} label="Chat Support" href="#" />
              <SettingsItem icon={<Star size={16}/>} label="Rate the App" href="#" />
              <SettingsItem icon={<Shield size={16}/>} label="Terms & Privacy" href="#" />
            </SettingsGroup>
            <button className="w-full flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-2xl px-4 py-3 font-medium">
              <Trash2 size={18}/> Delete Account
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function SettingsGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-muted-foreground tracking-wider mb-2 px-1">{label}</p>
      <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
        {children}
      </div>
    </div>
  );
}

function SettingsItem({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  return (
    <Link href={href}>
      <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors">
        <span className="text-muted-foreground">{icon}</span>
        <span className="flex-1 text-sm font-medium">{label}</span>
        <ChevronRight size={16} className="text-muted-foreground" />
      </div>
    </Link>
  );
}
