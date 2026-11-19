"use client";

import Link from "next/link";
import { PilFilterAktif, TombolFilter } from "@/components/filter/bilah-filter";
import { KelompokFilter, PanelFilter, PilihDaftar, PilihanPeriode } from "@/components/filter/panel-filter";
import { usePanelFilter } from "@/hooks/use-panel-filter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRupiah } from "@/lib/format";
import type { SesiKasir } from "@/types/sesiKasir";
import type { StatusMuat } from "./bagian-kasir-buka";
import { SEMUA_MESIN, jumlahFilterRiwayat, pilFilterRiwayat, type NilaiFilterRiwayat } from "./filter";
import { ChipSelisih } from "./label";
import { kelompokkanPerHari, labelSelisih, namaMesin, orangSesi, rentangJam } from "./tampilan";

export { SEMUA_MESIN, type NilaiFilterRiwayat } from "./filter";


/**
 * Filter riwayat dalam pola filter seragam (FL1a): tombol Filter lainnya
 * berlencana, pil aktif, dan panel samping berisi mesin kasir serta periode
 * dibuka. Pilihan mesin tidak tampil tanpa daftar mesin kasir.
 */
export function FilterRiwayat({
  nilai,
  onUbah,
  pilihanMesin,
  bawaan,
  hariIni,
}: {
  nilai: NilaiFilterRiwayat;
  onUbah: (nilai: NilaiFilterRiwayat) => void;
  pilihanMesin: { installationId: string; nama: string }[] | undefined;
  bawaan: NilaiFilterRiwayat;
  hariIni: Date;
}) {
  const panel = usePanelFilter({ terapan: nilai, bawaan, onTerapkan: onUbah });
  const namaMesin = (id: string) => pilihanMesin?.find((m) => m.installationId === id)?.nama;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <TombolFilter jumlahAktif={jumlahFilterRiwayat(nilai, bawaan)} onBuka={panel.buka} terbuka={panel.terbuka} />
      </div>
      <PilFilterAktif pil={pilFilterRiwayat(nilai, bawaan, namaMesin, hariIni, onUbah)} onAturUlangSemua={() => onUbah(bawaan)} />
      <PanelFilter
        terbuka={panel.terbuka}
        onTerbukaBerubah={panel.ubahTerbuka}
        jumlahAktif={jumlahFilterRiwayat(panel.draf, bawaan)}
        onTerapkan={panel.terapkan}
        onAturUlang={panel.aturUlang}
      >
        {pilihanMesin && (
          <KelompokFilter judul="Mesin kasir" htmlFor="filter-mesin-riwayat">
            <PilihDaftar
              id="filter-mesin-riwayat"
              nilai={panel.draf.mesin === SEMUA_MESIN ? "" : panel.draf.mesin}
              onUbah={(mesin) => panel.setDraf({ ...panel.draf, mesin: mesin || SEMUA_MESIN })}
              labelSemua="Semua mesin kasir"
              opsi={pilihanMesin.map((m) => ({ id: m.installationId, nama: m.nama }))}
            />
          </KelompokFilter>
        )}
        <KelompokFilter judul="Periode dibuka">
          <PilihanPeriode
            idAwalan="filter-riwayat"
            hariIni={hariIni}
            labelDari="Dibuka dari"
            labelSampai="Dibuka sampai"
            batasiUrutan
            rentang={{ dari: panel.draf.dari, sampai: panel.draf.sampai }}
            onUbah={({ dari, sampai }) => panel.setDraf({ ...panel.draf, dari, sampai })}
          />
        </KelompokFilter>
      </PanelFilter>
    </div>
  );
}

interface PropsRiwayatSesi {
  status: StatusMuat;
  /** Sesi yang sudah ditutup, terbaru di atas; sesi yang masih buka tampil di bagian atas halaman. */
  sesi: SesiKasir[];
  filter: React.ReactNode;
  /** Rentang tanggal terpilih, untuk pesan riwayat kosong. */
  teksRentang: string;
  onResetFilter: () => void;
  onCobaLagi: () => void;
  adaBerikutnya: boolean;
  memuatBerikutnya: boolean;
  onMuatBerikutnya: () => void;
  hrefRincian: (sesi: SesiKasir) => string;
  /** Belum ada mesin kasir sama sekali: pesan pemakaian pertama. */
  pemakaianPertama?: boolean;
}

/** Bentuk kolom mulai riwayat selebar 640 px; di bawahnya bertumpuk seperti di HP (pemilik proyek, 6 November 2026). */
const KOLOM_DESKTOP =
  "@[40rem]:grid @[40rem]:grid-cols-[minmax(0,1fr)_160px_120px_160px] @[40rem]:items-center @[40rem]:gap-3";

/**
 * Riwayat buka-tutup kasir dikelompokkan per hari, dengan data per baris
 * dari gaya B: mesin, orang, jam, uang akhir, dan selisih saat tutup
 * (pemilik proyek, 6 November 2026; pengecualian keputusan rancangan butir 26).
 */
export function RiwayatSesi({
  status,
  sesi,
  filter,
  teksRentang,
  onResetFilter,
  onCobaLagi,
  adaBerikutnya,
  memuatBerikutnya,
  onMuatBerikutnya,
  hrefRincian,
  pemakaianPertama,
}: PropsRiwayatSesi) {
  const kelompok = kelompokkanPerHari(sesi);

  return (
    <section aria-labelledby="judul-riwayat" className="@container flex flex-col gap-4">
      <div className="flex flex-col gap-3 @[40rem]:flex-row @[40rem]:flex-wrap @[40rem]:items-end @[40rem]:justify-between">
        <h2 id="judul-riwayat" className="text-subjudul font-bold text-navy">
          Riwayat buka-tutup kasir
        </h2>
        {!pemakaianPertama && filter}
      </div>

      {pemakaianPertama && (
        <div className="rounded-[14px] border border-navy/10 bg-white px-5 py-7 text-center text-isi text-navy/70">
          Riwayat tampil di sini setelah kasir pertama ditutup.
        </div>
      )}

      {!pemakaianPertama && status === "memuat" && (
        <div aria-label="Memuat riwayat" className="flex flex-col rounded-2xl border border-navy/10 bg-white">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-4 border-t border-navy/10 px-[18px] py-4 first:border-t-0">
              <Skeleton className="h-3.5 flex-1 bg-navy/10" />
              <Skeleton className="h-3.5 w-28 bg-navy/10" />
              <Skeleton className="h-5 w-20 rounded-full bg-navy/10" />
            </div>
          ))}
        </div>
      )}

      {!pemakaianPertama && status === "gagal" && (
        <div
          role="alert"
          className="flex flex-col items-center gap-2.5 rounded-2xl border border-navy/10 bg-white px-6 py-10 text-center"
        >
          <span className="text-subjudul font-bold text-navy">Riwayat gagal dimuat</span>
          <span className="text-isi text-navy/70">Periksa koneksi, lalu coba lagi.</span>
          <Button onClick={onCobaLagi} className="h-11 bg-navy px-5 font-semibold text-gading hover:bg-navy/90">
            Coba lagi
          </Button>
        </div>
      )}

      {!pemakaianPertama && status === "siap" && sesi.length === 0 && (
        <div className="flex flex-col items-center gap-2.5 rounded-2xl border border-navy/10 bg-white px-6 py-10 text-center">
          <span className="text-subjudul font-bold text-navy">Belum ada kasir yang ditutup pada {teksRentang}</span>
          <span className="text-isi text-navy/70">Coba pilih rentang tanggal lain.</span>
          <Button variant="outline" onClick={onResetFilter} className="h-11 border-navy/20 px-5 font-semibold text-navy">
            Reset Filter
          </Button>
        </div>
      )}

      {!pemakaianPertama && status === "siap" && sesi.length > 0 && (
        <>
          <div aria-hidden="true" className={`hidden px-[18px] text-kecil font-semibold text-navy/70 ${KOLOM_DESKTOP}`}>
            <span>Mesin kasir</span>
            <span>Jam buka sampai tutup</span>
            <span className="text-right">Uang akhir</span>
            <span className="text-right">Selisih saat tutup</span>
          </div>
          {kelompok.map((hari) => (
            <div key={hari.kunci} className="flex flex-col gap-2">
              <h3 className="px-1 text-besar font-bold text-navy">
                <span className="@[40rem]:hidden">{hari.judulPendek}</span>
                <span className="hidden @[40rem]:inline">{hari.judul}</span>
              </h3>
              <ul className="flex flex-col rounded-2xl border border-navy/10 bg-white">
                {hari.sesi.map((s) => {
                  const nama = namaMesin(s);
                  const selisih = labelSelisih(s.selisihTutup);
                  const akhir = s.nominalTutup === null ? "-" : formatRupiah(s.nominalTutup);
                  return (
                    <li key={s.id} className="border-t border-navy/10 first:border-t-0">
                      <Link
                        href={hrefRincian(s)}
                        className="block rounded-2xl px-4 py-3.5 text-navy hover:bg-krem/60 @[40rem]:px-[18px]"
                      >
                        <div className="flex flex-col gap-1.5 @[40rem]:hidden">
                          <div className="flex items-center justify-between gap-2.5">
                            <span className="min-w-0 break-words font-bold">{nama}</span>
                            <ChipSelisih selisih={selisih} className="shrink-0" />
                          </div>
                          <span className="text-isi text-navy/70">
                            {rentangJam(s)}, {orangSesi(s)}
                          </span>
                          <span className="text-isi">
                            Uang akhir <strong>{akhir}</strong>
                          </span>
                        </div>
                        <div className={`hidden ${KOLOM_DESKTOP}`}>
                          <span className="flex min-w-0 flex-col">
                            <span className="break-words font-bold">{nama}</span>
                            <span className="text-isi text-navy/70">{orangSesi(s)}</span>
                          </span>
                          <span className="text-besar">{rentangJam(s)}</span>
                          <span className="text-right font-bold">{akhir}</span>
                          <span className="flex justify-end">
                            <ChipSelisih selisih={selisih} />
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {adaBerikutnya && (
            <Button
              variant="outline"
              onClick={onMuatBerikutnya}
              disabled={memuatBerikutnya}
              className="h-11 self-stretch border-navy/20 px-5 font-semibold text-navy @[40rem]:self-center"
            >
              {memuatBerikutnya ? "Memuat..." : "Muat hari sebelumnya"}
            </Button>
          )}
        </>
      )}
    </section>
  );
}