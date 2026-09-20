import { AlertTriangle } from "lucide-react";

export default function PesanLokasi({ judul, isi }: { judul: string; isi: string }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm flex flex-col items-center text-center gap-4 py-12">
      <AlertTriangle className="w-12 h-12 text-rose-500" />
      <div>
        <h2 className="text-xl font-bold text-rose-700">{judul}</h2>
        <p className="text-sm font-medium text-rose-600/80 mt-1 max-w-md mx-auto">{isi}</p>
      </div>
    </div>
  );
}