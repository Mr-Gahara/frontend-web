"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import { BuatTokoRequest, BuatTokoResponse } from "@/types/tenant";
import { decodeJWT } from "@/lib/decodeToken";

export default function BuatTokoPage() {
  const router = useRouter();
  const [namaToko, setNamaToko] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    // konsisten — pakai JWT bukan localStorage
    const payload = decodeJWT(token);
    if (!payload.id) {
      router.push("/login");
      return;
    }

    if (payload.tenantID) {
      router.push("/dashboard");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload: BuatTokoRequest = { namaToko };
      const res = await apiClient.post<BuatTokoResponse>("/tenant", payload);

      sessionStorage.setItem("accessToken", res.accessToken);

      router.push("/setup/buatOwner");
    } catch (err: any) {
      setError(err.message || "Gagal membuat toko");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Buat Toko</h1>
      <p>Selamat datang! Buat toko kamu untuk mulai menggunakan Tachyon POS.</p>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nama Toko</label>
          <input
            type="text"
            value={namaToko}
            onChange={(e) => setNamaToko(e.target.value)}
            placeholder="contoh: Kopi Kenangan Pontianak"
            required
          />
        </div>
        {error && <p style={{ color: "var(--error)" }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Membuat toko..." : "Buat Toko"}
        </button>
      </form>
    </div>
  );
}
