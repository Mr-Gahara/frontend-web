/**
 * Definisi menu sidebar per ruang kerja. Dipisah dari komponen sidebar
 * (keputusan PF4a); kelayakan tiap menu tetap ditentukan izin endpoint
 * halamannya di lib/auth/permissions.ts, bukan di sini.
 */
import type * as React from "react";
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
  BookOpen,
  ClipboardList,
  Scale,
  Archive,
  CalendarDays,
  CalendarRange,
  Clock,
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
        ],
      },
      {
        label: "Laporan",
        href: "/dashboard/outlet/keuangan/ringkasanLabaRugi",
        icon: FileText,
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
            label: "Minta Barang",
            href: "/dashboard/outlet/inventaris/pengajuanStok",
          },
          {
            label: "Terima Barang",
            href: "/dashboard/outlet/inventaris/penerimaanBarang",
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
