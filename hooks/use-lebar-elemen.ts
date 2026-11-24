"use client";

import * as React from "react";

/**
 * Lebar sebuah elemen yang terus diikuti lewat ResizeObserver; null sebelum
 * elemen terpasang dan terukur. Untuk tata letak yang bergantung pada lebar
 * wadahnya sendiri, bukan lebar layar (keputusan rancangan butir 31), bila
 * perubahan itu tidak dapat diungkapkan dengan CSS saja, misalnya memilih
 * kolom tabel.
 */
export function useLebarElemen<T extends HTMLElement>() {
  const ref = React.useRef<T>(null);
  const [lebar, setLebar] = React.useState<number | null>(null);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setLebar(el.getBoundingClientRect().width);
    const pengamat = new ResizeObserver(([entri]) => setLebar(entri.contentRect.width));
    pengamat.observe(el);
    return () => pengamat.disconnect();
  }, []);

  return { ref, lebar };
}
