"use client";

import { Geist } from "next/font/google";
import { HalamanGalat } from "@/components/galat/halaman-galat";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

/** 500 saat root layout sendiri gagal; menggantikan root layout, sehingga memuat html, body, gaya, dan font sendiri. */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="id" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <HalamanGalat kode={500} onCobaLagi={() => unstable_retry()} kodeGalat={error.digest} />
      </body>
    </html>
  );
}
