"use client";

import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { FormProduk } from "@/features/produk/form-produk";

export default function BuatProdukPage() {
  useAuthGuard();
  return <FormProduk mode="buat" />;
}