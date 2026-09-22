"use client";

import { use } from "react";
import HalamanDetailPenerimaan from "@/features/transfer-stok/halaman-detail-penerimaan";

export default function EksekusiPenerimaanBarangPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <HalamanDetailPenerimaan id={id} />;
}
