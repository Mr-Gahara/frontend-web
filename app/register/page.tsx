"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import { RegisterRequest, RegisterResponse } from "@/types/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterRequest>({ username: "", email: "", password: "" });
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
      await apiClient.post<RegisterResponse>("/akun/auth/register", form);
      router.push("/login");
    } catch (err: any) {
      setError(err.message || "Register gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username</label>
          <input
            name="username" // ← fix: dari "nama" jadi "username"
            type="text"
            value={form.username}
            onChange={handleChange}
            required
          />
        </div>
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
        {error && <p style={{ color: "var(--error)" }}>{ error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Loading..." : "Register"}
        </button>
      </form>
      <p>Sudah punya akun? <a href="/login">Login</a></p>
    </div>
  );
}