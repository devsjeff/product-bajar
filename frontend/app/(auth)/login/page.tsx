"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";
import { useState } from "react";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Min 8 characters"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.login(data);
      setAuth(res.user, res.access_token, res.refresh_token);
      toast.success(`Welcome back, ${res.user.full_name}!`);
      router.push("/");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-4 pt-12">
        <button onClick={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={22} className="text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome back 👋</h1>
          <p className="text-muted-foreground mt-2">Sign in to continue to ProductBajar</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <div className="flex items-center border border-border rounded-xl px-4 py-3 gap-2 focus-within:border-primary transition-colors">
              <Mail size={16} className="text-muted-foreground shrink-0" />
              <input
                {...register("email")}
                type="email"
                placeholder="you@example.com"
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Password</label>
            <div className="flex items-center border border-border rounded-xl px-4 py-3 gap-2 focus-within:border-primary transition-colors">
              <Lock size={16} className="text-muted-foreground shrink-0" />
              <input
                {...register("password")}
                type={showPass ? "text" : "password"}
                placeholder="Min 8 characters"
                className="flex-1 bg-transparent text-sm outline-none"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={16} className="text-muted-foreground" /> : <Eye size={16} className="text-muted-foreground" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-white font-semibold py-3.5 rounded-2xl text-sm mt-2 hover:opacity-90 transition disabled:opacity-60"
          >
            {isSubmitting ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary font-semibold">Register</Link>
        </p>
      </div>
    </div>
  );
}
