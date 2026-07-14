"use client"

import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import Link from "next/link"
import { 
  Receipt, 
  Users, 
  Store, 
  ArrowRight,
  Settings,
  Wallet
} from "lucide-react"

// Data rute pengaturan dengan palet Tetradic (Mustard & Sage Green)
const settingsModules = [
  {
    title: "Pajak & Biaya Layanan",
    description: "Kelola tarif pajak, service charge, aturan inklusif, dan prioritas pemungutan.",
    icon: Receipt,
    href: "/dashboard/pengaturan/pajak",
    iconColor: "text-[#D4A373]", // Mustard
  },
  {
    title: "Manajemen Role (Hak Akses)",
    description: "Atur peran pengguna dan batas kewenangan staf di dalam sistem aplikasi.",
    icon: Users,
    href: "/dashboard/pengaturan/roles",
    iconColor: "text-[#718355]", // Sage Green
  },
  {
    title: "Profil Toko",
    description: "Konfigurasi informasi dasar, alamat, jam operasional, dan detail toko lainnya.",
    icon: Store,
    href: "/dashboard/pengaturan/toko",
    iconColor: "text-[#D4A373]", // Mustard
  },
  {
    title: "Metode Pembayaran",
    description: "Konfigurasi metode pembayaran",
    icon: Wallet,
    href: "/dashboard/pengaturan/metodePembayaran",
    iconColor: "text-[#718355]", // Sage Green
  }
]

export default function PengaturanPage() {
  useAuthGuard();
  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-8 w-full overflow-x-hidden">
      
      {/* Header Utama */}
      <div className="flex flex-col gap-1.5 w-full border-b border-[#0A2947]/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#F2EAE1] rounded-lg shrink-0 border border-[#0A2947]/10 shadow-sm">
            <Settings className="w-6 h-6 text-[#0A2947]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0A2947] wrap-break-words">
            Pengaturan Sistem
          </h1>
        </div>
        <p className="text-sm font-medium text-[#0A2947]/60 ml-11 md:pr-12 wrap-break-words">
          Pilih modul di bawah ini untuk mengonfigurasi preferensi operasional dan sistem Anda.
        </p>
      </div>

      {/* Grid Navigasi Pengaturan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full items-stretch">
        {settingsModules.map((modul, idx) => {
          const Icon = modul.icon
          return (
            <Link 
              key={idx} 
              href={modul.href}
              className="group bg-[#F2EAE1] rounded-2xl p-6 shadow-sm flex flex-col h-full hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-[#0A2947]/10 hover:border-[#0A2947]/30 overflow-hidden"
            >
              <div className="flex flex-col h-full w-full">
                <div className="flex justify-between items-start mb-4">
                  {/* Kotak Ikon Cream Terang agar ikon menonjol */}
                  <div className="p-3 bg-[#FFFAF3] rounded-lg shadow-sm border border-[#0A2947]/5 shrink-0">
                    <Icon className={`w-6 h-6 ${modul.iconColor}`} />
                  </div>
                  {/* Panah akan menggelap saat di-hover */}
                  <ArrowRight className="w-5 h-5 text-[#0A2947]/20 group-hover:text-[#0A2947] transition-colors shrink-0 mt-1" />
                </div>
                
                <h3 className="text-xl font-bold tracking-tight text-[#0A2947] wrap-break-words pr-2">
                  {modul.title}
                </h3>
                <p className="text-sm font-medium text-[#0A2947]/60 mt-2 leading-relaxed wrap-break-words line-clamp-3">
                  {modul.description}
                </p>
              </div>
            </Link>
          )
        })}
      </div>

    </div>
  )
}