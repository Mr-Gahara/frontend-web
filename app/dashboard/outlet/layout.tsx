"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/useSession";

export default function OutletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { status, permissions, sudahMasuk } = useSession();
  // Owner memegang seluruh permission di backend, sehingga tidak perlu
  // pemeriksaan nama role terpisah.
  const berwenang = sudahMasuk && permissions.includes("read-dashboard-outlet");

  useEffect(() => {
    if (status === "memuat") return;
    if (!sudahMasuk) {
      router.replace("/login");
      return;
    }
    if (!berwenang) router.replace("/dashboard");
  }, [status, sudahMasuk, berwenang, router]);

  if (!berwenang) {
    return null;
  }

  return <>{children}</>;
}