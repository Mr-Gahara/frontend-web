"use client";

import { Textarea } from "@/components/ui/textarea";
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
import { Ban, CheckCircle2, XCircle } from "lucide-react";

/** Keadaan satu dialog aksi; state dan mutation tetap di halaman detail. */
interface AksiDialog {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
}

interface Props {
  ajukan: AksiDialog & { onKonfirmasi: () => void };
  setujui: AksiDialog & {
    namaJurnal: string;
    alasan: string;
    onAlasan: (alasan: string) => void;
    onKonfirmasi: () => void;
  };
  tolak: AksiDialog & { catatan: string; onCatatan: (catatan: string) => void; onKonfirmasi: () => void };
  batal: AksiDialog & { onKonfirmasi: () => void };
}

/** Dialog ajukan, setujui, tolak, dan batalkan stock opname. */
export function DialogAksiOpname({ ajukan, setujui, tolak, batal }: Props) {
  return (
    <>
      {/* 1. Modal Submit (Staf) */}
      <AlertDialog open={ajukan.open} onOpenChange={ajukan.onOpenChange}>
        <AlertDialogContent className="bg-gading border-navy/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-navy">Kirim Pengajuan Opname?</AlertDialogTitle>
            <AlertDialogDescription className="text-navy/70 font-medium">
              Pastikan Anda telah menekan tombol <strong className="text-navy">Simpan Angka Sementara</strong> sebelum mengajukan. Setelah dikirim, Anda tidak dapat mengubah angka fisik lagi kecuali manajer mengembalikannya (Reject).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={ajukan.pending} className="border-navy/20 text-navy hover:bg-navy/5 font-bold cursor-pointer">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); ajukan.onKonfirmasi(); }} disabled={ajukan.pending} className="bg-navy text-gading hover:bg-navy/90 font-bold cursor-pointer">
              {ajukan.pending ? "Mengajukan..." : "Ya, Kirim Pengajuan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 2. Modal Approve (Manajer) */}
      <AlertDialog open={setujui.open} onOpenChange={setujui.onOpenChange}>
        <AlertDialogContent className="bg-gading border-navy/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-navy flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-sage" /> Setujui Pengajuan
            </AlertDialogTitle>
            <AlertDialogDescription className="text-navy/70 font-medium">
              Menyetujui dokumen ini akan langsung memicu {setujui.namaJurnal}. Saldo persediaan di sistem akan diubah mengikuti angka fisik yang diinput.
            </AlertDialogDescription>
            <div className="pt-4">
              <label className="text-xs font-bold text-navy mb-1.5 block">Catatan Persetujuan (Opsional)</label>
              <Textarea
                placeholder="Misal: Selisih disetujui, sesuai dengan laporan kehilangan."
                value={setujui.alasan}
                onChange={(e) => setujui.onAlasan(e.target.value)}
                className="bg-white border-navy/20 font-medium text-navy"
              />
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel disabled={setujui.pending} className="border-navy/20 text-navy hover:bg-navy/5 font-bold cursor-pointer">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); setujui.onKonfirmasi(); }} disabled={setujui.pending} className="bg-sage text-gading hover:bg-sage/90 font-bold cursor-pointer border-none shadow-sm">
              {setujui.pending ? "Memproses Eksekusi..." : "Eksekusi Penyesuaian Stok"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 3. Modal Reject (Manajer) */}
      <AlertDialog open={tolak.open} onOpenChange={tolak.onOpenChange}>
        <AlertDialogContent className="bg-gading border-rose-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-700 flex items-center gap-2">
              <XCircle className="w-5 h-5" /> Tolak & Kembalikan ke Staf
            </AlertDialogTitle>
            <AlertDialogDescription className="text-navy/70 font-medium">
              Status opname akan kembali menjadi <strong>REJECTED</strong>. Staf dapat mengedit ulang angka fisik berdasarkan instruksi Anda.
            </AlertDialogDescription>
            <div className="pt-4">
              <label className="text-xs font-bold text-rose-700 mb-1.5 block">Alasan Penolakan <span className="text-rose-500">*</span></label>
              <Textarea
                placeholder="Misal: Harap hitung ulang bagian rak belakang."
                value={tolak.catatan}
                onChange={(e) => tolak.onCatatan(e.target.value)}
                className="bg-white border-rose-200 focus-visible:ring-rose-500 font-medium text-navy"
              />
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel disabled={tolak.pending} className="border-navy/20 text-navy hover:bg-navy/5 font-bold cursor-pointer">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); tolak.onKonfirmasi(); }}
              disabled={tolak.pending || tolak.catatan.trim().length === 0}
              className="bg-rose-600 text-gading hover:bg-rose-700 font-bold cursor-pointer border-none shadow-sm"
            >
              {tolak.pending ? "Memproses..." : "Tolak Pengajuan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 4. Modal Cancel */}
      <AlertDialog open={batal.open} onOpenChange={batal.onOpenChange}>
        <AlertDialogContent className="bg-gading border-navy/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-navy flex items-center gap-2">
              <Ban className="w-5 h-5 text-rose-500" /> Batalkan Sesi Opname?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-navy/70 font-medium">
              Tindakan ini akan membatalkan sesi perhitungan stok secara permanen. Anda tidak dapat melanjutkan proses ini lagi. Lanjutkan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={batal.pending} className="border-navy/20 text-navy hover:bg-navy/5 font-bold cursor-pointer">Kembali</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); batal.onKonfirmasi(); }} disabled={batal.pending} className="bg-rose-600 text-gading hover:bg-rose-700 font-bold cursor-pointer border-none shadow-sm">
              {batal.pending ? "Membatalkan..." : "Ya, Batalkan Permanen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
