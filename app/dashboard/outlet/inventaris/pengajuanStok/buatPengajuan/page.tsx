"use client";

import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { FormPengajuanStok } from "@/features/pengajuan-stok/form-pengajuan-stok";

export default function BuatPengajuanStokPage() {
  useAuthGuard();
  return <FormPengajuanStok />;
}
