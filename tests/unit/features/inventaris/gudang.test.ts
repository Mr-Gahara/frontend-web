import { describe, expect, it } from "vitest";
import {
  tentukanAksesGudang,
  tujuanAksesGudang,
  type MasukanAksesGudang,
} from "@/features/inventaris/akses-gudang";
import {
  NILAI_AWAL_LOKASI,
  payloadBuatLokasi,
  skemaLokasi,
} from "@/features/inventaris/schema-lokasi";
import type { Lokasi } from "@/types/location";

const GUDANG = { id: "g1", tipe: "Gudang" } as Lokasi;
const OUTLET = { id: "o1", tipe: "Outlet" } as Lokasi;
const IZIN_PENUH = ["read-dashboard-gudang", "read-location", "create-location"];

const masukan = (ubah: Partial<MasukanAksesGudang> = {}): MasukanAksesGudang => ({
  sesiMemuat: false,
  sudahMasuk: true,
  permissions: IZIN_PENUH,
  diSetup: false,
  lokasi: { memuat: false, gagal: false, daftar: [OUTLET, GUDANG] },
  ...ubah,
});

describe("tentukanAksesGudang", () => {
  it("menunggu selama sesi dipulihkan", () => {
    expect(tentukanAksesGudang(masukan({ sesiMemuat: true, sudahMasuk: false }))).toBe("memuat");
  });

  it("mengalihkan pengguna yang belum masuk ke login", () => {
    const akses = tentukanAksesGudang(masukan({ sudahMasuk: false }));
    expect(akses).toBe("keluar");
    expect(tujuanAksesGudang(akses)).toBe("/login");
  });

  it("mengalihkan pengguna tanpa read-dashboard-gudang ke /dashboard", () => {
    const akses = tentukanAksesGudang(
      masukan({ permissions: ["read-location", "create-location"] }),
    );
    expect(akses).toBe("ditolak");
    expect(tujuanAksesGudang(akses)).toBe("/dashboard");
  });

  it("membuka ruang gudang tanpa pemeriksaan gudang bagi pengguna tanpa read-location", () => {
    const akses = tentukanAksesGudang(
      masukan({
        permissions: ["read-dashboard-gudang"],
        lokasi: { memuat: true, gagal: false, daftar: undefined },
      }),
    );
    expect(akses).toBe("izinkan");
    expect(tujuanAksesGudang(akses)).toBeNull();
  });

  it("menampilkan pesan di setup bagi pengguna tanpa read-location", () => {
    const akses = tentukanAksesGudang(
      masukan({ permissions: ["read-dashboard-gudang", "create-location"], diSetup: true }),
    );
    expect(akses).toBe("tanpa-izin-lokasi");
    expect(tujuanAksesGudang(akses)).toBeNull();
  });

  it("menampilkan pesan galat tanpa pengalihan saat lokasi gagal dimuat", () => {
    const akses = tentukanAksesGudang(
      masukan({ lokasi: { memuat: false, gagal: true, daftar: undefined } }),
    );
    expect(akses).toBe("gagal");
    expect(tujuanAksesGudang(akses)).toBeNull();
  });

  it("menunggu selama daftar lokasi dimuat", () => {
    expect(
      tentukanAksesGudang(masukan({ lokasi: { memuat: true, gagal: false, daftar: undefined } })),
    ).toBe("memuat");
  });

  it("mengizinkan ruang gudang dan mengalihkan setup ke dashboard bila gudang ada", () => {
    expect(tentukanAksesGudang(masukan())).toBe("izinkan");
    const akses = tentukanAksesGudang(masukan({ diSetup: true }));
    expect(akses).toBe("ke-dashboard");
    expect(tujuanAksesGudang(akses)).toBe("/dashboard/gudang");
  });

  it("mengarahkan pemegang create-location ke setup bila gudang belum ada", () => {
    const tanpaGudang = { memuat: false, gagal: false, daftar: [OUTLET] };
    const akses = tentukanAksesGudang(masukan({ lokasi: tanpaGudang }));
    expect(akses).toBe("setup");
    expect(tujuanAksesGudang(akses)).toBe("/dashboard/gudang/setup");
    expect(tentukanAksesGudang(masukan({ lokasi: tanpaGudang, diSetup: true }))).toBe("izinkan");
  });

  it("menampilkan pesan di mana pun bila gudang belum ada dan pengguna tanpa create-location", () => {
    const m = {
      permissions: ["read-dashboard-gudang", "read-location"],
      lokasi: { memuat: false, gagal: false, daftar: [OUTLET] },
    };
    expect(tentukanAksesGudang(masukan(m))).toBe("belum-ada");
    expect(tentukanAksesGudang(masukan({ ...m, diSetup: true }))).toBe("belum-ada");
    expect(tujuanAksesGudang("belum-ada")).toBeNull();
  });
});

const SAH = {
  nama: "Gudang Uji",
  alamat: "Jl. Uji No. 1",
  latitude: "-0.0393",
  longitude: "109.2747",
  radiusAbsen: "20",
};

const pesanPertama = (nilai: Record<string, string>) => {
  const hasil = skemaLokasi.safeParse(nilai);
  return hasil.success ? null : hasil.error.issues[0].message;
};

describe("skemaLokasi dan payloadBuatLokasi", () => {
  it("menerima isian sah dan menyusun payload dengan angka", () => {
    const nilai = skemaLokasi.parse({ ...SAH, nama: "  Gudang Uji  " });
    expect(payloadBuatLokasi(nilai, "Gudang")).toEqual({
      nama: "Gudang Uji",
      tipe: "Gudang",
      alamat: "Jl. Uji No. 1",
      radiusAbsen: 20,
      latitude: -0.0393,
      longitude: 109.2747,
    });
  });

  it("menolak koordinat bukan angka dengan satu pesan", () => {
    const hasil = skemaLokasi.safeParse({ ...SAH, latitude: "abc" });
    expect(hasil.success).toBe(false);
    if (!hasil.success) {
      expect(hasil.error.issues.map((i) => i.message)).toEqual([
        "Latitude harus berupa angka desimal.",
      ]);
    }
  });

  it("menolak koordinat kosong dan di luar rentang backend", () => {
    expect(pesanPertama({ ...SAH, longitude: "" })).toBe("Longitude wajib diisi.");
    expect(pesanPertama({ ...SAH, latitude: "91" })).toBe("Latitude harus di antara -90 dan 90.");
    expect(pesanPertama({ ...SAH, longitude: "-181" })).toBe(
      "Longitude harus di antara -180 dan 180.",
    );
  });

  it("menolak radius kosong, bukan angka, dan di luar 10 sampai 50 meter", () => {
    expect(pesanPertama({ ...SAH, radiusAbsen: "" })).toBe("Radius absen wajib diisi.");
    for (const radius of ["9", "51", "abc"]) {
      expect(pesanPertama({ ...SAH, radiusAbsen: radius })).toBe(
        "Radius absen harus di antara 10 dan 50 meter.",
      );
    }
    expect(pesanPertama({ ...SAH, radiusAbsen: "10" })).toBeNull();
    expect(pesanPertama({ ...SAH, radiusAbsen: "50" })).toBeNull();
  });

  it("menolak nama dan alamat berisi spasi saja", () => {
    expect(pesanPertama({ ...SAH, nama: "   " })).toBe("Nama lokasi wajib diisi.");
    expect(pesanPertama({ ...SAH, alamat: "   " })).toBe("Alamat wajib diisi.");
  });

  it("memulai form dengan koordinat kosong", () => {
    expect(NILAI_AWAL_LOKASI.latitude).toBe("");
    expect(NILAI_AWAL_LOKASI.longitude).toBe("");
  });
});