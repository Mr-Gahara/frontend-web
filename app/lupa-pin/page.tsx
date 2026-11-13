import { Suspense } from "react";
import { HalamanResetPinOwner } from "@/features/auth/halaman-reset-pin-owner";

/** Suspense karena halaman membaca ?kembali= lewat useSearchParams. */
export default function LupaPinPage() {
  return (
    <Suspense fallback={null}>
      <HalamanResetPinOwner />
    </Suspense>
  );
}
