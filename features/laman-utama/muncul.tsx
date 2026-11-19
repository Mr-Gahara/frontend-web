"use client";

import { useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Pembungkus yang muncul saat digulir (LU4a): naik dari bawah saat bagian
 * masuk dari bawah layar, turun dari atas saat masuk dari atas layar, dan
 * kembali tersembunyi setelah keluar layar agar bergerak lagi di guliran
 * berikutnya. Atribut data-muncul hanya dipasang setelah hidrasi, sehingga
 * isinya tetap tampil tanpa JavaScript; bagian yang sudah di layar saat
 * dimuat tidak disembunyikan.
 */
export function Muncul({
  as: Tag = "div",
  tunda = 0,
  className,
  children,
  ...props
}: {
  as?: "div" | "section" | "li";
  tunda?: number;
  className?: string;
  children: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, "className" | "children">) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const kotak = el.getBoundingClientRect();
    const diLayar = kotak.top < window.innerHeight && kotak.bottom > 0;
    if (!diLayar) el.dataset.muncul = kotak.top >= window.innerHeight ? "bawah" : "atas";

    // Arah datang dihitung dari posisi saat ini: di bawah tengah layar berarti
    // akan masuk dari bawah. Dihitung ulang setiap guliran selama tersembunyi,
    // karena lompatan (tautan navbar, kembali ke atas) dapat melewati bagian
    // tanpa pernah memotong layar sehingga pengamat tidak terpicu.
    const arah = () =>
      el.getBoundingClientRect().top >= window.innerHeight / 2 ? "bawah" : "atas";
    let bingkai = 0;
    const saatGulir = () => {
      if (bingkai || el.dataset.muncul === "tampil") return;
      bingkai = requestAnimationFrame(() => {
        bingkai = 0;
        if (el.dataset.muncul !== "tampil") el.dataset.muncul = arah();
      });
    };

    const pengamat = new IntersectionObserver(
      ([e]) => {
        el.dataset.muncul = e.isIntersecting ? "tampil" : arah();
      },
      { threshold: 0.12 },
    );
    pengamat.observe(el);
    window.addEventListener("scroll", saatGulir, { passive: true });
    return () => {
      pengamat.disconnect();
      window.removeEventListener("scroll", saatGulir);
      cancelAnimationFrame(bingkai);
    };
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={cn("laman-muncul", className)}
      style={tunda ? ({ "--tunda": `${tunda}ms` } as React.CSSProperties) : undefined}
      {...props}
    >
      {children}
    </Tag>
  );
}
