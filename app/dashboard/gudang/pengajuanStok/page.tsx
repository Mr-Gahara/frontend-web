"use client";

import HalamanDaftarPengajuanStok from "@/features/pengajuan-stok/halaman-daftar-pengajuan-stok";

// MVP: seluruh lokasi bertipe Gudang. Rencana per gudang dicatat di
// docs/refactor/keputusan.md (submodul pengajuan stok).
const LINGKUP_GUDANG = { tipeLokasi: "Gudang" } as const;

export default function PengajuanStokGudangPage() {
  return <HalamanDaftarPengajuanStok ruang="gudang" lingkup={LINGKUP_GUDANG} />;
}
