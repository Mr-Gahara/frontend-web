"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import { decodeJWT } from "@/lib/decodeToken";
import { PinLoginRequest, PinLoginResponse } from "@/types/pengguna";

const PenggunaLoginPage = () => {
  const router = useRouter();
  const [form, setForm] = useState<PinLoginRequest>({ nama: "", pin: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Harus punya accessToken akun yang valid
    const accessToken = sessionStorage.getItem("accessToken");
    if (!accessToken) {
      router.push("/login");
      return;
    }

    const payload = decodeJWT(accessToken);
    if (!payload.id) {
      router.push("/login");
      return;
    }

    // Harus sudah punya tenant
    if (!payload.tenantID) {
      router.push("/setup/buatToko");
      return;
    }

    // Kalau penggunaToken sudah ada, tidak perlu login lagi
    const penggunaToken = sessionStorage.getItem("penggunaToken");
    if (penggunaToken) {
      router.push("/dashboard");
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
      const res = await apiClient.post<PinLoginResponse>(
        "/pengguna/pin-login",
        form
      );

      sessionStorage.setItem("penggunaToken", res.accessToken);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Login Pengguna</h1>
      <p>Masuk menggunakan nama dan PIN kamu.</p>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nama</label>
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
          {loading ? "Loading..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default PenggunaLoginPage;