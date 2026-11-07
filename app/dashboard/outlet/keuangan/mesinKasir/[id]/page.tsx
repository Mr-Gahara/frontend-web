"use client";

import { useParams } from "next/navigation";
import { HalamanRincianSesi } from "@/features/sesi-kasir/halaman-rincian-sesi";

/** Rincian satu sesi buka-tutup kasir. */
export default function Page() {
  const params = useParams();
  return <HalamanRincianSesi id={params.id as string} />;
}
