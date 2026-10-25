"use client";

import { useId } from "react";
import Link from "next/link";
import { ChevronRight, ClipboardList, Truck, type LucideIcon } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/lib/auth/useSession";
import { useAntreanPengajuan, useRingkasanPengiriman } from "./hooks";
import { urlBoleh } from "./izin";
import { PesanGagal } from "./pesan-gagal";
import { TAUTAN_DASHBOARD_GUDANG } from "./ringkasan";
import { formatAngka } from "./tampilan";

interface Kartu {
  angka: number;
  /** Arti angka dalam bahasa sehari-hari. */
  label: string;
  /** Ajakan bertindak di kartu bertautan. */
  aksi: string;
  /** Pengganti ajakan saat angkanya nol. */
  kosong: string;
  /** null: tanpa tautan, karena gerbang halaman tujuannya tidak terpenuhi. */
  href: string | null;
}

const DASAR_KARTU = "flex-1 min-w-0 rounded-2xl p-3 sm:p-4 flex flex-col gap-1 sm:gap-1.5";
const ANGKA = "text-[28px] sm:text-4xl font-bold leading-none";
const LABEL = "text-[13px] sm:text-sm font-medium";

function KartuAngka({ kartu, memuat }: { kartu: Kartu; memuat: boolean }) {
  if (memuat) {
    return (
      <div className={`${DASAR_KARTU} bg-white`}>
        <Skeleton className="h-7 sm:h-9 w-11 bg-krem rounded-lg" />
        <span className={LABEL}>{kartu.label}</span>
        <Skeleton className="h-3 w-16 bg-krem rounded-md" />
      </div>
    );
  }
  if (kartu.angka === 0) {
    return (
      <div className={`${DASAR_KARTU} bg-white/60`}>
        <span className={`${ANGKA} text-navy/60`}>0</span>{" "}
        <span className={LABEL}>{kartu.label}</span>
        <span className="text-xs sm:text-[13px] text-navy/60">{kartu.kosong}</span>
      </div>
    );
  }
  const isi = (
    <>
      <span className={ANGKA}>{formatAngka(kartu.angka)}</span>{" "}
      <span className={LABEL}>{kartu.label}</span>
      {kartu.href && (
        <span className="text-xs sm:text-[13px] font-semibold text-amber-800">
          {kartu.aksi} <span aria-hidden="true">→</span>
        </span>
      )}
    </>
  );
  return kartu.href ? (
    <Link
      href={kartu.href}
      className={`${DASAR_KARTU} bg-white text-navy shadow-sm transition-colors hover:bg-gading focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy`}
    >
      {isi}
    </Link>
  ) : (
    <div className={`${DASAR_KARTU} bg-white shadow-sm`}>{isi}</div>
  );
}

/** Satu kelompok alur barang: dua kartu berurutan yang dihubungkan panah. */
function GrupAlur({
  judul,
  penjelasan,
  ikon: Ikon,
  kartu,
  memuat,
  gagal,
  pesanGagal,
  ulangi,
}: {
  judul: string;
  penjelasan: string;
  ikon: LucideIcon;
  kartu: [Kartu, Kartu];
  memuat: boolean;
  gagal: boolean;
  pesanGagal: string;
  ulangi: () => void;
}) {
  const idJudul = useId();
  return (
    <section
      aria-labelledby={idJudul}
      className="bg-krem rounded-[22px] sm:rounded-3xl p-3.5 sm:p-[18px] flex flex-col gap-3 sm:gap-3.5 min-w-0 h-full"
    >
      <div className="flex items-center gap-2.5">
        <span
          className="w-[30px] h-[30px] sm:w-[34px] sm:h-[34px] rounded-[10px] sm:rounded-[11px] bg-navy text-karamel flex items-center justify-center shrink-0"
          aria-hidden="true"
        >
          <Ikon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
        </span>
        <div className="flex flex-col gap-0.5 min-w-0">
          <h2 id={idJudul} className="text-[15px] sm:text-base font-semibold">
            {judul}
          </h2>
          <p className="text-xs sm:text-[13px] text-navy/75">{penjelasan}</p>
        </div>
      </div>
      {gagal ? (
        <PesanGagal pesan={pesanGagal} ulangi={ulangi} />
      ) : (
        <div className="flex items-center gap-1.5 sm:gap-2">
          <KartuAngka kartu={kartu[0]} memuat={memuat} />
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-karamel shrink-0" aria-hidden="true" />
          <KartuAngka kartu={kartu[1]} memuat={memuat} />
        </div>
      )}
    </section>
  );
}

/** Pengajuan dari outlet: angka sama dengan tab Perlu Disetujui dan Perlu Surat Jalan. */
export function PanelPengajuan() {
  const { permissions } = useSession();
  const { data, memuat, gagal, ulangi } = useAntreanPengajuan();
  return (
    <GrupAlur
      judul="Pengajuan dari outlet"
      penjelasan="Permintaan barang dari outlet ke gudang"
      ikon={ClipboardList}
      memuat={memuat || (!gagal && data === null)}
      gagal={gagal}
      pesanGagal="Angka pengajuan gagal dimuat."
      ulangi={ulangi}
      kartu={[
        {
          angka: data?.perluTinjauan ?? 0,
          label: "pengajuan perlu disetujui",
          aksi: "Periksa dan setujui",
          kosong: "Semua pengajuan sudah diperiksa",
          href: urlBoleh(TAUTAN_DASHBOARD_GUDANG.perluTinjauan, permissions),
        },
        {
          angka: data?.perluSuratJalan ?? 0,
          label: "pengajuan sudah disetujui, surat jalannya belum dibuat",
          aksi: "Buat surat jalan",
          kosong: "Semua sudah dibuatkan surat jalan",
          href: urlBoleh(TAUTAN_DASHBOARD_GUDANG.perluSuratJalan, permissions),
        },
      ]}
    />
  );
}

/** Pengiriman ke outlet: angka sama dengan tab Belum Dikirim dan halaman pengiriman. */
export function PanelPengiriman() {
  const { permissions } = useSession();
  const { data, memuat, gagal, ulangi } = useRingkasanPengiriman();
  return (
    <GrupAlur
      judul="Pengiriman ke outlet"
      penjelasan="Barang yang dikirim gudang dengan surat jalan"
      ikon={Truck}
      memuat={memuat || (!gagal && data === null)}
      gagal={gagal}
      pesanGagal="Angka pengiriman gagal dimuat."
      ulangi={ulangi}
      kartu={[
        {
          angka: data?.suratJalanPending ?? 0,
          label: "surat jalan belum dikirim",
          aksi: "Kirim sekarang",
          kosong: "Semua surat jalan sudah dikirim",
          href: urlBoleh(TAUTAN_DASHBOARD_GUDANG.suratJalanDraf, permissions),
        },
        {
          angka: data?.sedangDikirim ?? 0,
          label: "surat jalan sedang dalam perjalanan",
          aksi: "Lihat pengiriman",
          kosong: "Tidak ada barang di jalan",
          href: urlBoleh(TAUTAN_DASHBOARD_GUDANG.sedangDikirim, permissions),
        },
      ]}
    />
  );
}