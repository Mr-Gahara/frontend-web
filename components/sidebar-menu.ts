/**
 * Definisi menu sidebar per ruang kerja. Dipisah dari komponen sidebar
 * (keputusan PF4a); kelayakan tiap menu tetap ditentukan izin endpoint
 * halamannya di lib/auth/permissions.ts, bukan di sini.
 */
import type * as React from "react";
import { bolehBukaGrup, bolehBukaHalaman } from "@/lib/auth/permissions";
import { bolehMenurutPlan } from "@/lib/auth/fitur-plan";
import {
  LayoutDashboard,
  CircleDollarSign,
  Package,
  Users,
  UserCircle,
  FileText,
  Settings,
  Ticket,
  ArrowRightLeft,
  Truck,
  PackageCheck,
  BookOpen,
  ClipboardList,
  Scale,
  Archive,
  CalendarDays,
  CalendarRange,
  Clock,
  ShoppingCart,
} from "lucide-react";

// --- TIPE DATA ---
export type SubMenuItem = {
  label: string;
  href: string;
};

export type MenuItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  subItems?: SubMenuItem[];
};

export type MenuGroup = {
  grup: string | null;
  items: MenuItem[];
};

/**
 * Menu tampil di sidebar: menu berinduk bila salah satu anaknya (yang
 * termasuk plan) boleh dibuka, menu tunggal bila halamannya termasuk plan
 * dan boleh dibuka. Dipakai sidebar dan tur dashboard, agar keduanya
 * menyaring menu dengan aturan yang sama.
 */
export function bolehLihatMenu(
  item: MenuItem,
  plan: Parameters<typeof bolehMenurutPlan>[1],
  permissions: string[],
): boolean {
  return item.subItems?.length
    ? bolehBukaGrup(
        item.subItems.map((s) => s.href).filter((h) => bolehMenurutPlan(h, plan)),
        permissions,
      )
    : bolehMenurutPlan(item.href, plan) && bolehBukaHalaman(item.href, permissions);
}

// --- 1. DEFINISI MENU OUTLET (TELAH DIRESTUKTURISASI) ---
export const outletMenus: MenuGroup[] = [
  {
    grup: null,
    items: [
      {
        label: "Dashboard",
        href: "/dashboard/outlet",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    grup: "Operasional",
    items: [
      {
        label: "Sesi Booking & Reservasi",
        href: "/dashboard/outlet/reservasi",
        icon: UserCircle,
      },
      {
        label: "Promo & Diskon",
        href: "/dashboard/outlet/diskon",
        icon: Ticket,
      },
    ],
  },
  {
    grup: "Keuangan & Laporan",
    items: [
      {
        label: "Keuangan",
        href: "/dashboard/outlet/keuangan",
        icon: CircleDollarSign,
        subItems: [
          {
            label: "Penjualan",
            href: "/dashboard/outlet/penjualan",
          },
          {
            label: "Pengeluaran",
            href: "/dashboard/outlet/pengeluaran",
          },
          // Laman yang tadinya tab Keuangan (pemilik proyek, 12 November 2026).
          {
            label: "Akun Kas & Bank",
            href: "/dashboard/outlet/keuangan/akunkas",
          },
          {
            label: "Mutasi Kas",
            href: "/dashboard/outlet/keuangan/mutasiArusKas",
          },
          {
            // Gabungan pembelian stok seluruh outlet dan gudang; ubah dan hapus
            // tetap di ruang asal.
            label: "Belanja Stok",
            href: "/dashboard/outlet/keuangan/belanjaStok",
          },
          {
            // Buka-tutup kasir dan mesin kasir (MK1a, modul/keuangan.md).
            label: "Mesin Kasir",
            href: "/dashboard/outlet/keuangan/mesinKasir",
          },
        ],
      },
      {
        label: "Laporan",
        href: "/dashboard/outlet/laporan", // Href semu untuk parent
        icon: FileText,
        subItems: [
          {
            label: "Ringkasan Laba/Rugi",
            href: "/dashboard/outlet/keuangan/ringkasanLabaRugi",
          },
          {
            // Laporan arus kas (B291, desain D, LR3a).
            label: "Arus Kas",
            href: "/dashboard/outlet/keuangan/arusKas",
          },
        ],
      },
    ],
  },
  // KELOMPOK BARU: INVENTARIS YANG DIPECAH 3
  {
    grup: "Manajemen Inventaris",
    items: [
      {
        label: "Data Barang",
        href: "/dashboard/outlet/inventaris-data", // Href semu untuk parent
        icon: Archive,
        subItems: [
          {
            label: "Produk Jualan",
            href: "/dashboard/outlet/inventaris/produk",
          },
          { label: "Kategori", href: "/dashboard/outlet/inventaris/kategori" },
          {
            label: "Bahan Baku / Resep",
            href: "/dashboard/outlet/inventaris/bahanBaku",
          },
        ],
      },
      {
        label: "Pantau Stok",
        href: "/dashboard/outlet/inventaris-pantau", // Href semu untuk parent
        icon: ClipboardList,
        subItems: [
          { label: "Stok Saat Ini", href: "/dashboard/outlet/inventaris/stok" },
          {
            label: "Hitung Fisik",
            href: "/dashboard/outlet/inventaris/stockOpname",
          },
          {
            label: "Koreksi Selisih",
            href: "/dashboard/outlet/inventaris/stockAdjustment",
          },
          {
            label: "Riwayat Pergerakan",
            href: "/dashboard/outlet/inventaris/jurnalStok",
          },
        ],
      },
      {
        label: "Suplai Gudang",
        href: "/dashboard/outlet/inventaris-suplai", // Href semu untuk parent
        icon: Truck,
        subItems: [
          {
            label: "Pengajuan Barang",
            href: "/dashboard/outlet/inventaris/pengajuanStok",
          },
          {
            label: "Terima Barang",
            href: "/dashboard/outlet/inventaris/penerimaanBarang",
          },
          {
            label: "Kirim Barang",
            href: "/dashboard/outlet/inventaris/pengirimanBarang",
          },
          {
            label: "Pembelian Stok",
            href: "/dashboard/outlet/inventaris/pembelianStok",
          },
        ],
      },
    ],
  },
  {
    grup: "Manajemen Shift",
    items: [
      {
        label: "Kalender Jadwal",
        href: "/dashboard/outlet/jadwal",
        icon: CalendarDays,
      },
      {
        label: "Pola Roster",
        href: "/dashboard/outlet/pola-roster",
        icon: CalendarRange,
      },
      {
        label: "Master Shift",
        href: "/dashboard/outlet/shift",
        icon: Clock,
      },
    ],
  },
  {
    grup: "Manajemen & Relasi",
    items: [
      {
        label: "Pelanggan",
        href: "/dashboard/outlet/pelanggan",
        icon: UserCircle,
      },
      {
        label: "Karyawan & Staff",
        href: "/dashboard/outlet/pengguna",
        icon: Users,
      },
      {
        label: "Pengaturan Outlet",
        href: "/dashboard/outlet/pengaturan",
        icon: Settings,
      },
    ],
  },
];

// --- 2. DEFINISI MENU GUDANG (WMS) ---
export const gudangMenus: MenuGroup[] = [
  {
    grup: null,
    items: [
      {
        label: "Dashboard WMS",
        href: "/dashboard/gudang",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    grup: "Manajemen Inventaris",
    items: [
      {
        label: "Barang Gudang",
        href: "/dashboard/gudang/inventaris",
        icon: Package,
      },
      {
        label: "Jurnal Stok",
        href: "/dashboard/gudang/jurnalStok",
        icon: BookOpen,
      },
      {
        label: "Stock Opname",
        href: "/dashboard/gudang/stockOpname",
        icon: ClipboardList,
      },
      {
        label: "Stock Adjustment",
        href: "/dashboard/gudang/stockAdjustment",
        icon: Scale,
      },
    ],
  },
  {
    grup: "Distribusi & WMS",
    items: [
      {
        label: "Pengajuan Stok",
        href: "/dashboard/gudang/pengajuanStok",
        icon: FileText,
      },
      {
        label: "Transfer Stok",
        href: "/dashboard/gudang/transferStok",
        icon: ArrowRightLeft,
      },
      {
        label: "Pengiriman Stok",
        href: "/dashboard/gudang/pengirimanStok",
        icon: Truck,
      },
      {
        label: "Penerimaan Stok",
        href: "/dashboard/gudang/penerimaanStok",
        icon: PackageCheck,
      },
      {
        label: "Pembelian Stok",
        href: "/dashboard/gudang/pembelianStok",
        icon: ShoppingCart,
      },
    ],
  },
  {
    grup: "Manajemen Shift",
    items: [
      {
        label: "Kalender Jadwal",
        href: "/dashboard/gudang/jadwal",
        icon: CalendarDays,
      },
      {
        label: "Pola Roster",
        href: "/dashboard/gudang/pola-roster",
        icon: CalendarRange,
      },
      {
        label: "Master Shift",
        href: "/dashboard/gudang/shift",
        icon: Clock,
      },
    ],
  },
  {
    grup: "Manajemen",
    items: [
      {
        label: "Petugas Gudang",
        href: "/dashboard/gudang/pengguna",
        icon: Users,
      },
      {
        label: "Pengaturan Gudang",
        href: "/dashboard/gudang/pengaturan",
        icon: Settings,
      },
    ],
  },
];
