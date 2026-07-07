"use client"

import React from "react"
import Link from "next/link"
import { 
  Receipt, 
  Users, 
  Store, 
  ArrowRight,
  Settings,
  Wallet
} from "lucide-react"

// Data rute pengaturan untuk di-render secara dinamis
const settingsModules = [
  {
    title: "Pajak & Biaya Layanan",
    description: "Kelola tarif pajak, service charge, aturan inklusif, dan prioritas pemungutan.",
    icon: Receipt,
    href: "/dashboard/pengaturan/pajak",
    iconColor: "text-blue-400",
  },
  {
    title: "Manajemen Role (Hak Akses)",
    description: "Atur peran pengguna dan batas kewenangan staf di dalam sistem aplikasi.",
    icon: Users,
    href: "/dashboard/pengaturan/roles",
    iconColor: "text-emerald-400",
  },
  {
    title: "Profil Toko",
    description: "Konfigurasi informasi dasar, alamat, jam operasional, dan detail toko lainnya.",
    icon: Store,
    href: "/dashboard/pengaturan/toko",
    iconColor: "text-amber-400",
  },
  {
    title: "Metode Pembayaran",
    description: "Konfigurasi metode pembayaran",
    icon: Wallet,
    href: "/dashboard/pengaturan/metodePembayaran",
    iconColor: "text-emerald-400"
  }
]

export default function PengaturanPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-8 w-full overflow-x-hidden">
      
      {/* Header Utama */}
      <div className="flex flex-col gap-1.5 w-full border-b border-zinc-200 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-100 rounded-lg shrink-0">
            <Settings className="w-6 h-6 text-zinc-900" />
          </div>
          <h1 className="text-2xl font-semibold text-zinc-900 wrap-break-words">Pengaturan Sistem</h1>
        </div>
        <p className="text-sm text-zinc-500 ml-11 md:pr-12 wrap-break-words">
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
              className="group bg-[#323232] rounded-2xl p-6 text-white shadow-sm flex flex-col h-full hover:bg-[#3f3f3f] hover:-translate-y-1 transition-all duration-200 border border-transparent hover:border-[#525252] overflow-hidden"
            >
              <div className="flex flex-col h-full w-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-[#424242] rounded-lg group-hover:bg-[#4a4a4a] transition-colors shrink-0">
                    <Icon className={`w-6 h-6 ${modul.iconColor}`} />
                  </div>
                  <ArrowRight className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors shrink-0 mt-1" />
                </div>
                
                <h3 className="text-xl font-semibold tracking-tight wrap-break-words pr-2">
                  {modul.title}
                </h3>
                <p className="text-sm text-zinc-400 mt-2 leading-relaxed wrap-break-words line-clamp-3">
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