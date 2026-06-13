"use client";

import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PembayaranPage() {
  useAuthGuard();
  const router = useRouter();
  const params = useParams();
  
  // Menangkap ID penjualan dari URL (ex: /dashboard/penjualan/123/bayar)
  const penjualanID = params.id as string;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit cursor-pointer px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
          onClick={() => router.push("/dashboard/penjualan")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Penjualan
        </Button>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Terima Pembayaran</h1>
          <p className="text-sm text-muted-foreground">
            Selesaikan transaksi untuk ID Penjualan: {penjualanID}
          </p>
        </div>
      </div>

      {/* Form pembayaran akan kita bangun di sini */}
    </div>
  );
}