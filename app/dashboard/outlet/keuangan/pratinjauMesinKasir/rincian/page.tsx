import { notFound } from "next/navigation";
import { PratinjauRincianSesi } from "@/features/sesi-kasir/pratinjau";

/** Pratinjau development rincian satu sesi kasir contoh; tidak ada di produksi. */
export default async function Page({ searchParams }: { searchParams: Promise<{ sesi?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { sesi } = await searchParams;
  return <PratinjauRincianSesi idSesi={sesi ?? null} />;
}