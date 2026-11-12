"use client";

import { useEffect, useMemo } from "react";

/** URL objek untuk sebuah Blob, dicabut saat Blob berganti atau komponen dilepas. */
export function useUrlObjek(berkas: Blob | null | undefined): string | null {
  const url = useMemo(() => (berkas ? URL.createObjectURL(berkas) : null), [berkas]);
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  return url;
}
