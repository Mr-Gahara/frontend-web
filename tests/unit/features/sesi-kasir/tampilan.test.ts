import { describe, expect, it } from "vitest";
import {
  NAMA_MESIN_DILEPAS,
  NAMA_MESIN_TANPA_DAFTAR,
  NAMA_PERANGKAT_KOSONG,
  gabungNama,
  kelompokkanPerHari,
  labelLaci,
  labelSelisih,
  lamaBuka,
  namaMesin,
  orangSesi,
  pilihanLaci,
  pilihanPerangkat,
  rentangJam,
  teksPerangkat,
  teksTerakhirDipakai,
  waktuRelatif,
} from "@/features/sesi-kasir/tampilan";
import { formatRupiah } from "@/lib/format";
import type { AkunKas } from "@/types/akunKas";
import type { PerangkatKasir, PerangkatPengguna } from "@/types/sesiKasir";

/** Waktu lokal sebagai ISO, agar test tidak bergantung zona waktu mesin. */
const lokal = (bulan: number, tanggal: number, jam: number, menit: number) =>
  new Date(2026, bulan - 1, tanggal, jam, menit).toISOString();

const SARI = { id: "u1", nama: "Sari" };
const RIDHO = { id: "u2", nama: "Ridho" };

const mesin = (installationId: string, namaPerangkat: string, akunKasID: string) =>
  ({ id: "m-" + installationId, installationId, namaPerangkat, akunKasID, akunKas: null }) as PerangkatKasir;

const akun = (id: string, namaAkun: string, nomorAkun: string, tipeAkun = "Kas Fisik", status = "aktif") =>
  ({ id, namaAkun, nomorAkun, tipeAkun, status }) as AkunKas;

const perangkat = (
  installationId: string,
  pengguna: { id: string; nama: string },
  status: PerangkatPengguna["status"],
  lastSeenAt: string | null,
  deviceName: string | null = "Galaxy Tab A9",
) =>
  ({
    id: "d-" + installationId + pengguna.id,
    installationId,
    pengguna: { ...pengguna, status: "aktif" },
    status,
    lastSeenAt,
    deviceName,
  }) as PerangkatPengguna;

describe("labelSelisih", () => {
  it("pas, lebih, kurang, dan belum ada hitungan", () => {
    expect(labelSelisih(0)).toEqual({ teks: "Pas", nada: "pas" });
    expect(labelSelisih(5000)).toEqual({ teks: `Lebih ${formatRupiah(5000)}`, nada: "lebih" });
    expect(labelSelisih(-12000)).toEqual({ teks: `Kurang ${formatRupiah(12000)}`, nada: "kurang" });
    expect(labelSelisih(null)).toEqual({ teks: "-", nada: "kosong" });
  });
});

describe("waktu sesi", () => {
  it("rentang jam di hari yang sama, lintas tengah malam, dan belum ditutup", () => {
    expect(rentangJam({ dibukaPada: lokal(11, 5, 8, 5), ditutupPada: lokal(11, 5, 21, 48) })).toBe(
      "08.05 sampai 21.48",
    );
    expect(rentangJam({ dibukaPada: lokal(11, 6, 22, 10), ditutupPada: lokal(11, 7, 2, 15) })).toBe(
      "22.10 sampai 02.15 (7 Nov)",
    );
    expect(rentangJam({ dibukaPada: lokal(11, 6, 8, 12), ditutupPada: null })).toBe(
      "08.12 sampai sekarang",
    );
  });

  it("lama buka dalam jam dan menit", () => {
    const buka = lokal(11, 6, 8, 12);
    expect(lamaBuka(buka, new Date(2026, 10, 6, 13, 53))).toBe("5 jam 41 menit");
    expect(lamaBuka(buka, new Date(2026, 10, 6, 8, 57))).toBe("45 menit");
    expect(lamaBuka(buka, new Date(2026, 10, 6, 10, 12))).toBe("2 jam");
    expect(lamaBuka(buka, new Date(2026, 10, 6, 8, 12, 30))).toBe("kurang dari 1 menit");
  });

  it("waktu relatif: hari ini, kemarin, dan tanggal untuk hari yang lebih lama", () => {
    const sekarang = new Date(2026, 10, 6, 14, 0);
    expect(waktuRelatif(lokal(11, 6, 8, 10), sekarang)).toBe("hari ini 08.10");
    expect(waktuRelatif(lokal(11, 5, 22, 5), sekarang)).toBe("kemarin 22.05");
    expect(waktuRelatif(lokal(11, 2, 9, 0), sekarang)).toBe("2 Nov 2026");
  });

  it("kemarin dihitung dari tanggal lokal, juga tepat setelah tengah malam", () => {
    expect(waktuRelatif(lokal(11, 5, 23, 50), new Date(2026, 10, 6, 0, 5))).toBe("kemarin 23.50");
  });
});

describe("kelompokkanPerHari", () => {
  it("per tanggal lokal waktu buka, urutan masukan dipertahankan", () => {
    const daftar = [
      { id: "a", dibukaPada: lokal(11, 6, 0, 30) },
      { id: "b", dibukaPada: lokal(11, 5, 10, 30) },
      { id: "c", dibukaPada: lokal(11, 5, 8, 5) },
      { id: "d", dibukaPada: lokal(11, 4, 10, 15) },
    ];
    const kelompok = kelompokkanPerHari(daftar);
    expect(kelompok.map((k) => k.judul)).toEqual([
      "Jumat, 6 November 2026",
      "Kamis, 5 November 2026",
      "Rabu, 4 November 2026",
    ]);
    expect(kelompok[1].judulPendek).toBe("Kamis, 5 Nov 2026");
    expect(kelompok.map((k) => k.sesi.map((s) => s.id))).toEqual([["a"], ["b", "c"], ["d"]]);
  });
});

describe("nama dan orang", () => {
  it("gabungNama berbahasa Indonesia", () => {
    expect(gabungNama([])).toBe("-");
    expect(gabungNama(["Sari"])).toBe("Sari");
    expect(gabungNama(["Sari", "Ridho"])).toBe("Sari dan Ridho");
    expect(gabungNama(["Sari", "Ridho", "Budi"])).toBe("Sari, Ridho, dan Budi");
  });

  it("orang sesi: penutup ditulis hanya bila berbeda dari pembuka", () => {
    expect(orangSesi({ dibukaOleh: SARI, ditutupOleh: SARI })).toBe("Sari");
    expect(orangSesi({ dibukaOleh: SARI, ditutupOleh: null })).toBe("Sari");
    expect(orangSesi({ dibukaOleh: SARI, ditutupOleh: RIDHO })).toBe("Sari, ditutup Ridho");
  });

  it("nama mesin: terdaftar, sudah dilepas, dan tanpa daftar mesin", () => {
    const daftar = [mesin("i1", "Kasir Depan", "k1")];
    expect(namaMesin("i1", daftar)).toBe("Kasir Depan");
    expect(namaMesin("i9", daftar)).toBe(NAMA_MESIN_DILEPAS);
    expect(namaMesin("i1", undefined)).toBe(NAMA_MESIN_TANPA_DAFTAR);
  });

  it("terakhir dipakai dari sesi terbaru", () => {
    const sekarang = new Date(2026, 10, 6, 14, 0);
    expect(teksTerakhirDipakai(null, sekarang)).toBe("Belum pernah dipakai");
    expect(
      teksTerakhirDipakai(
        { status: "BUKA", dibukaPada: lokal(11, 6, 8, 12), ditutupPada: null, dibukaOleh: SARI, ditutupOleh: null },
        sekarang,
      ),
    ).toBe("Dibuka hari ini 08.12 oleh Sari");
    expect(
      teksTerakhirDipakai(
        {
          status: "TUTUP",
          dibukaPada: lokal(11, 5, 10, 30),
          ditutupPada: lokal(11, 5, 22, 5),
          dibukaOleh: RIDHO,
          ditutupOleh: RIDHO,
        },
        sekarang,
      ),
    ).toBe("Ditutup kemarin 22.05 oleh Ridho");
  });
});

describe("laci", () => {
  const daftarAkun = [
    akun("k1", "kasir outlet", "KAS-002"),
    akun("k2", "Kas Kecil (Laci)", "CASH-001"),
    akun("k3", "BCA", "123", "Rekening Bank"),
    akun("k4", "kas lama", "KAS-009", "Kas Fisik", "non-aktif"),
    akun("k5", "kas tanpa nomor", ""),
  ];
  const daftarMesin = [mesin("i1", "Kasir Depan", "k1")];

  it("label laci memakai nomor dari daftar akun kas, atau namaAkun respons bila tidak ada", () => {
    expect(labelLaci({ akunKasID: "k1", akunKas: { id: "k1", namaAkun: "kasir outlet" } }, daftarAkun)).toBe(
      "kasir outlet (KAS-002)",
    );
    expect(labelLaci({ akunKasID: "k1", akunKas: { id: "k1", namaAkun: "kasir outlet" } }, undefined)).toBe(
      "kasir outlet",
    );
  });

  it("hanya Kas Fisik aktif; laci mesin lain ditandai, laci mesin sendiri tidak", () => {
    expect(pilihanLaci(daftarAkun, daftarMesin)).toEqual([
      { id: "k1", label: "kasir outlet (KAS-002)", dipakaiOleh: "Kasir Depan" },
      { id: "k2", label: "Kas Kecil (Laci) (CASH-001)", dipakaiOleh: null },
      { id: "k5", label: "kas tanpa nomor", dipakaiOleh: null },
    ]);
    expect(pilihanLaci(daftarAkun, daftarMesin, "i1")[0].dipakaiOleh).toBeNull();
  });
});

describe("pilihanPerangkat", () => {
  const sekarang = new Date(2026, 10, 6, 14, 0);

  it("digabung per installationId, hanya trusted, terbaru di atas, dan menandai mesin kasir", () => {
    const hasil = pilihanPerangkat(
      [
        perangkat("tab", SARI, "trusted", lokal(11, 6, 8, 10)),
        perangkat("tab", RIDHO, "trusted", lokal(11, 5, 21, 0)),
        perangkat("redmi", SARI, "trusted", lokal(11, 2, 9, 0), null),
        perangkat("oppo", SARI, "pending", lokal(11, 6, 9, 0)),
        perangkat("vivo", RIDHO, "revoked", lokal(10, 20, 9, 0)),
        perangkat("bar", RIDHO, "trusted", lokal(11, 5, 22, 0), "Oppo A58"),
      ],
      [mesin("bar", "Kasir Bar", "k2")],
    );
    expect(hasil.map((p) => p.installationId)).toEqual(["tab", "bar", "redmi"]);
    expect(hasil[0]).toMatchObject({ nama: "Galaxy Tab A9", pemakai: ["Sari", "Ridho"], sudahMesin: null });
    expect(hasil[1].sudahMesin).toBe("Kasir Bar");
    expect(hasil[2].nama).toBe(NAMA_PERANGKAT_KOSONG);
  });

  it("keterangan perangkat untuk form tambah mesin kasir", () => {
    const [tab, bar, redmi] = pilihanPerangkat(
      [
        perangkat("tab", SARI, "trusted", lokal(11, 6, 8, 10)),
        perangkat("tab", RIDHO, "trusted", lokal(11, 5, 21, 0)),
        perangkat("bar", RIDHO, "trusted", lokal(11, 5, 22, 0)),
        perangkat("redmi", SARI, "trusted", null),
      ],
      [mesin("bar", "Kasir Bar", "k2")],
    );
    expect(teksPerangkat(tab, sekarang)).toBe("Terakhir aktif hari ini 08.10, oleh Sari dan Ridho");
    expect(teksPerangkat(bar, sekarang)).toBe("Sudah jadi mesin kasir: Kasir Bar");
    expect(teksPerangkat(redmi, sekarang)).toBe("Belum pernah aktif, oleh Sari");
  });
});