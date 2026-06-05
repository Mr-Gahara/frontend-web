export const queryKeys = {
  kategori: ["kategori"] as const,
  diskon: ["diskon"] as const,
  pajak: ["pajak"] as const,
  pengguna: ["pengguna"] as const,
  produk: ["produk"] as const,
  roles: ["roles"] as const,

  produkPajak: (produkId: string) => ["produk-pajak", produkId] as const,

  produkDetail: (id: string) => ["produk", "detail", id] as const,

  permissions: ["permissions"] as const,
  
  roleDetail: (id: string) => ["role", "detail", id] as const,
  penggunaDetail: (id: string) => ["pengguna", "detail", id] as const,
};
