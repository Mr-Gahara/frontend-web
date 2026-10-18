"use client"

import Link from "next/link"
import { useSession } from "@/lib/auth/useSession";
import { bolehBukaHalaman } from "@/lib/auth/permissions";
import { 
  Receipt, 
  Users, 
  Store, 
  ArrowRight,
  Settings,
  Wallet,
  Tags
} from "lucide-react"

// Data rute pengaturan dengan palet Tetradic (Mustard & Sage Green)
const settingsModules = [
  {
    title: "Pajak & Biaya Layanan",
    description: "Kelola tarif pajak, service charge, aturan inklusif, dan prioritas pemungutan.",
    icon: Receipt,
    href: "/dashboard/outlet/pengaturan/pajak",
    iconColor: "text-karamel", // Mustard
  },
  {
    title: "Manajemen Role (Hak Akses)",
    description: "Atur peran pengguna dan batas kewenangan staf di dalam sistem aplikasi.",
    icon: Users,
    href: "/dashboard/outlet/pengaturan/roles",
    iconColor: "text-sage", // Sage Green
  },
  {
    title: "Profil Toko",
    description: "Konfigurasi informasi dasar, alamat, dan lokasi outlet toko Anda.",
    icon: Store,
    href: "/dashboard/outlet/pengaturan/toko",
    iconColor: "text-karamel", // Mustard
  },
  {
    title: "Metode Pembayaran",
    description: "Konfigurasi metode pembayaran",
    icon: Wallet,
    href: "/dashboard/outlet/pengaturan/metodePembayaran",
    iconColor: "text-sage", // Sage Green
  },
  {
    title: "Kategori Beban",
    description: "Kelompokkan pengeluaran operasional, misalnya listrik, sewa, atau gaji.",
    icon: Tags,
    href: "/dashboard/outlet/pengaturan/kategoriBeban",
    iconColor: "text-karamel", // Mustard
  }
]

export default function PengaturanPage() {
  // Kartu mengikuti gerbang halamannya (IZIN_HALAMAN): kartu Pajak hanya
  // tampil bagi pemegang read-pajak atau akses-pos (keputusan FC3a).
  const { permissions } = useSession();
  const modulTampil = settingsModules.filter((modul) => bolehBukaHalaman(modul.href, permissions));
  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-8 w-full overflow-x-hidden">
      
      {/* Header Utama */}
      <div className="flex flex-col gap-1.5 w-full border-b border-navy/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-krem rounded-lg shrink-0 border border-navy/10 shadow-sm">
            <Settings className="w-6 h-6 text-navy" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-navy wrap-break-words">
            Pengaturan Outlet
          </h1>
        </div>
        <p className="text-sm font-medium text-navy/60 ml-11 md:pr-12 wrap-break-words">
          Pilih modul di bawah ini untuk mengonfigurasi preferensi operasional dan sistem Anda.
        </p>
      </div>

      {/* Grid Navigasi Pengaturan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full items-stretch">
        {modulTampil.map((modul, idx) => {
          const Icon = modul.icon
          return (
            <Link 
              key={idx} 
              href={modul.href}
              className="group bg-krem rounded-2xl p-6 shadow-sm flex flex-col h-full hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-navy/10 hover:border-navy/30 overflow-hidden"
            >
              <div className="flex flex-col h-full w-full">
                <div className="flex justify-between items-start mb-4">
                  {/* Kotak Ikon Cream Terang agar ikon menonjol */}
                  <div className="p-3 bg-gading rounded-lg shadow-sm border border-navy/5 shrink-0">
                    <Icon className={`w-6 h-6 ${modul.iconColor}`} />
                  </div>
                  {/* Panah akan menggelap saat di-hover */}
                  <ArrowRight className="w-5 h-5 text-navy/20 group-hover:text-navy transition-colors shrink-0 mt-1" />
                </div>
                
                <h3 className="text-xl font-bold tracking-tight text-navy wrap-break-words pr-2">
                  {modul.title}
                </h3>
                <p className="text-sm font-medium text-navy/60 mt-2 leading-relaxed wrap-break-words line-clamp-3">
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