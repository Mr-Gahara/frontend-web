export interface Kategori {
  id: string;
  namaKategori: string;
  kodeKategori: string;
  keterangan?: string | null;
  /** Id toko; sejak backend P72 (B305) tidak lagi di-populate dengan nama toko. */
  tenantID?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KategoriRequest {
  namaKategori: string;
  kodeKategori: string;
  keterangan?: string;
}
