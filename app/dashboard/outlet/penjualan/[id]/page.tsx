"use client";

import { useParams } from "next/navigation";
import HalamanDetailPenjualan from "@/features/penjualan/halaman-detail-penjualan";

export default function DetailPenjualanPage() {
  const params = useParams();
  return <HalamanDetailPenjualan id={params.id as string} />;
}
