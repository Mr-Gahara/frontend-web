"use client";

import type { AkunKas } from "@/types/akunKas";
import type { PerangkatKasir, SesiKasir } from "@/types/sesiKasir";
import { BagianKasirBuka, type StatusMuat } from "./bagian-kasir-buka";
import { MulaiMesinKasir, PanelMesinKasir } from "./panel-mesin-kasir";
import { RiwayatSesi } from "./riwayat-sesi";

export interface PropsSusunanMesinKasir {
  sekarang: Date;
  /** Pemegang kelola-perangkat-kasir: panel mesin kasir dan tombol tutup dari web tampil. */
  bolehKelola: boolean;
  /**
   * Toko belum punya satu sesi pun (GET /sesikasir?limit=1 tanpa filter,
   * total 0). Pesan pemakaian pertama di riwayat hanya tampil bila true, agar
   * riwayat mesin yang sudah dilepas semua tidak disembunyikan (pemilik
   * proyek, 7 November 2026).
   */
  belumPernahAdaSesi: boolean;
  kasirBuka: { status: StatusMuat; sesi: SesiKasir[]; onCobaLagi: () => void };
  mesin: { status: StatusMuat; daftar: PerangkatKasir[]; onCobaLagi: () => void };
  akunKas: AkunKas[] | undefined;
  sesiTerakhir: Record<string, SesiKasir | null>;
  riwayat: {
    status: StatusMuat;
    sesi: SesiKasir[];
    filter: React.ReactNode;
    teksRentang: string;
    onResetFilter: () => void;
    onCobaLagi: () => void;
    adaBerikutnya: boolean;
    memuatBerikutnya: boolean;
    onMuatBerikutnya: () => void;
  };
  hrefRincian: (sesi: SesiKasir) => string;
  onTambah: () => void;
  onUbah: (mesin: PerangkatKasir) => void;
  onBerhenti: (mesin: PerangkatKasir) => void;
  onTutup: (sesi: SesiKasir) => void;
}

/**
 * Susunan halaman Mesin Kasir berbasis props, disambung ke hook oleh
 * HalamanMesinKasir. Tiga tingkat hierarki (Revisi 1):
 * kasir yang sedang buka, riwayat sebagai isi utama, lalu panel mesin
 * kasir di samping (di HP paling bawah). Saat belum ada mesin kasir,
 * langkah menambah naik ke paling atas (Revisi 2).
 */
export function SusunanMesinKasir({
  sekarang,
  bolehKelola,
  belumPernahAdaSesi,
  kasirBuka,
  mesin,
  akunKas,
  sesiTerakhir,
  riwayat,
  hrefRincian,
  onTambah,
  onUbah,
  onBerhenti,
  onTutup,
}: PropsSusunanMesinKasir) {
  const daftarMesin = bolehKelola && mesin.status === "siap" ? mesin.daftar : undefined;
  const pemakaianPertama = bolehKelola && mesin.status === "siap" && mesin.daftar.length === 0;

  return (
    <div className="flex flex-col gap-8">
      {pemakaianPertama ? (
        <MulaiMesinKasir onTambah={onTambah} />
      ) : (
        <BagianKasirBuka
          sesiBuka={kasirBuka.sesi}
          status={kasirBuka.status}
          daftarMesin={daftarMesin}
          sekarang={sekarang}
          bolehTutup={bolehKelola}
          onTutup={onTutup}
          hrefRincian={hrefRincian}
          onCobaLagi={kasirBuka.onCobaLagi}
        />
      )}

      <div className="flex flex-wrap items-start gap-8">
        <div className="min-w-0 flex-[999_1_480px]">
          <RiwayatSesi
            {...riwayat}
            daftarMesin={daftarMesin}
            hrefRincian={hrefRincian}
            pemakaianPertama={pemakaianPertama && belumPernahAdaSesi}
          />
        </div>
        {bolehKelola && !pemakaianPertama && (
          <aside className="min-w-0 flex-[1_1_340px]">
            <PanelMesinKasir
              status={mesin.status}
              mesin={mesin.daftar}
              akunKas={akunKas}
              sesiBuka={kasirBuka.sesi}
              sesiTerakhir={sesiTerakhir}
              sekarang={sekarang}
              onTambah={onTambah}
              onUbah={onUbah}
              onBerhenti={onBerhenti}
              onCobaLagi={mesin.onCobaLagi}
            />
          </aside>
        )}
      </div>
    </div>
  );
}