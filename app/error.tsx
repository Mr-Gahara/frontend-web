"use client";

import { useEffect } from "react";
import { HalamanGalat } from "@/components/galat/halaman-galat";

/**
 * 500 halaman penuh (desain A): galat runtime di bawah root layout.
 * unstable_retry memuat ulang segmennya; digest dicantumkan agar dapat
 * dicocokkan dengan log server.
 */
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return <HalamanGalat kode={500} onCobaLagi={() => unstable_retry()} kodeGalat={error.digest} />;
}
