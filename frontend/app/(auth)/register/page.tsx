"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowLeft } from "lucide-react";
import { useState } from "react";

const schema = z.object({
  full_name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  password: z.string().min(8, "Min 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.register({
        full_name: data.full_name,
        email: data.email,
        password: data.password,
        phone: data.phone || undefined,
      });
      setAuth(res.user, res.access_token, res.refresh_token);
      toast.success(`Welcome to ProductBajar, ${res.user.full_name}!`);
      router.push("/");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-4 pt-12">
        <button onClick={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={22} className="text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 px-6 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Create Account 🛍️</h1>
          <p className="text-muted-foreground mt-2">Join ProductBajar and discover stores near you</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Full Name</label>
            <div className="flex items-center border border-border rounded-xl px-4 py-3 gap-2 focus-within:border-primary transition-colors">
              <User size={16} className="text-muted-foreground shrink-0" />
              <input {...register("full_name")} placeholder="Ravi Kumar" className="flex-1 bg-transparent text-sm outline-none" />
            </div>
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <div className="flex items-center border border-border rounded-xl px-4 py-3 gap-2 focus-within:border-primary transition-colors">
              <Mail size={16} className="text-muted-foreground shrink-0" />
              <input {...register("email")} type="email" placeholder="you@example.com" className="flex-1 bg-transparent text-sm outline-none" />
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Phone (optional)</label>
            <div className="flex items-center border border-border rounded-xl px-4 py-3 gap-2 focus-within:border-primary transition-colors">
              <Phone size={16} className="text-muted-foreground shrink-0" />
              <input {...register("phone")} type="tel" placeholder="+91 98765 43210" className="flex-1 bg-transparent text-sm outline-none" />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Password</label>
            <div className="flex items-center border border-border rounded-xl px-4 py-3 gap-2 focus-within:border-primary transition-colors">
              <Lock size={16} className="text-muted-foreground shrink-0" />
              <input {...register("password")} type={showPass ? "text" : "password"} placeholder="Min 8 characters" className="flex-1 bg-transparent text-sm outline-none" />
              <button type="button" onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={16} className="text-muted-foreground" /> : <Eye size={16} className="text-muted-foreground" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Confirm Password</label>
            <div className="flex items-center border border-border rounded-xl px-4 py-3 gap-2 focus-within:border-primary transition-colors">
              <Lock size={16} className="text-muted-foreground shrink-0" />
              <input {...register("confirmPassword")} type={showPass ? "text" : "password"} placeholder="Repeat password" className="flex-1 bg-transparent text-sm outline-none" />
            </div>
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-white font-semibold py-3.5 rounded-2xl text-sm mt-2 hover:opacity-90 transition disabled:opacity-60"
          >
            {isSubmitting ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-semibold">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
