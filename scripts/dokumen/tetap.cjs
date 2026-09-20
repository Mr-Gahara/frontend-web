// Penjaga bagian Tetap: isinya dibandingkan dengan HEAD dan hanya boleh
// berubah atas perintah pemilik proyek (opsi --izinkan-tetap).
const fs = require("fs");
const { isiDiHead, temuanBaru } = require("./umum.cjs");

/** Isi satu bagian "## judul" sampai sebelum "## " berikutnya. */
function bagian(teks, judul) {
  const baris = teks.split("\n");
  const a = baris.indexOf("## " + judul);
  if (a < 0) return null;
  let z = baris.findIndex((b, i) => i > a && b.startsWith("## "));
  if (z < 0) z = baris.length;
  return baris.slice(a, z).join("\n").trim();
}

/** Daftar [nama, isi] yang dijaga: berkas berlabel Tetap dan bagian bertanda tetap. */
function unitTetap(teks) {
  const unit = [];
  const baris = teks.split("\n");
  const label = baris[2] || "";
  if (label.startsWith("Sifat perubahan: **Tetap**")) {
    const kecuali = /kecuali peta dokumen/.test(label) ? "Peta dokumen" : null;
    const isi = kecuali ? teks.replace(bagian(teks, kecuali) || "", "") : teks;
    unit.push([kecuali ? `seluruh berkas kecuali ${kecuali}` : "seluruh berkas", isi.trim()]);
  }
  baris.forEach((b, i) => {
    if (!b.startsWith("## ")) return;
    const pertama = baris.slice(i + 1).find((x) => x.trim() !== "") || "";
    if (pertama.startsWith("Bagian **tetap**")) unit.push([b.slice(3), bagian(teks, b.slice(3))]);
  });
  return unit;
}

function periksaTetap(berkas) {
  const temuan = [];
  for (const f of berkas) {
    const lama = isiDiHead(f);
    if (lama === null) continue;
    const unitLama = new Map(unitTetap(lama));
    const unitBaru = new Map(unitTetap(fs.readFileSync(f, "utf8")));
    for (const [nama, isi] of unitLama) {
      if (!unitBaru.has(nama)) temuan.push(temuanBaru(f, 1, "bagian Tetap hilang atau labelnya berubah", nama));
      else if (unitBaru.get(nama) !== isi) temuan.push(temuanBaru(f, 1, "bagian Tetap berubah", nama));
    }
  }
  return temuan;
}

module.exports = { periksaTetap };