"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/format";
import type { SesiKasir } from "@/types/sesiKasir";
import { ChipSelisih } from "./label";
import { jamLokal, labelSelisih } from "./tampilan";

const FORMAT_HARI = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
const FORMAT_HARI_PENDEK = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** "Jumat 6 November 2026", tanpa koma setelah nama hari (pratinjau Rincian). */
const judulHari = (iso: string) => FORMAT_HARI.format(new Date(iso)).replace(", ", " ");
const waktuLengkap = (iso: string) =>
  `${FORMAT_HARI_PENDEK.format(new Date(iso)).replace(", ", " ")}, ${jamLokal(iso)}`;

function Baris({ label, isi, tebal }: { label: string; isi: React.ReactNode; tebal?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-navy/10 px-4 py-3.5 first:border-t-0">
      <dt className={tebal ? "font-bold text-navy" : "text-navy/70"}>{label}</dt>
      <dd className="text-right font-bold text-navy">{isi}</dd>
    </div>
  );
}

function Hitungan({
  judul,
  waktu,
  oleh,
  sistem,
  dihitung,
  selisih,
  catatan,
}: {
  judul: string;
  waktu: string;
  oleh: string;
  sistem: number | null;
  dihitung: number | null;
  selisih: number | null;
  catatan: string | null;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-[20px] bg-krem p-5 sm:p-6">
      <h2 className="text-xl font-bold text-navy">{judul}</h2>
      <p className="text-[15px] text-navy/70">
        {waktu}, oleh {oleh}
      </p>
      <dl className="flex flex-col rounded-[14px] bg-gading">
        <Baris label="Uang di laci menurut sistem" isi={sistem === null ? "-" : formatRupiah(sistem)} />
        <Baris label="Uang yang dihitung kasir" isi={dihitung === null ? "-" : formatRupiah(dihitung)} />
        <Baris label="Selisih" tebal isi={<ChipSelisih selisih={labelSelisih(selisih)} />} />
      </dl>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-bold text-navy">Catatan kasir</span>
        <span className="text-[15px] text-navy/70">{catatan || "Tidak ada catatan."}</span>
      </div>
    </section>
  );
}

/** Rincian satu sesi: hitungan saat dibuka dan saat ditutup (pratinjau Revisi 1 Rincian). */
export function RincianSesi({
  sesi,
  namaMesin,
  laci,
  hrefKembali,
  bolehTutup,
  onTutup,
}: {
  sesi: SesiKasir;
  namaMesin: string;
  laci: string;
  hrefKembali: string;
  bolehTutup: boolean;
  onTutup: () => void;
}) {
  const buka = sesi.status === "BUKA";
  return (
    <div className="flex flex-col gap-7">
      <Link
        href={hrefKembali}
        className="flex h-11 items-center gap-2 self-start text-[15px] font-bold text-navy no-underline"
      >
        <ChevronLeft className="size-[18px]" aria-hidden="true" />
        Kembali ke Mesin Kasir
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <span
            className={`self-start rounded-full px-3 py-1 text-sm font-bold text-navy ${buka ? "bg-sage/20" : "bg-navy/5"}`}
          >
            {buka ? "Kasir buka" : "Kasir tutup"}
          </span>
          <h1 className="break-words text-2xl font-bold tracking-tight text-navy sm:text-[32px]">
            {namaMesin}, {judulHari(sesi.dibukaPada)}
          </h1>
          <p className="text-base text-navy/70">Mesin kasir dengan laci {laci}</p>
        </div>
        {buka && bolehTutup && (
          <Button onClick={onTutup} className="h-12 bg-navy px-6 text-base font-bold text-gading hover:bg-navy/90">
            Tutup kasir dari web
          </Button>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Hitungan
          judul="Saat kasir dibuka"
          waktu={waktuLengkap(sesi.dibukaPada)}
          oleh={sesi.dibukaOleh?.nama ?? "-"}
          sistem={sesi.saldoSistemBuka}
          dihitung={sesi.nominalBuka}
          selisih={sesi.selisihBuka}
          catatan={sesi.catatanBuka}
        />
        {buka || !sesi.ditutupPada ? (
          <section className="flex flex-col gap-4 rounded-[20px] bg-krem p-5 sm:p-6">
            <h2 className="text-xl font-bold text-navy">Saat kasir ditutup</h2>
            <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-[14px] border border-dashed border-navy/25 p-8 text-center">
              <span className="text-[17px] font-extrabold text-navy">Kasir belum ditutup</span>
              <span className="max-w-sm text-[15px] text-navy/70">
                Uang akhir dan selisihnya tampil di sini setelah kasir ditutup dari mesin kasir atau dari web.
              </span>
            </div>
          </section>
        ) : (
          <Hitungan
            judul="Saat kasir ditutup"
            waktu={waktuLengkap(sesi.ditutupPada)}
            oleh={sesi.ditutupOleh?.nama ?? "-"}
            sistem={sesi.saldoSistemTutup}
            dihitung={sesi.nominalTutup}
            selisih={sesi.selisihTutup}
            catatan={sesi.catatanTutup}
          />
        )}
      </div>
    </div>
  );
}