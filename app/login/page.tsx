"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import { LoginRequest, LoginResponse } from "@/types/auth";
import { decodeJWT } from "@/lib/decodeToken";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState<LoginRequest>({
    email: "",
    password: "",
    deviceID: "",
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
      const res = await apiClient.post<LoginResponse>("/akun/auth/login", form);
      sessionStorage.setItem("accessToken", res.accessToken);
      localStorage.setItem("akun", JSON.stringify(res.data));
      const payload = decodeJWT(res.accessToken);

      if (!payload.tenantID) {
        router.push("/setup/buatToko");
      } else {
        router.push("/login/pengguna");
      }
    } catch (err: any) {
      setError(err.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Password</label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Device ID</label>
          <input
            name="deviceID"
            type="text"
            value={form.deviceID}
            onChange={handleChange}
            placeholder="contoh: device-testing-001"
            required
          />
        </div>
        {error && <p style={{ color: "var(--error)" }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Loading..." : "Login"}
        </button>
      </form>
      <p>
        Belum punya akun? <a href="/register">Register</a>
      </p>
    </div>
  );
}
