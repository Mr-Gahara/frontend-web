export const queryKeys = {
  kategori: ["kategori"] as const,
  diskon: ["diskon"] as const,
  pajak: ["pajak"] as const,
  pengguna: ["pengguna"] as const,
  produk: ["produk"] as const,
  roles: ["roles"] as const,
  metodePembayaran: ["metodePembayaran"] as const,
  akunKas: ["akunKas"] as const,

  // Modul Inventory & Stock Opname
  stockOpname: ["stockOpname"] as const,
  stockOpnameDetail: (id: string) => ["stockOpname", "detail", id] as const,
  stockAdjustment: ["stockAdjustment"] as const,
  stockAdjustmentDetail: (id: string) =>
    ["stockAdjustment", "detail", id] as const,

  produkPajak: (produkId: string) => ["produk-pajak", produkId] as const,
  produkDetail: (id: string) => ["produk", "detail", id] as const,
  permissions: ["permissions"] as const,
  roleDetail: (id: string) => ["role", "detail", id] as const,
  penggunaDetail: (id: string) => ["pengguna", "detail", id] as const,
  penjualan: ["penjualan"] as const,
  penjualanDetail: (id: string) => ["penjualan", "detail", id] as const,
  pelanggan: ["pelanggan"] as const,
  absensiMonitoring: (tanggal: string) =>
    ["absensi-monitoring", tanggal] as const,
  bahanBaku: ["bahan-baku"] as const,
  bahanBakuDetail: (id: string) => ["bahan-baku", "detail", id] as const,
  inventory: ["inventory"] as const,
  inventoryDetail: (id: string) => ["inventory", id] as const,

  // Modul Reservasi & Aset
  tarif: ["tarif"] as const,
  tarifDetail: (id: string) => ["tarif", "detail", id] as const,

  tipeAset: ["tipeAset"] as const,
  aset: ["aset"] as const,

  sesiBooking: (tanggal: string) => ["sesi-booking", tanggal] as const,
};
