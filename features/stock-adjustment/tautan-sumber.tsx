import Link from "next/link";
import type { StockAdjustment } from "@/types/stockOpname";
import { susunSumber } from "./tampilan";

interface Props {
  adjustment: Pick<StockAdjustment, "referenceType" | "referenceID" | "lokasi">;
  className?: string;
}

/** Label sumber adjustment, bertaut ke dokumen stock opname bila ada. */
export function TautanSumber({ adjustment, className = "" }: Props) {
  const sumber = susunSumber(adjustment);
  if (!sumber.href) return <span className={className}>{sumber.label}</span>;
  return (
    <Link href={sumber.href} className={`${className} underline underline-offset-2`}>
      {sumber.label}
    </Link>
  );
}