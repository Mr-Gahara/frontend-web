import type { Metadata } from "next";
import { HalamanGalat } from "@/components/galat/halaman-galat";

export const metadata: Metadata = { title: "Halaman tidak ditemukan · Tachyon POS" };

/** 404 rute yang tidak ada dan notFound() (desain A, halaman penuh). */
export default function NotFound() {
  return <HalamanGalat kode={404} />;
}
