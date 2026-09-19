export interface Kategori {
  id: string;
  namaKategori: string;
  kodeKategori: string;
  keterangan?: string | null;
  /** Di-populate backend dengan nama toko. */
  tenantID?: { id: string; namaToko: string };
  createdAt: string;
  updatedAt: string;
}

export interface KategoriRequest {
  namaKategori: string;
  kodeKategori: string;
  keterangan?: string;
}
