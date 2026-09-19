"use client";

import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { FormProduk } from "@/features/produk/form-produk";
import { useProduk } from "@/features/produk/hooks";
import { pesanError } from "@/lib/api/error";

export default function EditProdukPage() {
  useAuthGuard();
  const params = useParams();
  const produkId = params.id as string;

  // Form hanya dipasang dari data yang dimuat sejak halaman dibuka, bukan dari
  // cache, karena defaultValues hanya dibaca sekali saat form dipasang.
  // selaluMuatUlang memastikan pemuatan itu terjadi walau cache masih segar;
  // tanpanya isFetchedAfterMount tetap false dan halaman tertahan di loader.
  const { data: produk, error, isFetchedAfterMount } = useProduk(produkId, {
    selaluMuatUlang: true,
  });

  if (produk && isFetchedAfterMount) {
    return <FormProduk mode="edit" produk={produk} />;
  }

  const gagal = isFetchedAfterMount && Boolean(error);

  return (
    <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4">
      {gagal ? null : (
        <Loader2 className="h-8 w-8 animate-spin text-[#0A2947]/60" />
      )}
      <p className="text-sm font-bold text-[#0A2947]/60">
        {gagal
          ? pesanError(error, "Produk tidak ditemukan.")
          : "Memuat detail produk..."}
      </p>
    </div>
  );
}