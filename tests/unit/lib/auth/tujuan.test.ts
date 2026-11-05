import { describe, it, expect, beforeEach } from "vitest";
import { akhiriSesi, bacaSesi, setTokenAkun } from "@/lib/auth/session";
import {
  tujuanGuardAdmin,
  tujuanGuardDashboard,
  tujuanGuardSetup,
  tujuanSesudahLoginPengguna,
} from "@/lib/auth/tujuan";

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
describe("tujuanGuardSetup", () => {
  const klien = (status: "memuat" | "masuk" | "keluar") => ({ status, adaTokenAkun: true, adalahAdmin: false });
  const belum = { tuntas: false, ownerTerdaftar: false };

  it("menunggu sesi dan status setup", () => {
    expect(tujuanGuardSetup({ status: "memuat", adaTokenAkun: false, adalahAdmin: false }, null)).toBeNull();
    expect(tujuanGuardSetup(klien("keluar"), null)).toBeNull();
  });

  it("tanpa token akun ke login akun, admin ke panel admin", () => {
    expect(tujuanGuardSetup({ status: "keluar", adaTokenAkun: false, adalahAdmin: false }, belum)).toBe("/login");
    expect(tujuanGuardSetup({ status: "keluar", adaTokenAkun: true, adalahAdmin: true }, null)).toBe("/admin");
  });

  it("sebelum Owner ada, wizard tetap terbuka tanpa sesi pengguna", () => {
    expect(tujuanGuardSetup(klien("keluar"), belum)).toBeNull();
  });

  it("Owner terdaftar tanpa sesi pengguna masuk lewat login PIN lalu kembali", () => {
    expect(tujuanGuardSetup(klien("keluar"), { tuntas: false, ownerTerdaftar: true })).toBe(
      "/login/pengguna?kembali=%2Fsetup",
    );
    expect(tujuanGuardSetup(klien("masuk"), { tuntas: false, ownerTerdaftar: true })).toBeNull();
  });

  it("setup tuntas tidak dibuka lagi", () => {
    const tuntas = { tuntas: true, ownerTerdaftar: true };
    expect(tujuanGuardSetup(klien("masuk"), tuntas)).toBe("/dashboard");
    expect(tujuanGuardSetup(klien("keluar"), tuntas)).toBe("/login/pengguna");
  });
});

describe("tujuanSesudahLoginPengguna", () => {
  it("hanya /setup yang diterima sebagai tujuan kembali", () => {
    expect(tujuanSesudahLoginPengguna("/setup")).toBe("/setup");
    expect(tujuanSesudahLoginPengguna(null)).toBe("/dashboard");
    expect(tujuanSesudahLoginPengguna("https://contoh.id")).toBe("/dashboard");
    expect(tujuanSesudahLoginPengguna("/admin")).toBe("/dashboard");
  });
});
