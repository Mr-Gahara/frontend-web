"use client";

import { useParams } from "next/navigation";
import HalamanPembayaranPenjualan from "@/features/penjualan/halaman-pembayaran-penjualan";

export default function BuatPembayaranPage() {
  const params = useParams();
  return <HalamanPembayaranPenjualan id={params.id as string} />;
}
