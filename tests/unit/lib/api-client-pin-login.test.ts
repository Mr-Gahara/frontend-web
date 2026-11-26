import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * pin-login memakai token akun. Tab lain yang menyegarkan sesi akun memutar
 * tokenVersion, sehingga token akun tab ini ditolak 401 "Sesi telah berakhir
 * atau dihentikan" walau PIN benar (ditemukan spec auth/sidebar-pengguna,
 * butir 190). Penolakan sesi diulang sekali sesudah refresh akun; PIN salah
 * (juga 401) tidak diulang agar hitungan percobaan gagal backend tidak naik.
 */

const sesi = vi.hoisted(() => ({ token: "akun-lama" as string | null }));

vi.mock("@/lib/auth/session", () => ({
  tokenAkun: () => sesi.token,
  tokenPengguna: () => null,
  setTokenAkun: (t: string) => {
    sesi.token = t;
  },
  setTokenPengguna: vi.fn(),
  akhiriSesi: vi.fn(),
}));

vi.mock("@/lib/auth/sessionChannel", () => ({
  refreshTerkoordinasi: (_jenis: string, jalankan: () => Promise<string | null>) => jalankan(),
}));

import { apiClient } from "@/lib/apiClient";

const jawab = (status: number, isi: unknown) =>
  new Response(JSON.stringify(isi), { status, headers: { "Content-Type": "application/json" } });

type Panggilan = { url: string; auth: string | undefined };

function pasangFetch(jawaban: Response[]) {
  const panggilan: Panggilan[] = [];
  const fetchPalsu = vi.fn(async (url: string, init?: RequestInit) => {
    const headers = (init?.headers ?? {}) as Record<string, string>;
    panggilan.push({ url, auth: headers.Authorization });
    const r = jawaban.shift();
    if (!r) throw new Error(`fetch tak terduga: ${url}`);
    return r;
  });
  vi.stubGlobal("fetch", fetchPalsu);
  return panggilan;
}

describe("apiClient pin-login sesudah sesi akun diputar tab lain", () => {
  beforeEach(() => {
    sesi.token = "akun-lama";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("menyegarkan token akun lalu mengulang pin-login sekali", async () => {
    const panggilan = pasangFetch([
      jawab(401, { status: "error", message: "Sesi telah berakhir atau dihentikan. Silakan login ulang." }),
      jawab(200, { accessToken: "akun-baru" }),
      jawab(200, { data: { accessToken: "pengguna" } }),
    ]);

    const hasil = await apiClient.post("/pengguna/pin-login", { nama: "Ridho", pin: "123456" });

    expect(hasil).toEqual({ data: { accessToken: "pengguna" } });
    expect(panggilan.map((p) => p.url)).toEqual([
      "/api/pengguna/pin-login",
      "/api/akun/auth/refreshtoken",
      "/api/pengguna/pin-login",
    ]);
    expect(panggilan[0].auth).toBe("Bearer akun-lama");
    expect(panggilan[2].auth).toBe("Bearer akun-baru");
  });

  it("token akun yang tidak ada juga dipulihkan lewat refresh", async () => {
    const panggilan = pasangFetch([
      jawab(401, { status: "error", message: "Akses ditolak. Token akun tidak ditemukan." }),
      jawab(200, { accessToken: "akun-baru" }),
      jawab(200, { data: {} }),
    ]);

    await apiClient.post("/pengguna/pin-login", { nama: "Ridho", pin: "123456" });

    expect(panggilan).toHaveLength(3);
  });

  it("PIN salah tidak diulang dan pesannya diteruskan", async () => {
    const panggilan = pasangFetch([jawab(401, { status: "error", message: "Nama atau PIN salah." })]);

    await expect(apiClient.post("/pengguna/pin-login", { nama: "Ridho", pin: "000000" })).rejects.toMatchObject({
      status: 401,
      message: "Nama atau PIN salah.",
    });
    expect(panggilan.map((p) => p.url)).toEqual(["/api/pengguna/pin-login"]);
  });

  it("penolakan sesi yang tetap gagal sesudah diulang tidak diulang lagi", async () => {
    const panggilan = pasangFetch([
      jawab(401, { status: "error", message: "Sesi telah berakhir atau dihentikan. Silakan login ulang." }),
      jawab(200, { accessToken: "akun-baru" }),
      jawab(401, { status: "error", message: "Sesi telah berakhir atau dihentikan. Silakan login ulang." }),
    ]);

    await expect(apiClient.post("/pengguna/pin-login", { nama: "Ridho", pin: "123456" })).rejects.toMatchObject({
      status: 401,
    });
    expect(panggilan).toHaveLength(3);
  });
});
