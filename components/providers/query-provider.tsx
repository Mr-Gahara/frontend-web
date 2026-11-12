"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Fragment, useEffect, useState } from "react";
import { bacaSesi, langgananSesi } from "@/lib/auth/session";
import { periksaPemilikCache, type PemilikCache } from "@/lib/auth/pemilik-cache";

export function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // Naik setiap identitas berganti; dipakai sebagai key agar seluruh
  // komponen dipasang ulang dan tidak menahan query yang sudah dibuang.
  const [generasi, setGenerasi] = useState(0);

  // Cache milik satu akun dan satu pengguna: dibersihkan begitu akun atau
  // pengguna lain masuk di tab yang sama, termasuk lewat refresh token setelah
  // tab lain berganti akun (lib/auth/pemilik-cache.ts).
  useEffect(() => {
    let pemilik: PemilikCache = { akunID: null, penggunaID: null };
    const periksa = () => {
      const hasil = periksaPemilikCache(pemilik, bacaSesi());
      pemilik = hasil.pemilik;
      if (hasil.bersihkan) {
        queryClient.clear();
        setGenerasi((g) => g + 1);
      }
    };
    periksa();
    return langgananSesi(periksa);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <Fragment key={generasi}>{children}</Fragment>
    </QueryClientProvider>
  );
}
