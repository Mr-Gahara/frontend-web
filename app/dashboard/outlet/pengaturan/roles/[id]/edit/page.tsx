"use client";

import { useParams } from "next/navigation";
import FormRole from "@/features/role/form-role";

export default function EditRolePage() {
  const params = useParams();

  return (
    <FormRole
      roleId={params.id as string}
      judul="Edit Posisi"
      deskripsiHalaman="Perbarui nama jabatan atau sesuaikan ulang batasan wewenangnya."
      urlKembali="/dashboard/outlet/pengaturan/roles"
      labelKembali="Kembali ke Daftar Posisi"
    />
  );
}
