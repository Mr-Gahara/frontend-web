// Pemeriksaan bentuk dokumentasi: kerapian Markdown dan rujukan antarberkas.
const fs = require("fs");
const path = require("path");
const { DOCS, bacaBaris, temuanBaru } = require("./umum.cjs");

// Nama berkas sebelum dokumentasi dipecah (20 September 2026). Hanya boleh
// muncul di catatan asal-usul.
const NAMA_LAMA = /refactor-progress\.md|kontrak-api\.md/;
const ASAL_USUL = /Sebelum 20 September|Awalnya satu berkas|dokumen asal|seluruh isi `kontrak\/`/;
// Nama .md yang bukan berkas di docs/: snapshot Playwright dan catatan untuk
// tim backend (disimpan di ~/Documents/catatan-backend/).
const BUKAN_DOKUMEN = /^(error-context|catatan-lanjutan-[a-z-]+)\.md$/;

const prosa = (s) => s.trim() !== "" && !/^(\||#|\s*```)/.test(s);
const awalDaftar = (s) => /^\s*([-*]|\d+\.)\s/.test(s);

function periksaBentuk(berkas) {
  const temuan = [];
  for (const f of berkas) {
    const baris = bacaBaris(f);
    const teks = (i) => (baris[i] ? baris[i].teks : "");
    if (!teks(2).startsWith("Sifat perubahan:")) {
      temuan.push(temuanBaru(f, 3, "label sifat perubahan tidak ada di bawah judul"));
    }
    let pagar = 0;
    baris.forEach((b, i) => {
      if (b.pagar) {
        pagar++;
        return;
      }
      if (b.kode) return;
      const sebelum = teks(i - 1);
      const sesudah = teks(i + 1);

      if (b.teks.startsWith("|") && sebelum === "" && teks(i - 2).startsWith("|")) {
        temuan.push(temuanBaru(f, b.nomor, "tabel terputus", b.teks));
      }
      if (b.teks === "" && sebelum === "" && i > 0) temuan.push(temuanBaru(f, b.nomor, "baris kosong ganda"));

      // Baris daftar satu baris memang boleh panjang; yang dicari adalah baris
      // di tengah paragraf yang dipatahkan, yang jauh melebihi tetangganya.
      const tetanggaPendek =
        (prosa(sebelum) && sebelum.length <= 82) ||
        (prosa(sesudah) && !awalDaftar(sesudah) && sesudah.length <= 82);
      if (prosa(b.teks) && !awalDaftar(b.teks) && b.teks.length > 85 && tetanggaPendek) {
        temuan.push(temuanBaru(f, b.nomor, "baris kepanjangan", b.teks));
      }

      if (NAMA_LAMA.test(b.teks) && !ASAL_USUL.test(sebelum + " " + b.teks)) {
        temuan.push(temuanBaru(f, b.nomor, "nama berkas lama", b.teks));
      }

      for (const m of b.teks.matchAll(/`((?:docs\/)?(?:refactor\/|kontrak\/)?[a-z][a-z-]*\.md)`/g)) {
        const nama = m[1].replace(/^docs\//, "");
        if (NAMA_LAMA.test(nama) || BUKAN_DOKUMEN.test(nama)) continue;
        const ada = [nama, "refactor/" + nama, "kontrak/" + nama].some((n) => fs.existsSync(path.join(DOCS, n)));
        if (!ada) temuan.push(temuanBaru(f, b.nomor, "rujukan berkas tidak ada", m[1]));
      }
    });
    if (pagar % 2) temuan.push(temuanBaru(f, baris.length, "blok kode tidak tertutup"));
  }
  return temuan;
}

module.exports = { periksaBentuk };