"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import { decodeJWT } from "@/lib/decodeToken";
import { RegisterOwnerRequest, RegisterOwnerResponse } from "@/types/pengguna";

const BuatOwnerPage = () => {
  const router = useRouter();
  const [form, setForm] = useState<RegisterOwnerRequest>({ nama: "", pin: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Harus punya accessToken akun
    const accessToken = sessionStorage.getItem("accessToken");
    if (!accessToken) {
      router.push("/login");
      return;
    }

    // Harus sudah punya tenantID
    const payload = decodeJWT(accessToken);
    if (!payload.id) {
      router.push("/login");
      return;
    }
    if (!payload.tenantID) {
      router.push("/setup/buatToko");
      return;
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await apiClient.post<RegisterOwnerResponse>(
        "/pengguna/register-owner",
        form,
      );

      // accessToken dari response ini adalah token pengguna (bukan akun)
      sessionStorage.setItem("penggunaToken", res.accessToken);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Gagal membuat owner");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Buat Owner</h1>
      <p>Buat akun owner untuk mengelola toko kamu.</p>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nama Owner</label>
          <input
            name="nama"
            type="text"
            value={form.nama}
            onChange={handleChange}
            placeholder="contoh: Budi Santoso"
            required
          />
        </div>
        <div>
          <label>PIN</label>
          <input
            name="pin"
            type="password"
            value={form.pin}
            onChange={handleChange}
            placeholder="6 digit PIN"
            maxLength={6}
            required
          />
        </div>
        {error && <p style={{ color: "var(--error)" }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Membuat owner..." : "Buat Owner"}
        </button>
      </form>
    </div>
  );
};

export default BuatOwnerPage;
