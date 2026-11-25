"use client";

import { PesanStokProduk } from "@/features/notifikasi/pesan-stok-produk";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth/useSession";
import { aksiPajak } from "./izin";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDaftarProduk } from "@/features/produk/hooks";
import { pesanError } from "@/lib/api/error";
import type { Pajak, RelasiPajakProduk } from "@/types/pajak";
import { useLepasPajak, usePasangPajak, useRelasiPajakProduk } from "./hooks";
import { PesanPajak } from "./pesan-pajak";
import { labelModelRelasi, pajakTerpasang, pilihanPajakProduk, relasiNonaktif } from "./tampilan";

const kelasLabel = "text-isi font-bold text-navy";
const kelasPemicu = "border-navy/20 bg-gading text-navy";
const kelasIsiPilihan = "bg-gading border-navy/10 text-navy";
const kelasPilihan = "cursor-pointer hover:bg-navy/5";

/**
 * Tab pajak per produk (keputusan PO6a). Backend menyimpan relasi lewat
 * upsert per produk (produkPajakService.assignPajak), sehingga satu produk
 * hanya punya satu pajak per produk, dan memasang pajak lain menggantinya
 * lewat konfirmasi yang menyebut pajak lama. Hanya pajak per produk yang
 * aktif yang ditawarkan. Relasi dibaca dalam bentuk nyata
 * GET /produkpajak/:targetID (nama, tarif, model teks); tabel lama membaca
 * field yang tidak dikirim, sehingga isinya selalu kosong.
 */
export function TabPajakProduk({ daftarPajak }: { daftarPajak: readonly Pajak[] }) {
  const { permissions } = useSession();
  // Memasang dan melepas pajak produk memakai update-produk di backend.
  const bolehPasang = aksiPajak(permissions).pasang;
  const produk = useDaftarProduk();
  const [produkId, setProdukId] = useState("");
  const [pilihan, setPilihan] = useState("");
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [galatGanti, setGalatGanti] = useState("");
  const relasi = useRelasiPajakProduk(produkId || undefined);
  const terpasang = pajakTerpasang(relasi.data ?? []);
  const ditawarkan = pilihanPajakProduk(daftarPajak, terpasang?.pajak.id);
  const pajakPilihan = daftarPajak.find((p) => p.id === pilihan);
  const namaProduk = produk.data?.find((p) => p.id === produkId)?.namaProduk ?? "";

  const pasang = usePasangPajak({
    onSuccess: () => {
      toast.success("Berhasil", { description: "Pajak berhasil dipasang pada produk." });
      setPilihan("");
      setKonfirmasi(false);
      setGalatGanti("");
    },
    onError: (err) => {
      const pesan = pesanError(err, "Gagal memasang pajak.");
      if (konfirmasi) setGalatGanti(pesan);
      else toast.error("Gagal", { description: pesan });
    },
  });
  const lepas = useLepasPajak({
    onSuccess: () => toast.success("Berhasil", { description: "Pajak berhasil dilepas dari produk." }),
    onError: (err) => toast.error("Gagal", { description: pesanError(err, "Gagal melepas pajak.") }),
  });

  const kirimPasang = () => {
    if (!produkId || !pilihan) return;
    pasang.mutate({ produkID: produkId, pajakID: pilihan });
  };

  const tekanPasang = () => {
    if (terpasang) {
      setGalatGanti("");
      setKonfirmasi(true);
      return;
    }
    kirimPasang();
  };

  const kolom = useMemo<ColumnDef<RelasiPajakProduk>[]>(
    () => [
      {
        id: "nama",
        header: "Nama Pajak",
        cell: ({ row }) => (
          <div className="font-bold text-navy whitespace-normal">
            {row.original.pajak.nama}
            {relasiNonaktif(row.original) && (
              <>
                <span className="ml-1 font-medium text-navy/60">(nonaktif)</span>
                <p className="text-kecil font-medium text-navy/60">
                  Pajak ini nonaktif dan tidak dikenakan saat penjualan.
                </p>
              </>
            )}
          </div>
        ),
      },
      {
        id: "tarif",
        header: "Tarif",
        cell: ({ row }) => <span className="font-semibold text-navy">{row.original.pajak.tarif}%</span>,
      },
      {
        id: "model",
        header: "Model",
        cell: ({ row }) => (
          <span className="font-medium text-navy/80">{labelModelRelasi(row.original.pajak.model)}</span>
        ),
      },
      {
        id: "aksi",
        header: () => <span className="sr-only">Aksi</span>,
        cell: ({ row }) =>
          bolehPasang ? (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Aksi pajak produk"
                    className="h-8 w-8 cursor-pointer text-navy/70 hover:text-navy hover:bg-navy/5"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-gading border-navy/10">
                  <DropdownMenuItem
                    disabled={lepas.isPending}
                    onClick={() => lepas.mutate(row.original.id)}
                    className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-500/10 font-bold"
                  >
                    Lepas
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : null,
      },
    ],
    [bolehPasang, lepas],
  );

  return (
    <div className="rounded-2xl border border-navy/10 bg-krem p-6 shadow-sm space-y-6">
      <PesanStokProduk />
      <div className="space-y-2">
        <label htmlFor="pajak-produk" className={kelasLabel}>
          Pilih Produk
        </label>
        {produk.isError ? (
          <PesanPajak
            judul="Gagal memuat produk"
            pesan={pesanError(produk.error, "Terjadi kesalahan saat memuat produk.")}
            onCobaLagi={() => void produk.refetch()}
          />
        ) : (
          <Select
            value={produkId}
            onValueChange={(v) => {
              setProdukId(v);
              setPilihan("");
            }}
          >
            <SelectTrigger id="pajak-produk" className={kelasPemicu}>
              <SelectValue placeholder="Pilih produk" />
            </SelectTrigger>
            <SelectContent className={kelasIsiPilihan}>
              {(produk.data ?? []).map((p) => (
                <SelectItem key={p.id} value={p.id} className={kelasPilihan}>
                  {p.namaProduk}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {produkId && bolehPasang && (
        <div className="space-y-2 pt-2">
          <label htmlFor="pajak-pasang" className={kelasLabel}>
            Assign Pajak
          </label>
          <p className="text-kecil font-medium text-navy/60">
            Satu produk hanya dapat memiliki satu pajak per produk. Memasang pajak lain menggantikan pajak yang
            terpasang.
          </p>
          <div className="flex gap-3">
            <Select value={pilihan} onValueChange={setPilihan}>
              <SelectTrigger id="pajak-pasang" className={`${kelasPemicu} flex-1`}>
                <SelectValue placeholder="Pilih pajak" />
              </SelectTrigger>
              <SelectContent className={kelasIsiPilihan}>
                {ditawarkan.map((p) => (
                  <SelectItem key={p.id} value={p.id} className={kelasPilihan}>
                    {p.namaPajak} ({p.tarifPajak}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={tekanPasang}
              disabled={pasang.isPending || !pilihan || relasi.isLoading}
              className="cursor-pointer bg-karamel text-navy hover:bg-karamel/90 shadow-sm font-bold shrink-0"
            >
              {pasang.isPending && !konfirmasi ? "Menyimpan..." : "Assign"}
            </Button>
          </div>
        </div>
      )}

      {/* PP1a: DataTable rincian tanpa panel berlatar, aksi Lepas di menu titik tiga (keputusan rancangan butir 26). */}
      {produkId &&
        (relasi.isError ? (
          <PesanPajak
            judul="Gagal memuat pajak produk"
            pesan={pesanError(relasi.error, "Terjadi kesalahan saat memuat pajak produk.")}
            onCobaLagi={() => void relasi.refetch()}
          />
        ) : (
          <DataTable
            columns={kolom}
            data={terpasang ? [terpasang] : []}
            loading={relasi.isLoading}
            emptyMessage="Belum ada pajak untuk produk ini."
            rincian
          />
        ))}

      <AlertDialog
        open={konfirmasi}
        onOpenChange={(buka) => {
          if (!buka && !pasang.isPending) {
            setKonfirmasi(false);
            setGalatGanti("");
          }
        }}
      >
        <AlertDialogContent className="bg-gading border-navy/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-navy">Ganti pajak {namaProduk}?</AlertDialogTitle>
            <AlertDialogDescription className="text-navy/70 font-medium">
              Pajak {terpasang?.pajak.nama} akan diganti dengan {pajakPilihan?.namaPajak}. Satu produk hanya dapat
              memiliki satu pajak per produk.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {galatGanti && <p className="text-isi font-bold text-red-600">{galatGanti}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={pasang.isPending}
              className="cursor-pointer border-navy/20 text-navy hover:bg-navy/5 font-bold"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={pasang.isPending}
              onClick={(e) => {
                e.preventDefault();
                kirimPasang();
              }}
              className="cursor-pointer bg-karamel text-navy hover:bg-karamel/90 font-bold"
            >
              {pasang.isPending ? "Menyimpan..." : "Ganti"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}