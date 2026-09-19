import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { useRouter } from "next/navigation";
import { setTokenPengguna, tandaiKeluar } from "@/lib/auth/session";

vi.mock("next/navigation", () => ({ useRouter: vi.fn() }));

/**
 * Membuat JWT palsu yang dapat didekode decodeJWT (tanpa verifikasi tanda tangan).
 * Bentuk payload mengikuti token pengguna backend: id, tenantID, role, permissions.
 */
function jwtPalsu(payload: Record<string, unknown>): string {
  const encode = (s: string) =>
    Buffer.from(s).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  return `${encode(JSON.stringify({ alg: "HS256" }))}.${encode(JSON.stringify(payload))}.palsu`;
}

describe("useAuthGuard", () => {
  const mockReplace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ replace: mockReplace });
  });

  it("tidak redirect selama sesi masih dipulihkan", () => {
    // Status awal store adalah "memuat": pemulihan lewat cookie belum selesai.
    // Redirect di tahap ini akan melempar pengguna yang sebenarnya punya sesi.
    const { result } = renderHook(() => useAuthGuard());

    expect(mockReplace).not.toHaveBeenCalled();
    expect(result.current.status).toBe("memuat");
    expect(result.current.siap).toBe(false);
  });

  it("redirect ke /login saat pemulihan selesai tanpa sesi", () => {
    tandaiKeluar();
    renderHook(() => useAuthGuard());

    expect(mockReplace).toHaveBeenCalledWith("/login");
  });

  it("tidak redirect saat sesi pengguna tersedia", () => {
    setTokenPengguna(
      jwtPalsu({ id: "u1", tenantID: "t1", role: "Kasir", permissions: ["read-produk"] }),
    );
    const { result } = renderHook(() => useAuthGuard());

    expect(mockReplace).not.toHaveBeenCalled();
    expect(result.current.siap).toBe(true);
  });

  it("redirect ke /login saat sesi dicabut setelah sebelumnya masuk", () => {
    setTokenPengguna(jwtPalsu({ id: "u1", tenantID: "t1", role: "Owner", permissions: [] }));
    const { rerender } = renderHook(() => useAuthGuard());
    expect(mockReplace).not.toHaveBeenCalled();

    tandaiKeluar();
    rerender();

    expect(mockReplace).toHaveBeenCalledWith("/login");
  });

  it("mengabaikan token tanpa tenantID: sesi dianggap tidak sah", () => {
    setTokenPengguna(jwtPalsu({ id: "u1", role: "Kasir", permissions: [] }));
    renderHook(() => useAuthGuard());

    expect(mockReplace).toHaveBeenCalledWith("/login");
  });
});
