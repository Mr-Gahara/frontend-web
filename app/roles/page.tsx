"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "../hooks/useAuthGuard";
import { apiClient } from "@/lib/apiClient";
import { Role, GetRolesResponse } from "@/types/role";

export default function RolesPage() {
  useAuthGuard();

  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);

    const fetchRoles = async () => {
      try {
        const res = await apiClient.get<GetRolesResponse>(
          "/role",
          undefined,
          "pengguna"
        );
        setRoles(res.data);
      } catch (err: any) {
        setError(err.message || "Gagal memuat role");
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, []);

  if (!mounted) return null;

  return (
    <div style={{ maxWidth: "640px", margin: "2rem auto", padding: "0 1rem" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ margin: 0 }}>Roles</h1>
        <button onClick={() => router.push("/roles/buatRole")}>
          + Buat Role
        </button>
      </div>

      {/* Error */}
      {error && <p style={{ color: "var(--error)" }}>{error}</p>}

      {/* Loading */}
      {loading && <p style={{ color: "var(--muted)" }}>Memuat role...</p>}

      {/* Empty state */}
      {!loading && roles.length === 0 && (
        <p style={{ color: "var(--muted)" }}>Belum ada role. Buat role pertama kamu.</p>
      )}

      {/* Role list */}
      {!loading && roles.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {roles.map((role) => (
            <div
              key={role._id}
              style={{
                border: "1px solid var(--border)",
                borderRadius: "0.375rem",
                padding: "1rem",
              }}
            >
              {/* Role header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{role.namaRole}</p>
                  {role.deskripsi && (
                    <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: 0 }}>
                      {role.deskripsi}
                    </p>
                  )}
                </div>
                <span style={{ color: "var(--muted)", fontSize: "0.8rem", flexShrink: 0, marginLeft: "1rem" }}>
                  {role.permissions.length} permission
                </span>
              </div>

              {/* Permission tags */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginTop: "0.75rem" }}>
                {role.permissions.map((perm) => (
                  <span
                    key={perm}
                    style={{
                      fontSize: "0.75rem",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "999px",
                      border: "1px solid var(--border)",
                      color: "var(--muted)",
                    }}
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}