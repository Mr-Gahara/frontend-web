"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { ambilPesanLogin } from "@/lib/auth/pesan-login";

/**
 * Layout area login. Memasang Toaster sendiri, karena Toaster dashboard
 * berada di dalam layout dashboard, dan menampilkan pesan yang dititipkan
 * sebelum sesi diakhiri (lib/auth/pesan-login.ts, keputusan PF7a).
 */
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const pesan = ambilPesanLogin();
    if (pesan) toast.success(pesan.judul, { description: pesan.deskripsi });
  }, []);

  return (
    <>
      {children}
      <Toaster richColors position="top-right" />
    </>
  );
}