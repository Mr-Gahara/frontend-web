import { Suspense } from "react";
import { HalamanLoginPengguna } from "@/features/auth/halaman-login-pengguna";

/** Suspense karena halaman membaca ?kembali= lewat useSearchParams. */
export default function PenggunaLoginPage() {
  return (
    <Suspense fallback={null}>
      <HalamanLoginPengguna />
    </Suspense>
  );
}
