"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth/useSession";
import { aksiPajak } from "./izin";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import type { Pajak } from "@/types/pajak";
import { useLepasPajak, usePasangPajak, useRelasiPajakProduk } from "./hooks";
import { PesanPajak } from "./pesan-pajak";
import { labelModelRelasi, pajakTerpasang, pilihanPajakProduk, relasiNonaktif } from "./tampilan";

const kelasLabel = "text-sm font-bold text-navy";
const kelasPemicu = "border-navy/20 bg-gading text-navy";
const kelasIsiPilihan = "bg-gading border-navy/10 text-navy";
const kelasPilihan = "cursor-pointer hover:bg-navy/5";
const kelasKepala = "font-bold text-navy/60";
const kelasSelKosong = "text-center text-navy/60 font-medium py-6";

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

  return (
    <div className="rounded-2xl border border-navy/10 bg-krem p-6 shadow-sm space-y-6">
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
          <p className="text-xs font-medium text-navy/60">
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

      {produkId && (
        <div className="rounded-xl border border-navy/10 bg-gading overflow-hidden mt-4">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-navy/10 hover:bg-transparent">
                <TableHead className={kelasKepala}>Nama Pajak</TableHead>
                <TableHead className={kelasKepala}>Tarif</TableHead>
                <TableHead className={kelasKepala}>Model</TableHead>
                <TableHead className={`text-right ${kelasKepala}`}>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {relasi.isLoading ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className={kelasSelKosong}>
                    Memuat...
                  </TableCell>
                </TableRow>
              ) : relasi.isError ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="p-4">
                    <PesanPajak
                      judul="Gagal memuat pajak produk"
                      pesan={pesanError(relasi.error, "Terjadi kesalahan saat memuat pajak produk.")}
                      onCobaLagi={() => void relasi.refetch()}
                    />
                  </TableCell>
                </TableRow>
              ) : !terpasang ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className={kelasSelKosong}>
                    Belum ada pajak untuk produk ini.
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow className="border-b border-navy/5 hover:bg-navy/5 transition-colors">
                  <TableCell className="font-bold text-navy">
                    {terpasang.pajak.nama}
                    {relasiNonaktif(terpasang) && (
                      <>
                        <span className="ml-1 font-medium text-navy/60">(nonaktif)</span>
                        <p className="text-xs font-medium text-navy/60">
                          Pajak ini nonaktif dan tidak dikenakan saat penjualan.
                        </p>
                      </>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold text-navy">{terpasang.pajak.tarif}%</TableCell>
                  <TableCell className="font-medium text-navy/80">{labelModelRelasi(terpasang.pajak.model)}</TableCell>
                  <TableCell className="text-right">
                    {bolehPasang && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={lepas.isPending}
                      onClick={() => lepas.mutate(terpasang.id)}
                      className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-500/10 font-bold"
                    >
                      Lepas
                    </Button>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

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
          {galatGanti && <p className="text-sm font-bold text-red-600">{galatGanti}</p>}
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