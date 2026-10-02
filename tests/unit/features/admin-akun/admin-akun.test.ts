import { describe, it, expect } from "vitest";
import { payloadBuatAkunKlien } from "@/features/admin-akun/payload";
import { skemaBuatAkunKlien, type NilaiBuatAkunKlien } from "@/features/admin-akun/schema";
import {
  namaToko,
  saringAkun,
  teksMasaAkses,
  teksStatus,
  teksToko,
} from "@/features/admin-akun/tampilan";
import { formatTanggalPendek } from "@/lib/format";
import type { AkunAdmin } from "@/types/adminAkun";

const isian = (ubah: Partial<NilaiBuatAkunKlien> = {}): NilaiBuatAkunKlien => ({
  email: "klien@contoh.id",
  username: "",
  password: "Rahasia123",
  durasi: "percobaan",
  ...ubah,
});

const akun = (ubah: Partial<AkunAdmin> = {}): AkunAdmin => ({
  id: "a1",
  username: "budi",
  email: "budi@contoh.id",
  role: "client",
  status: "aktif",
  daftarTenant: [{ tenantID: "t1", namaToko: "Kopi Senja" }],
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
  langganan: {
    aksesBerakhirPada: null,
    alasanNonAktif: null,
    dibekukanPada: null,
    masaTenggangHari: 7,
  },
  ...ubah,
});

const sah = (nilai: NilaiBuatAkunKlien) => skemaBuatAkunKlien.safeParse(nilai).success;

describe("skemaBuatAkunKlien", () => {
  it("menerima isian lengkap tanpa username", () => {
    expect(sah(isian())).toBe(true);
  });

  it("menolak email kosong", () => {
    expect(sah(isian({ email: "   " }))).toBe(false);
  });

  it("menolak email yang bukan email", () => {
    expect(sah(isian({ email: "klien-tanpa-domain" }))).toBe(false);
  });

  it("menolak password di bawah 8 karakter", () => {
    expect(sah(isian({ password: "Rah1" }))).toBe(false);
  });

  it("menolak password tanpa huruf kapital", () => {
    expect(sah(isian({ password: "rahasia123" }))).toBe(false);
  });

  it("menolak password tanpa angka", () => {
    expect(sah(isian({ password: "RahasiaSaja" }))).toBe(false);
  });

  it("menolak username 2 karakter", () => {
    expect(sah(isian({ username: "ab" }))).toBe(false);
  });

  it("menerima username 3 karakter setelah dipangkas", () => {
    expect(sah(isian({ username: "  abc  " }))).toBe(true);
  });

  it("menolak username 26 karakter", () => {
    expect(sah(isian({ username: "a".repeat(26) }))).toBe(false);
  });
});

describe("payloadBuatAkunKlien", () => {
  it("masa percobaan tanpa username: hanya email dan password", () => {
    expect(payloadBuatAkunKlien(isian())).toEqual({
      email: "klien@contoh.id",
      password: "Rahasia123",
    });
  });

  it("durasi terpilih dikirim sebagai angka", () => {
    expect(payloadBuatAkunKlien(isian({ durasi: "6" })).durasiBulan).toBe(6);
  });

  it("email dan username dipangkas, password apa adanya", () => {
    expect(
      payloadBuatAkunKlien(isian({ email: " klien@contoh.id ", username: " budi ", password: " Rahasia123 " })),
    ).toEqual({ email: "klien@contoh.id", username: "budi", password: " Rahasia123 " });
  });
});

describe("tampilan daftar akun", () => {
  const daftar = [
    akun(),
    akun({ id: "a2", email: "SITI@contoh.id", username: null, daftarTenant: [], status: "non-aktif" }),
  ];

  it("pencarian email tidak membedakan huruf", () => {
    expect(saringAkun(daftar, "siti", "semua").map((a) => a.id)).toEqual(["a2"]);
  });

  it("pencarian mengenai nama toko", () => {
    expect(saringAkun(daftar, "senja", "semua").map((a) => a.id)).toEqual(["a1"]);
  });

  it("filter status digabung dengan pencarian", () => {
    expect(saringAkun(daftar, "", "non-aktif").map((a) => a.id)).toEqual(["a2"]);
    expect(saringAkun(daftar, "budi", "non-aktif")).toEqual([]);
  });

  it("toko: nama toko, belum punya toko, dan tanda hubung untuk admin", () => {
    expect(namaToko(daftar[1])).toBeNull();
    expect(teksToko(daftar[0])).toBe("Kopi Senja");
    expect(teksToko(daftar[1])).toBe("Belum punya toko");
    expect(teksToko(akun({ role: "admin", daftarTenant: [] }))).toBe("-");
  });

  it("status menyebut alasan non-aktif", () => {
    const beku = (alasanNonAktif: "manual" | "kedaluwarsa" | null) =>
      akun({ status: "non-aktif", langganan: { ...akun().langganan, alasanNonAktif } });
    expect(teksStatus(akun())).toBe("Aktif");
    expect(teksStatus(beku("kedaluwarsa"))).toBe("Non-aktif (kedaluwarsa)");
    expect(teksStatus(beku("manual"))).toBe("Non-aktif (dibekukan admin)");
    expect(teksStatus(beku(null))).toBe("Non-aktif");
  });

  it("masa akses: tanggal, tidak dibatasi, dan tanda hubung untuk admin", () => {
    const berakhir = "2026-12-31T16:59:59.999Z";
    const berbatas = akun({ langganan: { ...akun().langganan, aksesBerakhirPada: berakhir } });
    expect(teksMasaAkses(berbatas)).toBe(formatTanggalPendek(berakhir));
    expect(teksMasaAkses(akun())).toBe("Tidak dibatasi");
    expect(teksMasaAkses(akun({ role: "admin" }))).toBe("-");
  });
});