"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import { LoginResponse } from "@/types/auth";

import { Mail, Lock, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  // Sesuai Panduan Pengujian 1.2: Payload login SaaS murni hanya email & password
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      sessionStorage.removeItem("penggunaToken");

      const res = await apiClient.post<LoginResponse>("/akun/auth/login", form);

      sessionStorage.setItem("accessToken", res.accessToken);
      localStorage.setItem("akun", JSON.stringify(res.data));

      if (res.requireSetup) {
        router.push("/setup/buatToko");
      } else {
        router.push("/login/pengguna");
      }
    } catch (err: any) {
      setError(
        err.message ||
          "Autentikasi gagal. Mohon periksa kembali email dan sandi Anda.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6 space-y-6">
        {/* Header Kartu */}
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Login Akun SaaS
          </h1>
          <p className="text-sm text-muted-foreground">
            Masuk ke platform utama untuk mengelola unit usaha Anda.
          </p>
        </div>

        {/* Form Input */}
        <form onSubmit={handleSubmit} method="POST" action="#" className="space-y-4" suppressHydrationWarning>
          {/* Input Email */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-xs font-medium text-foreground flex items-center gap-1.5"
            >
              <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              suppressHydrationWarning
              value={form.email}
              onChange={handleChange}
              placeholder="nama@perusahaan.com"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              required
              disabled={loading}
            />
          </div>

          {/* Input Password */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-xs font-medium text-foreground flex items-center gap-1.5"
            >
              <Lock className="h-3.5 w-3.5 text-muted-foreground" /> Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              suppressHydrationWarning
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              required
              disabled={loading}
            />
          </div>

          {/* Blok Peringatan Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs font-medium text-destructive border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tombol Eksekusi Submit */}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 w-full cursor-pointer gap-2 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Membuka Akses Sesi...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
