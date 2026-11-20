"use client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ReservasiNavTabs } from "./components/reservasi-nav-tabs";
import { useRouter } from "next/navigation"; // ✅ bukan "next/router"

export default function ReservasiLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter(); // ✅ dipanggil sebagai hook, bukan di-import langsung

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 sm:px-4 sm:py-8">
      {/* HEADER UTAMA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-judul font-bold tracking-tight text-navy">
            Manajemen Booking
          </h1>
          <p className="text-isi font-medium text-navy/60">
            Kelola jadwal, sewa aset, dan pemantauan sesi aktif secara real-time.
          </p>
        </div>
        {/* Filter Aset dihapus: tidak pernah berfungsi (FL9a). */}
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <Button
            size="aksi"
            className="w-full cursor-pointer bg-navy text-gading hover:bg-navy/90 shadow-sm sm:w-auto"
            onClick={() => {
              router.push("/dashboard/outlet/reservasi/buatReservasi") // ✅ leading slash, tanpa "app/"
            }}
          >
            <Plus className="h-4 w-4 text-karamel" /> Buat Reservasi Baru
          </Button>
        </div>
      </div>
      <ReservasiNavTabs />
      {/* TH1a: halaman di dalam layout modul tidak menambah padding pembungkus sendiri, agar tepinya segaris dengan judul modul. */}
      <div className="w-full sm:*:px-0! sm:*:py-0!">{children}</div>
    </div>
  );
}