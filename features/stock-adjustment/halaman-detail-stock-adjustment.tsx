"use client";

import { useParams, useRouter } from "next/navigation";
import { isNotFound } from "@/lib/api/error";
import { TIPE_LOKASI_RUANG, URL_DAFTAR_ADJUSTMENT, type RuangAdjustment } from "./ruang";
import { useStockAdjustment } from "@/features/stock-adjustment/hooks";
import {
  formatKoreksi,
  formatTanggalAdjustment,
  susunBarisItem,
} from "@/features/stock-adjustment/tampilan";
import { TautanSumber } from "@/features/stock-adjustment/tautan-sumber";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  FileText,
  Ban,
  ArchiveRestore,
} from "lucide-react";

interface Props {
  ruang: RuangAdjustment;
}

export default function HalamanDetailStockAdjustment({ ruang }: Props) {
  const router = useRouter();
  const params = useParams();
  const adjustmentID = params.id as string;
  const urlDaftar = URL_DAFTAR_ADJUSTMENT[ruang];

  const { data: adjustment, isLoading, error } = useStockAdjustment(adjustmentID);

  // --- RENDER CONDITIONS ---
  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-transparent"></div>
        <p className="text-sm font-bold text-navy/60">
          Memuat audit trail...
        </p>
      </div>
    );
  }

  if (error || !adjustment) {
    const tidakAda = !error || isNotFound(error);
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4 text-navy">
        <Ban className="h-10 w-10 text-rose-500" />
        <p className="font-bold">
          {tidakAda
            ? "Jurnal Penyesuaian tidak ditemukan."
            : "Gagal memuat Jurnal Penyesuaian. Coba muat ulang halaman."}
        </p>
        <Button
          onClick={() => router.push(urlDaftar)}
          variant="outline"
        >
          Kembali ke Daftar
        </Button>
      </div>
    );
  }

  // Stok outlet dan gudang tidak dicampur di tampilan mana pun (keputusan
  // pemilik proyek, 22 September 2026). Detail diambil per id tanpa melihat
  // tipe lokasi, sehingga id milik ruang lain yang dibuka lewat URL ditolak di
  // sini. Ini penjaga tampilan, bukan pengaman akses: backend belum membatasi
  // stock adjustment per ruang (dilaporkan ke tim backend). Lokasi yang
  // tipenya tidak diketahui tetap ditampilkan.
  const tipeLokasi = adjustment.lokasi?.tipe;
  if (tipeLokasi && tipeLokasi !== TIPE_LOKASI_RUANG[ruang]) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4 text-navy">
        <Ban className="h-10 w-10 text-rose-500" />
        <p className="font-bold">
          Jurnal Penyesuaian ini milik lokasi {tipeLokasi} dan tidak ditampilkan di ruang ini.
        </p>
        <Button onClick={() => router.push(urlDaftar)} variant="outline">
          Kembali ke Daftar
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-fit cursor-pointer px-0 text-navy/60 hover:bg-transparent hover:text-navy font-semibold transition-colors"
            onClick={() => router.push(urlDaftar)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar Jurnal
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-navy">
              Detail Jurnal Penyesuaian
            </h1>
            <p className="text-sm font-medium text-navy/60">
              No. Ref:{" "}
              <span className="font-bold font-mono text-navy">
                {adjustment.nomorAdjustment}
              </span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0">
          <Badge className="bg-sage text-gading px-3 py-1 font-bold border-none shadow-sm text-xs">
            Selesai
          </Badge>
        </div>
      </div>

      {/* INFORMASI UMUM (READ-ONLY) */}
      <div className="rounded-2xl border border-navy/10 bg-krem p-6 shadow-sm flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-5">
          <div className="flex items-center gap-2 border-b border-navy/10 pb-3">
            <ArchiveRestore className="h-5 w-5 text-karamel" />
            <h2 className="font-bold text-navy">Audit Trail Informasi</h2>
          </div>

          <div className="grid grid-cols-2 gap-y-5 text-sm">
            <div>
              <p className="text-navy/60 font-bold text-xs mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Tanggal Eksekusi
              </p>
              <p className="font-semibold text-navy">
                {formatTanggalAdjustment(adjustment.tanggal)}
              </p>
            </div>
            <div>
              <p className="text-navy/60 font-bold text-xs mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Lokasi / Gudang
              </p>
              <p className="font-semibold text-navy">
                {adjustment.lokasi?.nama || adjustment.lokasi?.id || "-"}
              </p>
            </div>
            <div>
              <p className="text-navy/60 font-bold text-xs mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Dieksekusi Oleh
              </p>
              <p className="font-semibold text-navy">
                {adjustment.pic?.nama || "-"}
              </p>
            </div>
          </div>
        </div>

        {/* FIX UI: Ubah ke flex-col dan flex-1 untuk mencegah overflow */}
        <div className="flex-1 flex flex-col gap-3 md:border-l border-navy/10 md:pl-8">
          <div className="flex items-center gap-2 border-b border-navy/10 pb-3">
            <FileText className="h-5 w-5 text-karamel" />
            <h2 className="font-bold text-navy">Alasan Penyesuaian</h2>
          </div>
          <div className="flex-1 p-4 bg-white/60 rounded-xl border border-navy/5 min-h-25">
            <p className="text-sm font-bold text-navy/40 italic leading-relaxed">
              {adjustment.alasan ? (
                <>&quot;{adjustment.alasan}&quot;</>
              ) : (
                "Tidak ada alasan yang dicantumkan."
              )}
            </p>
          </div>
          <p className="text-sm font-medium text-navy/70">
            Sumber Dokumen:{" "}
            <TautanSumber adjustment={adjustment} className="font-bold text-navy" />
          </p>
        </div>
      </div>

      {/* TABEL ITEM MUTASI */}
      <div className="rounded-2xl border border-navy/10 bg-gading shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-navy/5 flex items-center justify-between bg-gading">
          <h2 className="font-bold text-navy">
            Rekapitulasi Perubahan Saldo Fisik
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-krem text-navy/60 border-b border-navy/10 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-4 font-bold">Nama Item</th>
                <th className="px-5 py-4 font-bold text-center">
                  Saldo Sistem (Saat Disetujui)
                </th>
                <th className="px-5 py-4 font-bold text-center">Fisik Riil</th>
                <th className="px-5 py-4 font-bold text-center">
                  Koreksi (Delta)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {adjustment.items?.map((item) => {
                const baris = susunBarisItem(item);
                const warnaKoreksi =
                  baris.arah === "tambah"
                    ? "bg-emerald-100 text-emerald-700"
                    : baris.arah === "kurang"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-navy/10 text-navy";

                return (
                  <tr
                    key={baris.itemId}
                    className="hover:bg-navy/5 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <p className="font-bold text-navy">{baris.nama}</p>
                      <p className="text-xs text-navy/50 font-medium">
                        Satuan: {baris.satuan}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-center font-bold text-navy/60 font-mono">
                      {baris.qtySistem}
                      {baris.qtySaatDraf !== null && (
                        <p className="text-[10px] font-medium text-navy/50 font-sans">
                          Saat draf: {baris.qtySaatDraf}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4 text-center font-bold text-navy font-mono bg-navy/5">
                      {baris.qtyFisik}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <Badge
                        variant="outline"
                        className={`border-none font-bold font-mono px-2 py-0.5 ${warnaKoreksi}`}
                      >
                        {formatKoreksi(baris.qtyKoreksi)}
                      </Badge>
                    </td>
                  </tr>
                );
              })}

              {(!adjustment.items || adjustment.items.length === 0) && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-8 text-navy/50 font-medium"
                  >
                    Tidak ada detail item yang direkam dalam jurnal ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
