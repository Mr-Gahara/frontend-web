import { Suspense } from "react";
import { HalamanVerifikasiEmail } from "@/features/auth/halaman-verifikasi-email";

export default function VerifikasiEmailPage() {
  return (
    <Suspense fallback={null}>
      <HalamanVerifikasiEmail />
    </Suspense>
  );
}