"use client";

import { use } from "react";
import HalamanDetailTransfer from "@/features/transfer-stok/halaman-detail-transfer";

export default function DetailPengirimanBarangOutletPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <HalamanDetailTransfer id={id} ruang="outlet" />;
}