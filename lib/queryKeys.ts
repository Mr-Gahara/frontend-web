/**
 * Kunci cache React Query.
 *
 * Sebelumnya kunci ditulis campur: 61 tempat memakai array literal dan 151
 * memakai factory, dengan penamaan yang tidak seragam. Akibatnya beberapa
 * cache terpisah walau datanya sama, sehingga invalidasi meleset:
 *   - ["lokasi", "outlet-only"], ["lokasi-current-active-tenant"], dan
 *     queryKeys.lokasi adalah tiga cache berbeda untuk data lokasi yang sama
 *   - invalidasi ["inventory"] tidak membatalkan ["inventory", { locationID }]
 *
 * Struktur di bawah memakai pola hierarkis: setiap domain punya akar `semua`,
 * dan varian berada di bawahnya. React Query mencocokkan kunci secara prefix,
 * sehingga invalidateQueries pada akar membatalkan seluruh turunannya.
 */

type Filter = Record<string, unknown> | undefined;
type Workspace = "outlet" | "gudang" | "keduanya" | string;

const kunci = <T extends readonly unknown[]>(k: T) => k;

export const queryKeys = {
  // --- Master data produk ---
  produk: {
    semua: kunci(["produk"] as const),
    daftar: (filter?: Filter) => ["produk", "daftar", filter] as const,
    detail: (id: string) => ["produk", "detail", id] as const,
    pajak: (produkId: string) => ["produk", "pajak", produkId] as const,
  },
  kategori: {
    semua: kunci(["kategori"] as const),
    daftar: () => ["kategori", "daftar"] as const,
  },
  bahanBaku: {
    semua: kunci(["bahanBaku"] as const),
    daftar: () => ["bahanBaku", "daftar"] as const,
    detail: (id: string) => ["bahanBaku", "detail", id] as const,
  },

  // --- Inventaris dan gudang ---
  lokasi: {
    semua: kunci(["lokasi"] as const),
    daftar: (filter?: Filter) => ["lokasi", "daftar", filter] as const,
    aktif: () => ["lokasi", "aktif"] as const,
  },
  inventory: {
    semua: kunci(["inventory"] as const),
    daftar: (filter?: Filter) => ["inventory", "daftar", filter] as const,
    detail: (id: string) => ["inventory", "detail", id] as const,
  },
  jurnalStok: {
    semua: kunci(["jurnalStok"] as const),
    daftar: (filter?: Filter) => ["jurnalStok", "daftar", filter] as const,
    detail: (id: string) => ["jurnalStok", "detail", id] as const,
  },
  stockOpname: {
    semua: kunci(["stockOpname"] as const),
    daftar: (filter?: Filter) => ["stockOpname", "daftar", filter] as const,
    detail: (id: string) => ["stockOpname", "detail", id] as const,
  },
  stockAdjustment: {
    semua: kunci(["stockAdjustment"] as const),
    daftar: (filter?: Filter) => ["stockAdjustment", "daftar", filter] as const,
    detail: (id: string) => ["stockAdjustment", "detail", id] as const,
  },
  pengajuanStok: {
    semua: kunci(["pengajuanStok"] as const),
    daftar: (filter?: Filter) => ["pengajuanStok", "daftar", filter] as const,
    detail: (id: string) => ["pengajuanStok", "detail", id] as const,
  },
  transferStok: {
    semua: kunci(["transferStok"] as const),
    daftar: (filter?: Filter) => ["transferStok", "daftar", filter] as const,
    detail: (id: string) => ["transferStok", "detail", id] as const,
  },

  // --- Penjualan dan keuangan ---
  penjualan: {
    semua: kunci(["penjualan"] as const),
    daftar: (filter?: Filter) => ["penjualan", "daftar", filter] as const,
    detail: (id: string) => ["penjualan", "detail", id] as const,
  },
  pembayaran: {
    semua: kunci(["pembayaran"] as const),
    daftar: (filter?: Filter) => ["pembayaran", "daftar", filter] as const,
  },
  metodePembayaran: {
    semua: kunci(["metodePembayaran"] as const),
    daftar: () => ["metodePembayaran", "daftar"] as const,
    detail: (id: string) => ["metodePembayaran", "detail", id] as const,
  },
  akunKas: {
    semua: kunci(["akunKas"] as const),
    daftar: () => ["akunKas", "daftar"] as const,
  },
  diskon: {
    semua: kunci(["diskon"] as const),
    daftar: (filter?: Filter) => ["diskon", "daftar", filter] as const,
  },
  pajak: {
    semua: kunci(["pajak"] as const),
    daftar: () => ["pajak", "daftar"] as const,
  },
  laporan: {
    semua: kunci(["laporan"] as const),
    labaRugi: (filter?: Filter) => ["laporan", "labaRugi", filter] as const,
  },
  pelanggan: {
    semua: kunci(["pelanggan"] as const),
    daftar: (filter?: Filter) => ["pelanggan", "daftar", filter] as const,
  },

  // --- Reservasi ---
  aset: {
    semua: kunci(["aset"] as const),
    daftar: () => ["aset", "daftar"] as const,
    detail: (id: string) => ["aset", "detail", id] as const,
  },
  tipeAset: {
    semua: kunci(["tipeAset"] as const),
    daftar: () => ["tipeAset", "daftar"] as const,
    detail: (id: string) => ["tipeAset", "detail", id] as const,
  },
  tarif: {
    semua: kunci(["tarif"] as const),
    daftar: () => ["tarif", "daftar"] as const,
    detail: (id: string) => ["tarif", "detail", id] as const,
  },
  sesiBooking: {
    semua: kunci(["sesiBooking"] as const),
    daftar: (tanggal?: string) => ["sesiBooking", "daftar", tanggal] as const,
    banyakTanggal: (tanggal: string[]) => ["sesiBooking", "banyakTanggal", tanggal] as const,
  },

  // --- SDM ---
  shift: {
    semua: kunci(["shift"] as const),
    daftar: (filter?: Filter) => ["shift", "daftar", filter] as const,
    detail: (id: string) => ["shift", "detail", id] as const,
  },
  polaRoster: {
    semua: kunci(["polaRoster"] as const),
    daftar: (filter?: Filter) => ["polaRoster", "daftar", filter] as const,
  },
  jadwalShift: {
    semua: kunci(["jadwalShift"] as const),
    daftar: (filter?: Filter) => ["jadwalShift", "daftar", filter] as const,
  },
  absensi: {
    semua: kunci(["absensi"] as const),
    monitoring: (tanggal: string) => ["absensi", "monitoring", tanggal] as const,
  },

  // --- IAM ---
  pengguna: {
    semua: kunci(["pengguna"] as const),
    daftar: (workspace?: Workspace) => ["pengguna", "daftar", workspace] as const,
    detail: (id: string) => ["pengguna", "detail", id] as const,
  },
  roles: {
    semua: kunci(["roles"] as const),
    daftar: () => ["roles", "daftar"] as const,
    detail: (id: string) => ["roles", "detail", id] as const,
  },
  permissions: {
    semua: kunci(["permissions"] as const),
    daftar: () => ["permissions", "daftar"] as const,
  },
} as const;