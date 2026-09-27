import Link from "next/link";
import type { ReactNode } from "react";

/** Membungkus blok booking dengan tautan ke detail penjualannya bila ada (keputusan R4b). */
export function TautanPenjualanBooking({
  href,
  children,
}: {
  href: string | null;
  children: ReactNode;
}) {
  if (!href) return <>{children}</>;
  return (
    <Link href={href} className="block w-full h-full">
      {children}
    </Link>
  );
}