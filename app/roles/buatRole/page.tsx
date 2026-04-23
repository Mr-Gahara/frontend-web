"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { apiClient } from "@/lib/apiClient";
import { Permission, BuatRoleRequest, BuatRoleResponse } from "@/types/role";

export default function BuatRolePage() {
  useAuthGuard();

  const router = useRouter();
  const [mounted, setMounted] = useState(false); // ← fix hydration
  const [namaRole, setNamaRole] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);

    const fetchPermissions = async () => {
      try {
        const res = await apiClient.get<{ message: string; data: Permission[] }>(
          "/permission",
          undefined,
          "pengguna"
        );
        setPermissions(res.data);
      } catch (err: any) {
        setError(err.message || "Gagal memuat permission");
      } finally {
        setLoadingPermissions(false);
      }
    };

    fetchPermissions();
  }, []);

  const handleCheckbox = (id: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedPermissions.length === permissions.length) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions(permissions.map((p) => p._id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (selectedPermissions.length === 0) {
      setError("Pilih minimal 1 permission");
      return;
    }

    setLoading(true);
    try {
      const payload: BuatRoleRequest = {
        namaRole,
        ...(deskripsi && { deskripsi }),
        permissions: selectedPermissions,
      };
      await apiClient.post<BuatRoleResponse>("/role", payload, undefined, "pengguna");
      router.refresh();
      router.push("/roles");
    } catch (err: any) {
      setError(err.message || "Gagal membuat role");
    } finally {
      setLoading(false);
    }
  };

  const grouped = permissions.reduce<Record<string, Permission[]>>(
    (acc, permission) => {
      if (!acc[permission.grup]) acc[permission.grup] = [];
      acc[permission.grup].push(permission);
      return acc;
    },
    {}
  );

  // Jangan render apapun sampai mounted — fix hydration mismatch
  if (!mounted) return null;

  return (
    <div style={{ maxWidth: "640px", margin: "2rem auto", padding: "0 1rem" }}>
      <h1>Buat Role</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginTop: "1.5rem" }}>

        <div>
          <label>Nama Role</label>
          <input
            type="text"
            value={namaRole}
            onChange={(e) => setNamaRole(e.target.value)}
            placeholder="contoh: Kasir"
            required
          />
        </div>

        <div>
          <label>
            Deskripsi{" "}
            <span style={{ color: "var(--muted)", fontWeight: 400 }}>(opsional)</span>
          </label>
          <input
            type="text"
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            placeholder="contoh: Akses kasir harian"
          />
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
            <label style={{ marginBottom: 0 }}>Permission</label>
            <button type="button" onClick={handleSelectAll}>
              {selectedPermissions.length === permissions.length && permissions.length > 0
                ? "Batal Pilih Semua"
                : "Pilih Semua"}
            </button>
          </div>

          <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "0.75rem" }}>
            {selectedPermissions.length} dari {permissions.length} dipilih
          </p>

          {loadingPermissions ? (
            <p style={{ color: "var(--muted)" }}>Memuat permission...</p>
          ) : (
            <div style={{ border: "1px solid var(--border)", borderRadius: "0.375rem" }}>
              {Object.entries(grouped).map(([grup, items], i) => (
                <div
                  key={grup}
                  style={{
                    padding: "0.75rem 1rem",
                    borderBottom: i < Object.keys(grouped).length - 1
                      ? "1px solid var(--border)"
                      : "none",
                  }}
                >
                  <p style={{ fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                    {grup}
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {items.map((permission) => (
                      <label
                        key={permission._id}
                        htmlFor={permission._id}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "0.625rem",
                          cursor: "pointer",
                          marginBottom: 0,
                        }}
                      >
                        <input
                          type="checkbox"
                          id={permission._id}
                          checked={selectedPermissions.includes(permission._id)}
                          onChange={() => handleCheckbox(permission._id)}
                          style={{ marginTop: "3px", flexShrink: 0 }}
                        />
                        {/* ← fix: wrap text dalam span agar tidak overflow */}
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontWeight: 500 }}>{permission.nama}</span>
                          {permission.deskripsi && (
                            <span style={{ color: "var(--muted)", fontSize: "0.8rem", marginLeft: "0.4rem" }}>
                              — {permission.deskripsi}
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p style={{ color: "var(--error)", margin: 0 }}>{error}</p>}

        <button type="submit" disabled={loading || loadingPermissions}>
          {loading ? "Membuat role..." : "Buat Role"}
        </button>

      </form>
    </div>
  );
}