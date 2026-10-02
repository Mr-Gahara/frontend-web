import { describe, it, expect, beforeEach } from "vitest";
import { akhiriSesi, bacaSesi, setTokenAkun } from "@/lib/auth/session";
import { tujuanGuardAdmin, tujuanGuardDashboard } from "@/lib/auth/tujuan";

/** JWT palsu yang dapat didekode decodeJWT (tanpa verifikasi tanda tangan). */
function jwtPalsu(payload: Record<string, unknown>): string {
  const encode = (s: string) =>
    Buffer.from(s).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  return `${encode(JSON.stringify({ alg: "HS256" }))}.${encode(JSON.stringify(payload))}.palsu`;
}

describe("tujuanGuardDashboard", () => {
  it("menunggu selama sesi dipulihkan", () => {
    expect(tujuanGuardDashboard({ status: "memuat", adaTokenAkun: false, adalahAdmin: false })).toBeNull();
  });

  it("tetap di halaman saat pengguna sudah masuk", () => {
    expect(tujuanGuardDashboard({ status: "masuk", adaTokenAkun: true, adalahAdmin: false })).toBeNull();
  });

  it("tanpa token akun menuju login akun", () => {
    expect(tujuanGuardDashboard({ status: "keluar", adaTokenAkun: false, adalahAdmin: false })).toBe("/login");
  });

  it("akun klien tanpa sesi pengguna menuju login pengguna", () => {
    expect(tujuanGuardDashboard({ status: "keluar", adaTokenAkun: true, adalahAdmin: false })).toBe(
      "/login/pengguna",
    );
  });

  it("akun admin dikembalikan ke panel admin", () => {
    expect(tujuanGuardDashboard({ status: "keluar", adaTokenAkun: true, adalahAdmin: true })).toBe("/admin");
  });
});

describe("tujuanGuardAdmin", () => {
  it("menunggu selama sesi dipulihkan", () => {
    expect(tujuanGuardAdmin({ status: "memuat", adaTokenAkun: true, adalahAdmin: true })).toBeNull();
  });

  it("tanpa token akun menuju login akun", () => {
    expect(tujuanGuardAdmin({ status: "keluar", adaTokenAkun: false, adalahAdmin: false })).toBe("/login");
  });

  it("akun admin tetap di panel admin", () => {
    expect(tujuanGuardAdmin({ status: "keluar", adaTokenAkun: true, adalahAdmin: true })).toBeNull();
  });

  it("akun klien yang sudah masuk menuju dashboard", () => {
    expect(tujuanGuardAdmin({ status: "masuk", adaTokenAkun: true, adalahAdmin: false })).toBe("/dashboard");
  });

  it("akun klien tanpa sesi pengguna menuju login pengguna", () => {
    expect(tujuanGuardAdmin({ status: "keluar", adaTokenAkun: true, adalahAdmin: false })).toBe(
      "/login/pengguna",
    );
  });
});

describe("sesi akun dari token akun", () => {
  beforeEach(() => akhiriSesi());

  it("token admin: role admin tanpa tenantID", () => {
    setTokenAkun(jwtPalsu({ id: "a1", role: "admin", version: 1 }));
    expect(bacaSesi().akun).toEqual({ id: "a1", role: "admin", tenantID: undefined });
  });

  it("token klien: role client beserta tenantID", () => {
    setTokenAkun(jwtPalsu({ id: "a2", role: "client", version: 1, tenantID: "t1" }));
    expect(bacaSesi().akun).toEqual({ id: "a2", role: "client", tenantID: "t1" });
  });

  it("role yang tidak dikenal diperlakukan sebagai client", () => {
    setTokenAkun(jwtPalsu({ id: "a3", role: "superuser", version: 1 }));
    expect(bacaSesi().akun?.role).toBe("client");
  });

  it("token tanpa id tidak menghasilkan sesi akun", () => {
    setTokenAkun(jwtPalsu({ role: "admin", version: 1 }));
    expect(bacaSesi().akun).toBeNull();
  });

  it("token dikosongkan: sesi akun ikut kosong", () => {
    setTokenAkun(jwtPalsu({ id: "a1", role: "admin", version: 1 }));
    setTokenAkun(null);
    expect(bacaSesi().akun).toBeNull();
  });
});