"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { storeApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { CATEGORY_ICONS, CATEGORY_LABELS } from "@/lib/utils";
import type { StoreCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

const CATEGORIES = Object.keys(CATEGORY_ICONS) as StoreCategory[];

const schema = z.object({
  name: z.string().min(2, "Store name required"),
  description: z.string().optional(),
  category: z.string().min(1, "Select a category"),
  address: z.string().min(5, "Address required"),
  city: z.string().min(2, "City required"),
  state: z.string().min(2, "State required"),
  pincode: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

export default function CreateStorePage() {
  const router = useRouter();
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: "other" },
  });
  const selectedCategory = watch("category");

  const autoDetect = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue("latitude", pos.coords.latitude);
        setValue("longitude", pos.coords.longitude);
        toast.success("Location detected!");
      },
      () => toast.error("Could not get location")
    );
  };

  const onSubmit = async (data: FormData) => {
    try {
      const store = await storeApi.create(data as any);
      toast.success("Store created! Pending approval.");
      router.push(`/seller/dashboard`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to create store");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()}><ArrowLeft size={22} className="text-muted-foreground" /></button>
        <h1 className="font-bold text-base">Create New Store</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-5 pb-10">
        {/* Store Name */}
        <Field label="Store Name *" error={errors.name?.message}>
          <input {...register("name")} placeholder="e.g. Ravi Kitchen Store" className="input" />
        </Field>

        {/* Description */}
        <Field label="Description">
          <textarea {...register("description")} rows={3} placeholder="What do you sell?" className="input resize-none" />
        </Field>

        {/* Category */}
        <div>
          <p className="text-sm font-medium mb-2">Category *</p>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setValue("category", cat)}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-xl border text-[10px] font-medium transition-all",
                  selectedCategory === cat ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                )}
              >
                <span className="text-xl">{CATEGORY_ICONS[cat]}</span>
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
          {errors.category && <p className="text-xs text-destructive mt-1">{errors.category.message}</p>}
        </div>

        {/* Address */}
        <Field label="Address *" error={errors.address?.message}>
          <input {...register("address")} placeholder="Street address" className="input" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="City *" error={errors.city?.message}>
            <input {...register("city")} placeholder="Mumbai" className="input" />
          </Field>
          <Field label="State *" error={errors.state?.message}>
            <input {...register("state")} placeholder="Maharashtra" className="input" />
          </Field>
        </div>

        <Field label="Pincode">
          <input {...register("pincode")} placeholder="400001" className="input" />
        </Field>

        {/* Location */}
        <div>
          <p className="text-sm font-medium mb-2">Store Location (GPS)</p>
          <button
            type="button"
            onClick={autoDetect}
            className="flex items-center gap-2 text-sm text-primary border border-primary/30 bg-primary/5 rounded-xl px-4 py-2.5 w-full justify-center"
          >
            <MapPin size={15} /> Auto-detect my location
          </button>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <Field label="Latitude" error={errors.latitude?.message}>
              <input {...register("latitude")} type="number" step="any" placeholder="28.6139" className="input" />
            </Field>
            <Field label="Longitude" error={errors.longitude?.message}>
              <input {...register("longitude")} type="number" step="any" placeholder="77.2090" className="input" />
            </Field>
          </div>
        </div>

        {/* Contact */}
        <Field label="Phone">
          <input {...register("phone")} placeholder="+91 98765 43210" className="input" />
        </Field>
        <Field label="WhatsApp">
          <input {...register("whatsapp")} placeholder="+91 98765 43210" className="input" />
        </Field>
        <Field label="Email">
          <input {...register("email")} type="email" placeholder="store@example.com" className="input" />
        </Field>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary text-white font-bold py-4 rounded-2xl text-sm hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Creating…</> : "Create Store"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
