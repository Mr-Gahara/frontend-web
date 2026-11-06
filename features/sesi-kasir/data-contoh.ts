/**
 * Data contoh untuk pratinjau development Mesin Kasir (pemilik proyek,
 * 6 November 2026: tampilan dulu, penyambungan backend menyusul). Waktunya
 * relatif terhadap sekarang agar riwayat selalu tampak terkini. Tidak boleh
 * diimpor halaman produksi.
 */

import type { AkunKas } from "@/types/akunKas";
import type { PerangkatKasir, PerangkatPengguna, SesiKasir } from "@/types/sesiKasir";

const SARI = { id: "contoh-sari", nama: "Sari" };
const RIDHO = { id: "contoh-ridho", nama: "Ridho" };

export interface DataContohMesinKasir {
  akunKas: AkunKas[];
  mesin: PerangkatKasir[];
  perangkat: PerangkatPengguna[];
  sesi: SesiKasir[];
  /** Saldo sistem laci sesi yang sedang buka, untuk simulasi catatan wajib. */
  saldoSistemTutup: number;
}

export function buatDataContoh(sekarang: Date): DataContohMesinKasir {
  const pada = (hariMundur: number, jam: number, menit: number) => {
    const t = new Date(sekarang);
    t.setDate(t.getDate() - hariMundur);
    t.setHours(jam, menit, 0, 0);
    return t.toISOString();
  };

  const akun = (id: string, namaAkun: string, nomorAkun: string) =>
    ({ id, namaAkun, nomorAkun, tipeAkun: "Kas Fisik", status: "aktif", saldo: 0 }) as unknown as AkunKas;
  const akunKas = [
    akun("contoh-k1", "Kas Kecil (Laci)", "CASH-001"),
    akun("contoh-k2", "kasir outlet", "KAS-002"),
    akun("contoh-k3", "kas kasir", "KAS-001"),
    akun("contoh-k4", "kas cadangan", "KAS-003"),
  ];

  const mesinContoh = (installationId: string, namaPerangkat: string, akunKasID: string): PerangkatKasir => ({
    id: "contoh-m-" + installationId,
    tenantID: null,
    installationId,
    namaPerangkat,
    akunKasID,
    akunKas: { id: akunKasID, namaAkun: akunKas.find((a) => a.id === akunKasID)?.namaAkun ?? "-" },
    createdAt: pada(30, 9, 0),
    updatedAt: pada(30, 9, 0),
  });
  const mesin = [
    mesinContoh("contoh-tab-a9", "Kasir Depan", "contoh-k2"),
    mesinContoh("contoh-oppo", "Kasir Bar", "contoh-k1"),
    mesinContoh("contoh-lenovo", "Tablet Cadangan", "contoh-k3"),
  ];

  const alat = (
    installationId: string,
    pengguna: { id: string; nama: string },
    status: PerangkatPengguna["status"],
    deviceName: string,
    lastSeenAt: string | null,
  ): PerangkatPengguna => ({
    id: "contoh-d-" + installationId + pengguna.id,
    penggunaID: pengguna.id,
    pengguna: { ...pengguna, status: "aktif" },
    installationId,
    status,
    deviceName,
    isPrimary: false,
    platform: "android",
    lastSeenAt,
  });
  const perangkat = [
    alat("contoh-tab-a9", SARI, "trusted", "Samsung Galaxy Tab A9", pada(0, 8, 10)),
    alat("contoh-tab-a9", RIDHO, "trusted", "Samsung Galaxy Tab A9", pada(1, 21, 0)),
    alat("contoh-redmi", SARI, "trusted", "Redmi Note 12", pada(4, 9, 0)),
    alat("contoh-a15", RIDHO, "trusted", "Samsung Galaxy A15", null),
    alat("contoh-oppo", RIDHO, "trusted", "Oppo A58", pada(1, 22, 0)),
    alat("contoh-vivo", SARI, "pending", "Vivo Y21", pada(0, 9, 0)),
  ];

  let urut = 0;
  const sesiContoh = (o: {
    installationId: string;
    akunKasID: string;
    buka: string;
    tutup: string | null;
    pembuka: { id: string; nama: string };
    penutup?: { id: string; nama: string };
    nominalBuka: number;
    selisihBuka: number;
    nominalTutup?: number;
    selisihTutup?: number;
    catatanTutup?: string;
  }): SesiKasir => {
    urut += 1;
    const ditutup = o.tutup !== null;
    return {
      id: `contoh-sesi-${urut}`,
      tenantID: null,
      installationId: o.installationId,
      akunKasID: o.akunKasID,
      akunKas: { id: o.akunKasID, namaAkun: akunKas.find((a) => a.id === o.akunKasID)?.namaAkun ?? "-" },
      locationID: null,
      status: ditutup ? "TUTUP" : "BUKA",
      dibukaOleh: o.pembuka,
      dibukaPada: o.buka,
      ditutupOleh: ditutup ? (o.penutup ?? o.pembuka) : null,
      ditutupPada: o.tutup,
      saldoSistemBuka: o.nominalBuka - o.selisihBuka,
      nominalBuka: o.nominalBuka,
      selisihBuka: o.selisihBuka,
      catatanBuka: o.selisihBuka ? "Uang receh tambahan dari kas kecil" : null,
      saldoSistemTutup: ditutup ? (o.nominalTutup ?? 0) - (o.selisihTutup ?? 0) : null,
      nominalTutup: ditutup ? (o.nominalTutup ?? 0) : null,
      selisihTutup: ditutup ? (o.selisihTutup ?? 0) : null,
      catatanTutup: o.catatanTutup ?? null,
      createdAt: o.buka,
      updatedAt: o.tutup ?? o.buka,
    };
  };

  const sesi = [
    sesiContoh({ installationId: "contoh-tab-a9", akunKasID: "contoh-k2", buka: pada(0, 8, 12), tutup: null, pembuka: SARI, nominalBuka: 200000, selisihBuka: 0 }),
    sesiContoh({ installationId: "contoh-oppo", akunKasID: "contoh-k1", buka: pada(1, 10, 30), tutup: pada(1, 22, 5), pembuka: RIDHO, nominalBuka: 150000, selisihBuka: 5000, nominalTutup: 610000, selisihTutup: 0 }),
    sesiContoh({ installationId: "contoh-tab-a9", akunKasID: "contoh-k2", buka: pada(1, 8, 5), tutup: pada(1, 21, 48), pembuka: SARI, nominalBuka: 200000, selisihBuka: 0, nominalTutup: 1432000, selisihTutup: -12000, catatanTutup: "Kembalian ke pelanggan terlewat dicatat" }),
    sesiContoh({ installationId: "contoh-hp-lama", akunKasID: "contoh-k3", buka: pada(2, 10, 15), tutup: pada(2, 22, 10), pembuka: RIDHO, nominalBuka: 100000, selisihBuka: 0, nominalTutup: 402000, selisihTutup: 2000, catatanTutup: "Ada uang pas dari pelanggan tanpa struk" }),
    sesiContoh({ installationId: "contoh-tab-a9", akunKasID: "contoh-k2", buka: pada(2, 8, 2), tutup: pada(2, 21, 40), pembuka: SARI, penutup: RIDHO, nominalBuka: 200000, selisihBuka: 0, nominalTutup: 1120500, selisihTutup: 0 }),
    sesiContoh({ installationId: "contoh-oppo", akunKasID: "contoh-k1", buka: pada(3, 10, 20), tutup: pada(3, 22, 0), pembuka: RIDHO, nominalBuka: 150000, selisihBuka: 0, nominalTutup: 575000, selisihTutup: 0 }),
    sesiContoh({ installationId: "contoh-oppo", akunKasID: "contoh-k1", buka: pada(4, 22, 10), tutup: pada(3, 2, 15), pembuka: RIDHO, nominalBuka: 150000, selisihBuka: 0, nominalTutup: 318000, selisihTutup: 0 }),
  ];

  return { akunKas, mesin, perangkat, sesi, saldoSistemTutup: 1284000 };
}