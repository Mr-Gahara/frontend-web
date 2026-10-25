"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Truck } from "lucide-react";
import { pesanError } from "@/lib/api/error";
import { useBuatSuratJalan } from "@/features/transfer-stok/hooks";
import { Button } from "@/components/ui/button";

interface Props {
  pengajuanID: string;
  /** Daftar surat jalan ruang pengirim (RUANG_SURAT_JALAN); tujuan setelah berhasil. */
  urlSuratJalan: string;
  /** Kunci tombol, misalnya pasangan lokasi tidak sah (arahPengajuanValid). */
  dikunci?: boolean;
}

/**
 * Panel buat surat jalan dari pengajuan yang sudah disetujui, dipakai ruang
 * pengirim barang (AR2a): detail gudang untuk permintaan, detail outlet untuk
 * pengembalian. Backend menyalin item dan arah dari pengajuan
 * (transferStokService.js baris 259 sampai 260, backend ridho b5b367a).
 */
export function PanelBuatSuratJalan({ pengajuanID, urlSuratJalan, dikunci = false }: Props) {
  const router = useRouter();
  const mutation = useBuatSuratJalan({
    onSuccess: (dibuat) => {
      toast.success("Surat Jalan Berhasil Dibuat", {
        description: "Draft pengiriman telah disiapkan.",
      });
      router.push(dibuat?.id ? `${urlSuratJalan}/${dibuat.id}` : urlSuratJalan);
    },
    onError: (err) =>
      toast.error("Gagal Membuat Surat Jalan", { description: pesanError(err, "Gagal membuat surat jalan.") }),
  });

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm flex flex-col gap-3">
      <h3 className="text-sm font-bold text-blue-900 text-center mb-1">
        Tindakan Eksekusi Logistik
      </h3>
      <Button
        onClick={() =>
          mutation.mutate({
            pengajuanStokID: pengajuanID,
            tanggalKirim: new Date().toISOString(),
          })
        }
        disabled={dikunci || mutation.isPending}
        className="w-full bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-md cursor-pointer"
      >
        <Truck className="w-4 h-4 mr-2" />
        {mutation.isPending ? "Memproses..." : "Buat Surat Jalan"}
      </Button>
      <p className="text-[10px] font-medium text-blue-800/60 text-center">
        Sistem otomatis menarik data item untuk divalidasi ke dalam Surat Jalan (Draft).
      </p>
    </div>
  );
}