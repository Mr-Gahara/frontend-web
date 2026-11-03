import { Suspense } from "react";
import { HalamanSetup } from "@/features/setup/halaman-setup";

export default function SetupPage() {
  return (
    <Suspense fallback={null}>
      <HalamanSetup />
    </Suspense>
  );
}