import { Button } from "@/components/ui/button";

/** Pesan galat satu panel beserta tombol muat ulang; role=alert agar dibacakan. */
export function PesanGagal({ pesan, ulangi }: { pesan: string; ulangi: () => void }) {
  return (
    <div
      role="alert"
      className="bg-white rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-3 shadow-sm"
    >
      <span className="text-sm font-medium text-red-700">{pesan}</span>
      <Button
        type="button"
        variant="outline"
        onClick={ulangi}
        className="min-h-11 border-navy text-navy font-semibold"
      >
        Coba lagi
      </Button>
    </div>
  );
}