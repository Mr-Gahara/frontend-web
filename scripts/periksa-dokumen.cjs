// Pemeriksa kerapian dokumentasi di docs/. Hanya membaca, lalu mencetak temuan
// sebagai berkas:baris, agar pemeriksaan tidak perlu mengirim isi utuh.
// Pemakaian: node scripts/periksa-dokumen.cjs
const fs = require("fs");
const path = require("path");

const AKAR = path.join(__dirname, "..", "docs");
const BERKAS = [];
(function jelajah(dir) {
  for (const nama of fs.readdirSync(dir).sort()) {
    const p = path.join(dir, nama);
    if (fs.statSync(p).isDirectory()) jelajah(p);
    else if (nama.endsWith(".md")) BERKAS.push(p);
  }
})(AKAR);

// Nama berkas sebelum dokumentasi dipecah (20 September 2026). Hanya boleh
// muncul di catatan asal-usul.
const NAMA_LAMA = /refactor-progress\.md|kontrak-api\.md/;
const ASAL_USUL = /Sebelum 20 September|Awalnya satu berkas|dokumen asal|seluruh isi `kontrak\/`/;
// Nama .md yang bukan berkas di docs/: snapshot Playwright dan catatan untuk
// tim backend (disimpan di ~/Documents/catatan-backend/).
const BUKAN_DOKUMEN = /^(error-context|catatan-lanjutan-[a-z-]+)\.md$/;

const temuan = [];
const catat = (f, i, jenis, teks = "") =>
  temuan.push(`${path.relative(AKAR, f)}:${i + 1}: ${jenis}${teks ? ": " + teks.trim().slice(0, 90) : ""}`);

const prosa = (s) => s.trim() !== "" && !/^(\||#|```)/.test(s);
const awalDaftar = (s) => /^\s*([-*]|\d+\.)\s/.test(s);

for (const f of BERKAS) {
  const baris = fs.readFileSync(f, "utf8").split("\n");
  if (!(baris[2] || "").startsWith("Sifat perubahan:")) catat(f, 2, "label sifat perubahan tidak ada di bawah judul");

  let dalamKode = false;
  let pagar = 0;
  baris.forEach((b, i) => {
    if (/^\s*```/.test(b)) {
      dalamKode = !dalamKode;
      pagar++;
      return;
    }
    if (dalamKode) return;
    const sebelum = baris[i - 1] || "";
    const sesudah = baris[i + 1] || "";

    if (b.startsWith("|") && sebelum === "" && (baris[i - 2] || "").startsWith("|")) catat(f, i, "tabel terputus", b);
    if (b === "" && sebelum === "" && i > 0) catat(f, i, "baris kosong ganda");

    // Baris daftar satu baris memang boleh panjang; yang dicari adalah baris
    // di tengah paragraf yang dipatahkan, yang jauh melebihi tetangganya.
    const tetanggaPendek =
      (prosa(sebelum) && sebelum.length <= 82) || (prosa(sesudah) && !awalDaftar(sesudah) && sesudah.length <= 82);
    if (prosa(b) && !awalDaftar(b) && b.length > 85 && tetanggaPendek) catat(f, i, "baris kepanjangan", b);

    if (NAMA_LAMA.test(b) && !ASAL_USUL.test(sebelum + " " + b)) catat(f, i, "nama berkas lama", b);

    for (const m of b.matchAll(/`((?:docs\/)?(?:refactor\/|kontrak\/)?[a-z][a-z-]*\.md)`/g)) {
      const nama = m[1].replace(/^docs\//, "");
      if (NAMA_LAMA.test(nama) || BUKAN_DOKUMEN.test(nama)) continue;
      const ada = [nama, "refactor/" + nama, "kontrak/" + nama].some((n) => fs.existsSync(path.join(AKAR, n)));
      if (!ada) catat(f, i, "rujukan berkas tidak ada", m[1]);
    }
  });
  if (pagar % 2) catat(f, baris.length - 1, "blok kode tidak tertutup");
}

if (temuan.length === 0) {
  console.log(`Tidak ada temuan (${BERKAS.length} berkas).`);
} else {
  temuan.forEach((t) => console.log(t));
  console.log(`${temuan.length} temuan di ${BERKAS.length} berkas.`);
  process.exitCode = 1;
}