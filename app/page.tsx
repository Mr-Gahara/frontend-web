import type { Metadata } from "next";
import { LamanUtama } from "@/features/laman-utama/laman-utama";

export const metadata: Metadata = {
  title: "Tachyon POS: kasir, stok, keuangan, dan shift dalam satu aplikasi",
  description:
    "Aplikasi kasir untuk kafe, kedai, dan toko: kasir, stok bahan baku, keuangan, jadwal shift, sampai gudang yang memasok outlet.",
};

export default function Home() {
  return <LamanUtama />;
}
