import { describe, expect, it } from "vitest";
import {
  IZIN_PEMBELIAN_STOK,
  IZIN_PEMBELIAN_STOK_RUANG,
  aksiPembelianStok,
} from "@/features/pembelian-stok/izin";
import {
  FILTER_AWAL_PEMBELIAN,
  adaFilterPembelian,
  barisBarangKosong,
  filterServerPembelian,
  isianAwalCatat,
  isianAwalUbah,
  paramDaftarPembelian,
  payloadBuatPembelian,
  payloadUbahPembelian,
  subtotalBaris,
  totalIsian,
} from "@/features/pembelian-stok/payload";
import {
  angkaDariTeks,
  buatSkemaCatatPembelian,
  buatSkemaUbahPembelian,
  hargaDariTeks,
} from "@/features/pembelian-stok/schema";
import type { PembelianStok } from "@/types/pembelianStok";

const HARI_INI = "2026-10-25";
const isian = {
  supplier: "  CV Manis  ",
  nomorFaktur: "",
  akunKasID: "akun-a",
  tanggal: HARI_INI,
  keterangan: "  Belanja mingguan  ",
  items: [
    { bahanBakuID: "gula", jumlah: "10", hargaBeli: "15000" },
    { bahanBakuID: "susu", jumlah: "1,5", hargaBeli: "0" },
  ],
};

const pembelian: PembelianStok = {
  id: "beli-1",
  tanggal: "2026-10-24T05:00:00.000Z",
  akunKasID: { id: "akun-a", namaAkun: "Kas Kecil (Laci)", nomorAkun: "CASH-001" },
  supplier: "CV Manis",
  keterangan: "Belanja mingguan",
  items: [
    { bahanBakuID: { id: "gula", namaBahan: "Gula Pasir", satuan: "kg" }, jumlah: 20, hargaBeli: 15000, subtotal: 300000 },
  ],
  totalBiaya: 300000,
  locationID: "lok-outlet",
  nomorFaktur: "INV/20261024/101532118",
  dicatatOleh: { id: "peng-1", nama: "Budi" },
  stokDitambahkan: true,
  tenantID: "tenant-1",
  createdAt: "2026-10-24T05:00:00.000Z",
  updatedAt: "2026-10-24T05:00:00.000Z",
};

describe("angkaDariTeks dan hargaDariTeks", () => {
  it("membaca bilangan dan desimal berkoma atau bertitik", () => {
    expect(angkaDariTeks("10")).toBe(10);
    expect(angkaDariTeks(" 1,5 ")).toBe(1.5);
    expect(angkaDariTeks("2.25")).toBe(2.25);
  });

  it("memberi NaN untuk teks yang bukan angka tidak negatif", () => {
    for (const teks of ["", "abc", "-1", "1.2.3", "1,"]) {
      expect(angkaDariTeks(teks), teks).toBeNaN();
    }
  });

  it("harga hanya menerima bilangan bulat tidak negatif", () => {
    expect(hargaDariTeks(" 15000 ")).toBe(15000);
    expect(hargaDariTeks("0")).toBe(0);
    for (const teks of ["", "1500.5", "1,5", "-1", "abc"]) {
      expect(hargaDariTeks(teks), teks).toBeNaN();
    }
  });
});

describe("buatSkemaCatatPembelian", () => {
  const skema = buatSkemaCatatPembelian(HARI_INI);
  const denganBarang = (ubah: Partial<(typeof isian.items)[number]>) => ({
    ...isian,
    items: [{ ...isian.items[0], ...ubah }],
  });

  it("menerima isian sah", () => {
    expect(skema.safeParse(isian).success).toBe(true);
  });

  it("menerima jumlah desimal minimal 1 dan menolak di bawahnya atau bukan angka", () => {
    for (const jumlah of ["1", "1,5", "2.75"]) {
      expect(skema.safeParse(denganBarang({ jumlah })).success, jumlah).toBe(true);
    }
    for (const jumlah of ["0.5", "0", "", "abc", "-2"]) {
      expect(skema.safeParse(denganBarang({ jumlah })).success, jumlah).toBe(false);
    }
  });

  it("menerima harga 0 dan menolak harga pecahan, negatif, atau kosong", () => {
    expect(skema.safeParse(denganBarang({ hargaBeli: "0" })).success).toBe(true);
    for (const hargaBeli of ["1500.5", "1,5", "-1", ""]) {
      expect(skema.safeParse(denganBarang({ hargaBeli })).success, hargaBeli).toBe(false);
    }
  });

  it("menolak bahan yang sama di baris kedua, di baris itu", () => {
    const hasil = skema.safeParse({
      ...isian,
      items: [isian.items[0], { ...isian.items[1], bahanBakuID: "gula" }],
    });
    expect(hasil.success).toBe(false);
    const jalur = hasil.error?.issues.map((i) => i.path.join("."));
    expect(jalur).toEqual(["items.1.bahanBakuID"]);
  });

  it("menolak tanpa barang, tanpa akun kas, serta supplier dan keterangan berisi spasi", () => {
    expect(skema.safeParse({ ...isian, items: [] }).success).toBe(false);
    expect(skema.safeParse({ ...isian, akunKasID: "" }).success).toBe(false);
    expect(skema.safeParse({ ...isian, supplier: "   " }).success).toBe(false);
    expect(skema.safeParse({ ...isian, keterangan: "   " }).success).toBe(false);
  });

  it("menolak tanggal sesudah hari ini dan tanggal kosong", () => {
    expect(skema.safeParse({ ...isian, tanggal: "2026-10-26" }).success).toBe(false);
    expect(skema.safeParse({ ...isian, tanggal: "" }).success).toBe(false);
    expect(skema.safeParse({ ...isian, tanggal: "2026-10-01" }).success).toBe(true);
  });
});

describe("buatSkemaUbahPembelian", () => {
  const skema = buatSkemaUbahPembelian(HARI_INI);
  const sah = { supplier: "CV Manis", nomorFaktur: "FK-1", tanggal: HARI_INI, keterangan: "Belanja" };

  it("menerima isian sah dan menolak nomor faktur yang dikosongkan", () => {
    expect(skema.safeParse(sah).success).toBe(true);
    expect(skema.safeParse({ ...sah, nomorFaktur: "  " }).success).toBe(false);
  });
});

describe("isianAwalCatat, subtotalBaris, dan totalIsian", () => {
  it("dimulai dengan satu baris kosong dan tanggal hari ini", () => {
    expect(isianAwalCatat(HARI_INI)).toEqual({
      supplier: "",
      nomorFaktur: "",
      akunKasID: "",
      tanggal: HARI_INI,
      keterangan: "",
      items: [barisBarangKosong()],
    });
  });

  it("menghitung subtotal baris sah, dan null selama belum sah", () => {
    expect(subtotalBaris(isian.items[0])).toBe(150000);
    expect(subtotalBaris({ bahanBakuID: "x", jumlah: "1,5", hargaBeli: "20000" })).toBe(30000);
    expect(subtotalBaris(barisBarangKosong())).toBeNull();
  });

  it("menjumlahkan baris sah saja", () => {
    expect(totalIsian([...isian.items, barisBarangKosong()])).toBe(150000);
  });
});

describe("payloadBuatPembelian", () => {
  it("peran lain: tanpa tanggal, tanpa nomor faktur kosong, isian dipangkas", () => {
    expect(payloadBuatPembelian(isian, "lok-outlet", false, HARI_INI)).toEqual({
      akunKasID: "akun-a",
      supplier: "CV Manis",
      keterangan: "Belanja mingguan",
      locationID: "lok-outlet",
      items: [
        { bahanBakuID: "gula", jumlah: 10, hargaBeli: 15000 },
        { bahanBakuID: "susu", jumlah: 1.5, hargaBeli: 0 },
      ],
    });
  });

  it("tanggal lampau hanya dikirim Owner, dan hari ini tidak dikirim siapa pun", () => {
    const lampau = { ...isian, tanggal: "2026-10-20" };
    expect(payloadBuatPembelian(lampau, "lok", true, HARI_INI).tanggal).toBe("2026-10-20");
    expect(payloadBuatPembelian(lampau, "lok", false, HARI_INI)).not.toHaveProperty("tanggal");
    expect(payloadBuatPembelian(isian, "lok", true, HARI_INI)).not.toHaveProperty("tanggal");
  });

  it("nomor faktur yang diisi dikirim terpangkas", () => {
    const hasil = payloadBuatPembelian({ ...isian, nomorFaktur: " FK-0917 " }, "lok", false, HARI_INI);
    expect(hasil.nomorFaktur).toBe("FK-0917");
  });
});

describe("isianAwalUbah dan payloadUbahPembelian", () => {
  it("nilai awal diambil dari data server, dengan tanggal hari lokal", () => {
    expect(isianAwalUbah(pembelian)).toEqual({
      supplier: "CV Manis",
      nomorFaktur: "INV/20261024/101532118",
      tanggal: "2026-10-24",
      keterangan: "Belanja mingguan",
    });
  });

  it("tanpa perubahan memberi objek kosong; spasi di tepi bukan perubahan", () => {
    const awal = isianAwalUbah(pembelian);
    expect(payloadUbahPembelian(pembelian, awal, true)).toEqual({});
    expect(payloadUbahPembelian(pembelian, { ...awal, supplier: " CV Manis " }, true)).toEqual({});
  });

  it("hanya field yang berubah yang dikirim", () => {
    const awal = isianAwalUbah(pembelian);
    expect(
      payloadUbahPembelian(pembelian, { ...awal, supplier: "CV Manis Jaya", nomorFaktur: "FK-1" }, false),
    ).toEqual({ supplier: "CV Manis Jaya", nomorFaktur: "FK-1" });
  });

  it("tanggal yang berubah hanya dikirim Owner", () => {
    const ubah = { ...isianAwalUbah(pembelian), tanggal: "2026-10-20" };
    expect(payloadUbahPembelian(pembelian, ubah, true)).toEqual({ tanggal: "2026-10-20" });
    expect(payloadUbahPembelian(pembelian, ubah, false)).toEqual({});
  });
});

describe("filterServerPembelian, paramDaftarPembelian, dan adaFilterPembelian", () => {
  it("filter kosong hanya mengirim lokasi bila ada", () => {
    expect(filterServerPembelian(FILTER_AWAL_PEMBELIAN, "lok-gudang")).toEqual({ locationID: "lok-gudang" });
    expect(filterServerPembelian(FILTER_AWAL_PEMBELIAN, null)).toEqual({});
  });

  it("mengirim seluruh filter yang diisi, periode sebagai YYYY-MM-DD", () => {
    const filter = {
      akunKasID: "akun-a",
      bahanBakuID: "gula",
      supplier: "  manis ",
      dari: new Date(2026, 9, 1),
      sampai: new Date(2026, 9, 31),
    };
    expect(filterServerPembelian(filter, "lok-outlet")).toEqual({
      locationID: "lok-outlet",
      akunKasID: "akun-a",
      bahanBakuID: "gula",
      supplier: "manis",
      dari: "2026-10-01",
      sampai: "2026-10-31",
    });
  });

  it("supplier dibatasi 100 karakter, dan supplier berisi spasi tidak dikirim", () => {
    const panjang = filterServerPembelian({ ...FILTER_AWAL_PEMBELIAN, supplier: "a".repeat(120) }, null);
    expect(panjang.supplier).toHaveLength(100);
    expect(filterServerPembelian({ ...FILTER_AWAL_PEMBELIAN, supplier: "   " }, null)).toEqual({});
  });

  it("menambahkan page dan limit sebagai teks", () => {
    expect(paramDaftarPembelian(FILTER_AWAL_PEMBELIAN, "lok", 2, 20)).toEqual({
      locationID: "lok",
      page: "2",
      limit: "20",
    });
  });

  it("lokasi bukan filter pengguna", () => {
    expect(adaFilterPembelian(FILTER_AWAL_PEMBELIAN)).toBe(false);
    expect(adaFilterPembelian({ ...FILTER_AWAL_PEMBELIAN, supplier: "  " })).toBe(false);
    expect(adaFilterPembelian({ ...FILTER_AWAL_PEMBELIAN, akunKasID: "akun-a" })).toBe(true);
  });
});

describe("aksiPembelianStok", () => {
  const SEMUA = { baca: true, buat: true, ubah: true, hapus: true };

  it("nama izin umum dan per ruang sama dengan seed dan route backend (B74, B116)", () => {
    expect(IZIN_PEMBELIAN_STOK).toEqual({
      baca: "read-pembelian-stok",
      buat: "create-pembelian-stok",
      ubah: "update-pembelian-stok",
      hapus: "delete-pembelian-stok",
    });
    expect(IZIN_PEMBELIAN_STOK_RUANG).toEqual({
      outlet: {
        baca: "read-pembelian-stok-outlet",
        buat: "create-pembelian-stok-outlet",
        ubah: "update-pembelian-stok-outlet",
        hapus: "delete-pembelian-stok-outlet",
      },
      gudang: {
        baca: "read-pembelian-stok-gudang",
        buat: "create-pembelian-stok-gudang",
        ubah: "update-pembelian-stok-gudang",
        hapus: "delete-pembelian-stok-gudang",
      },
    });
  });

  it("izin umum membuka setiap aksi di kedua ruang", () => {
    const umum = Object.values(IZIN_PEMBELIAN_STOK);
    expect(aksiPembelianStok(umum, "outlet")).toEqual(SEMUA);
    expect(aksiPembelianStok(umum, "gudang")).toEqual(SEMUA);
  });

  it("izin ruang hanya membuka ruangnya", () => {
    const izin = ["read-pembelian-stok-gudang", "create-pembelian-stok-outlet"];
    expect(aksiPembelianStok(izin, "gudang")).toEqual({ baca: true, buat: false, ubah: false, hapus: false });
    expect(aksiPembelianStok(izin, "outlet")).toEqual({ baca: false, buat: true, ubah: false, hapus: false });
  });

  it("seluruh izin satu ruang tidak membuka ruang lain", () => {
    const outlet = Object.values(IZIN_PEMBELIAN_STOK_RUANG.outlet);
    expect(aksiPembelianStok(outlet, "outlet")).toEqual(SEMUA);
    expect(aksiPembelianStok(outlet, "gudang")).toEqual({ baca: false, buat: false, ubah: false, hapus: false });
  });

  it("aksi mengikuti izin yang dipegang", () => {
    expect(aksiPembelianStok(["read-pembelian-stok", "create-pembelian-stok"], "outlet")).toEqual({
      baca: true,
      buat: true,
      ubah: false,
      hapus: false,
    });
  });
});