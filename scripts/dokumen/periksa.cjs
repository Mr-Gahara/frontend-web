// Pemeriksa dokumentasi: bentuk, fakta yang dapat dihitung, dan bagian Tetap.
// Pemakaian: npm run --silent docs:periksa [-- --metrik] [-- --izinkan-tetap]
const { daftarDokumen, cobaJalankan } = require("./umum.cjs");
const { periksaBentuk } = require("./bentuk.cjs");
const { periksaFakta } = require("./fakta.cjs");
const { periksaTetap } = require("./tetap.cjs");

const argumen = process.argv.slice(2);
// Metrik dihitung ulang bila diminta, atau otomatis saat status.md sedang
// diubah (menutup modul), karena saat itulah angkanya harus benar.
const statusBerubah = Boolean(cobaJalankan("git status --porcelain docs/refactor/status.md"));
const metrik = argumen.includes("--metrik") || statusBerubah;
const izinkanTetap = argumen.includes("--izinkan-tetap");

const berkas = daftarDokumen();
const kelompok = [
  ["bentuk", periksaBentuk(berkas)],
  [metrik ? "fakta dan metrik" : "fakta", periksaFakta(berkas, { metrik })],
];
if (!izinkanTetap) kelompok.push(["bagian Tetap", periksaTetap(berkas)]);

let jumlah = 0;
for (const [nama, temuan] of kelompok) {
  if (!temuan.length) continue;
  jumlah += temuan.length;
  console.log(`== ${nama} (${temuan.length})`);
  temuan.forEach((t) => console.log(t));
}
const cakupan = kelompok.map(([n]) => n).join(", ") + (izinkanTetap ? "; bagian Tetap diizinkan berubah" : "");
if (jumlah === 0) {
  console.log(`Tidak ada temuan (${berkas.length} berkas; ${cakupan}).`);
} else {
  console.log(`${jumlah} temuan di ${berkas.length} berkas (${cakupan}).`);
  process.exitCode = 1;
}