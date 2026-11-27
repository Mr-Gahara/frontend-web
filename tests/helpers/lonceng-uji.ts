/**
 * Permintaan lonceng topbar (features/notifikasi, modul/pemberitahuan.md)
 * dikirim di setiap halaman dashboard, ke endpoint daftar yang juga ditunggu
 * spec modul. Penunggu daftar memakai syarat ini agar tidak menangkap
 * respons lonceng (LN7a; pola "Penunggu daftar menerima respons dengan
 * query yang tidak diharapkan" di inti/pengujian.md).
 *
 * Ciri setiap permintaan lonceng (features/notifikasi/api.ts):
 * - GET /inventory dan /stockopname untuk hitungan: limit=1;
 * - GET /pengajuanstok status=APPROVED,PENDING,COMPLETED,REJECTED;
 * - GET /sesikasir status=BUKA dengan page=1, tanpa rentang tanggal;
 * - GET /izincuti status=diajukan;
 * - GET /penjualan untuk hitungan: limit=1;
 * - GET /membership dan /diskon status=Aktif tanpa paginasi.
 * Booking per tanggal, monitoring absensi, dan jadwal hari ini berbentuk
 * sama dengan permintaan halaman, sehingga tidak dikenali di sini;
 * penunggunya disyaratkan lewat query khas halamannya. Sejak PW07 lonceng
 * tidak lagi meminta GET /produk; pemicu stok dari GET /dashboard/outlet.
 */
export function dariLonceng(url: string): boolean {
  const u = new URL(url);
  const q = u.searchParams;
  const jalur = u.pathname.replace(/^\/api/, "");
  if ((jalur === "/inventory" || jalur === "/stockopname") && q.get("limit") === "1") return true;
  if (jalur === "/pengajuanstok" && q.get("status") === "APPROVED,PENDING,COMPLETED,REJECTED") return true;
  // Kasir buka milik Mesin Kasir dikirim tanpa page; milik lonceng page=1&limit=20.
  if (jalur === "/sesikasir" && q.get("status") === "BUKA" && q.get("page") === "1" && !q.has("dari")) return true;
  if (jalur === "/izincuti" && q.get("status") === "diajukan" && !q.has("dari")) return true;
  if (jalur === "/penjualan" && q.get("limit") === "1") return true;
  if ((jalur === "/membership" || jalur === "/diskon") && q.get("status") === "Aktif" && !q.has("page")) return true;
  return false;
}
