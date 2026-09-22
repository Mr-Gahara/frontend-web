"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { TransferStok } from "@/types/transferStok";
import { pesanError } from "@/lib/api/error";
import { useRevisiSuratJalan, useTransferStok } from "./hooks";
import { susunPayloadRevisi } from "./payload";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Save,
  Package,
  AlertTriangle,
  FileEdit,
} from "lucide-react";

type EditItem = {
  id_lokal: string;
  bahanBakuID: string;
  namaBahan: string;
  satuan: string;
  qtyKirim: string;
};

/**
 * Revisi kuantitas surat jalan PENDING. Form dipasang setelah detail dimuat
 * ulang (keputusan rancangan butir 8), sehingga nilai awalnya selalu dari data
 * terbaru dan tidak diisi ulang lewat effect.
 */
export default function HalamanRevisiTransfer({ id }: { id: string }) {
  const router = useRouter();
  const { data: detail, isLoading, isFetchedAfterMount } = useTransferStok(id);

  if (isLoading || !isFetchedAfterMount) {
    return (
      <div className="flex flex-col gap-6 px-4 py-8 w-full max-w-4xl mx-auto">
        <Skeleton className="h-8 w-64 bg-[#0A2947]/10" />
        <Skeleton className="h-100 w-full bg-[#0A2947]/10 rounded-2xl" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="w-12 h-12 text-rose-500/50" />
        <h2 className="text-xl font-bold text-[#0A2947]">
          Data tidak ditemukan
        </h2>
        <Button variant="outline" onClick={() => router.back()}>
          Kembali
        </Button>
      </div>
    );
  }

  // Tembok Filter Keamanan: Hanya izinkan jika status PENDING
  if (detail.status !== "PENDING") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="w-12 h-12 text-amber-500/80" />
        <h2 className="text-xl font-bold text-[#0A2947]">Akses Ditolak</h2>
        <p className="text-sm font-medium text-[#0A2947]/60">
          Surat Jalan ini sudah berstatus {detail.status} dan tidak dapat
          direvisi lagi.
        </p>
        <Button
          variant="default"
          className="bg-[#0A2947]"
          onClick={() => router.push(`/dashboard/gudang/transferStok/${id}`)}
        >
          Lihat Detail Saja
        </Button>
      </div>
    );
  }

  return <FormRevisiTransfer detail={detail} />;
}

function FormRevisiTransfer({ detail }: { detail: TransferStok }) {
  const router = useRouter();
  const id = detail.id;

  // --- Form State ---
  // Kunci baris dari id bahan baku: unik per surat jalan, karena backend
  // menolak item di luar pengajuan. Menggantikan crypto.randomUUID, yang tidak
  // tersedia di HTTP biasa.
  const [items, setItems] = useState<EditItem[]>(() =>
    detail.items.map((item, indeks) => ({
      id_lokal: item.bahanBaku?.id ?? `baris-${indeks}`,
      bahanBakuID: item.bahanBaku?.id || "",
      namaBahan: item.bahanBaku?.namaBahan || "Item Tidak Dikenal",
      satuan: item.bahanBaku?.satuan || "",
      qtyKirim: String(item.qtyKirim),
    })),
  );

  // --- Mutations ---
  // Invalidasi ada di hook (akar transfer).
  const updateMutation = useRevisiSuratJalan(id, {
    onSuccess: () => {
      toast.success("Revisi Berhasil", {
        description: "Kuantitas Surat Jalan telah diperbarui.",
      });
      router.push(`/dashboard/gudang/transferStok/${id}`);
    },
    onError: (err) => {
      toast.error("Gagal Memperbarui", { description: pesanError(err, "Revisi gagal disimpan.") });
    },
  });

  const simpan = () => {
    const hasil = susunPayloadRevisi(items);
    if (!hasil.ok) {
      toast.error("Gagal Memperbarui", { description: hasil.pesan });
      return;
    }
    updateMutation.mutate(hasil.payload);
  };

  // --- Handlers ---
  const handleQtyChange = (id_lokal: string, value: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id_lokal === id_lokal ? { ...item, qtyKirim: value } : item,
      ),
    );
  };

  return (
    <div className="flex flex-col gap-6 px-4 py-8 w-full max-w-4xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit cursor-pointer px-0 text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] font-semibold transition-colors"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Batal Revisi
        </Button>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#0A2947] flex items-center gap-2">
            <FileEdit className="w-6 h-6 text-[#D4A373]" /> Revisi Kuantitas
            Pengiriman
          </h1>
          <p className="text-sm font-medium text-[#0A2947]/60">
            Surat Jalan:{" "}
            <strong className="font-mono">{detail.nomorTransfer}</strong>
          </p>
        </div>
      </div>

      {/* DAFTAR BARANG */}
      <div className="rounded-2xl border border-[#0A2947]/10 bg-white shadow-sm overflow-hidden">
        <div className="bg-[#F2EAE1] px-6 py-4 border-b border-[#0A2947]/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#D4A373]" />
            <h2 className="font-bold text-[#0A2947]">
              Sesuaikan Jumlah yang Akan Dikirim
            </h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#FFFAF3] text-xs uppercase font-bold text-[#0A2947]/50 border-b border-[#0A2947]/5">
              <tr>
                <th className="px-6 py-4">Nama Barang</th>
                <th className="px-6 py-4 w-48 text-right">
                  Kuantitas Dikirim (Fisik)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0A2947]/5">
              {items.map((item) => (
                <tr key={item.id_lokal} className="hover:bg-[#FFFAF3]/50">
                  <td className="px-6 py-4 font-bold text-[#0A2947]">
                    {item.namaBahan}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Input
                        type="number"
                        min={1}
                        value={item.qtyKirim}
                        onChange={(e) =>
                          handleQtyChange(item.id_lokal, e.target.value)
                        }
                        className="w-24 bg-white border-[#0A2947]/20 text-[#0A2947] font-mono font-bold text-right no-spinner"
                      />
                      <span className="text-xs font-bold text-[#0A2947]/50 w-8">
                        {item.satuan}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* INFO & ACTIONS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-blue-50 border border-blue-100 p-4 rounded-xl">
        <p className="text-xs font-medium text-blue-800">
          <strong>Penting:</strong> Pastikan kuantitas yang Anda masukkan sesuai
          dengan stok fisik di gudang. Angka ini akan menjadi patokan saat Anda
          mengeksekusi pengiriman.
        </p>
        <Button
          onClick={simpan}
          disabled={updateMutation.isPending}
          className="bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 font-bold shadow-md cursor-pointer w-full sm:w-auto whitespace-nowrap"
        >
          <Save className="w-4 h-4 mr-2" />
          {updateMutation.isPending ? "Menyimpan..." : "Simpan Revisi"}
        </Button>
      </div>
    </div>
  );
}
