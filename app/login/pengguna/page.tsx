"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import { decodeJWT } from "@/lib/decodeToken";
import { User, Lock, Loader2, AlertCircle } from "lucide-react";

export default function PenggunaLoginPage() {
  const router = useRouter();

  // Mengirimkan nama, pin, dan loginType "web" sesuai spesifikasi Anda
  const [form, setForm] = useState({
    nama: "",
    pin: "",
    // loginType: "web",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    /**
     * Ambil Token A
     */
    const accessToken = sessionStorage.getItem("accessToken");

    /**
     * Tidak ada Token A
     */
    if (!accessToken || accessToken === "undefined" || accessToken === "null") {
      router.replace("/login");
      return;
    }

    /**
     * Decode JWT
     */
    const payload = decodeJWT(accessToken);

    /**
     * Token rusak / invalid
     */
    if (!payload || !payload.id) {
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("penggunaToken");

      router.replace("/login");
      return;
    }

    /**
     * Akun belum onboarding tenant
     * Web tidak menangani setup tenant
     */
    if (!payload.tenantID) {
      setError(
        "Akun ini belum memiliki toko aktif. Silakan lakukan setup awal melalui aplikasi mobile terlebih dahulu.",
      );

      return;
    }

    /**
     * Cek Token C
     */
    const penggunaToken = sessionStorage.getItem("penggunaToken");

    /**
     * Bersihkan token sampah
     */
    if (penggunaToken === "undefined" || penggunaToken === "null") {
      sessionStorage.removeItem("penggunaToken");
      return;
    }

    /**
     * Jika Token C valid,
     * langsung masuk dashboard
     */
    if (penggunaToken) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      /**
       * WEB FLOW:
       * Token A -> login pengguna -> dapat Token C
       */
      const res = await apiClient.post<any>("/pengguna/pin-login", {
        nama: form.nama,
        pin: form.pin,
        loginType: "web",
      });

      const tokenC =
        res.accessToken ||
        res.data?.accessToken ||
        res.token ||
        res.data?.token;

      if (!tokenC) {
        throw new Error("Token pengguna gagal diterbitkan.");
      }

      sessionStorage.setItem("penggunaToken", tokenC);

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Nama atau PIN tidak valid.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Login Karyawan / Owner
          </h1>
          <p className="text-sm text-muted-foreground">
            Masukkan Nama Akun dan PIN Otentikasi Anda untuk mengakses terminal
            outlet.
          </p>
        </div>

        <form onSubmit={handleSubmit} method="POST" action="#" className="space-y-4" suppressHydrationWarning>
          <div className="space-y-2">
            <label
              htmlFor="nama"
              className="text-xs font-medium text-foreground flex items-center gap-1.5"
            >
              <User className="h-3.5 w-3.5 text-muted-foreground" /> Nama
              Pengguna
            </label>
            <input
              id="nama"
              name="nama"
              type="text"
              suppressHydrationWarning
              value={form.nama}
              onChange={handleChange}
              placeholder="Contoh: Ridho"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="pin"
              className="text-xs font-medium text-foreground flex items-center gap-1.5"
            >
              <Lock className="h-3.5 w-3.5 text-muted-foreground" /> PIN
              Keamanan
            </label>
            <input
              id="pin"
              name="pin"
              type="password"
              suppressHydrationWarning
              value={form.pin}
              onChange={handleChange}
              placeholder="6 Digit PIN"
              maxLength={6}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors tracking-widest font-mono"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs font-medium text-destructive border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center font-bold justify-center rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 w-full cursor-pointer gap-2 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menerbitkan Token C...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>

        <div className="text-center text-xs text-muted-foreground">
          Bukan bagian dari toko ini?{" "}
          <span
            onClick={() => {
              sessionStorage.clear();
              router.push("/login");
            }}
            className="text-primary hover:underline font-medium cursor-pointer"
          >
            Ganti Akun Bisnis
          </span>
        </div>
      </div>
    </div>
  );
}
