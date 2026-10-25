"use client";

import { use } from "react";
import HalamanRevisiTransfer from "@/features/transfer-stok/halaman-revisi-transfer";

export default function RevisiPengirimanBarangOutletPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <HalamanRevisiTransfer id={id} ruang="outlet" />;
}