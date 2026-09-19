"use client";

import FormRole from "@/features/role/form-role";

export default function BuatRoleKostumPage() {
  return (
    <FormRole
      judul="Tambah Posisi Kustom"
      deskripsiHalaman="Tentukan nama jabatan dan pilih wewenang yang dibutuhkan."
      urlKembali="/dashboard/outlet/pengaturan/roles/buatRole"
      labelKembali="Kembali ke Pilih Template"
    />
  );
}
