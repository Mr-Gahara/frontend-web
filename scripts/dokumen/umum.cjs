// Bagian bersama pemeriksa dokumentasi: daftar berkas, pembaca baris, git.
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const REPO = path.join(__dirname, "..", "..");
const DOCS = path.join(REPO, "docs");

/** Seluruh berkas .md di docs/, terurut. */
function daftarDokumen() {
  const hasil = [];
  (function jelajah(dir) {
    for (const nama of fs.readdirSync(dir).sort()) {
      const p = path.join(dir, nama);
      if (fs.statSync(p).isDirectory()) jelajah(p);
      else if (nama.endsWith(".md")) hasil.push(p);
    }
  })(DOCS);
  return hasil;
}

/** Baris berkas beserta nomornya dan penanda apakah baris itu bagian blok kode. */
function bacaBaris(f) {
  let dalamKode = false;
  return fs
    .readFileSync(f, "utf8")
    .split("\n")
    .map((teks, i) => {
      const pagar = /^\s*```/.test(teks);
      const baris = { teks, nomor: i + 1, pagar, kode: dalamKode || pagar };
      if (pagar) dalamKode = !dalamKode;
      return baris;
    });
}

function relatif(f) {
  return path.relative(DOCS, f);
}

/** Menjalankan perintah shell dari akar repo; melempar bila gagal. */
function jalankan(perintah) {
  return execSync(perintah, {
    cwd: REPO,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
    shell: "/bin/bash",
  }).trim();
}

/** Seperti jalankan, tetapi mengembalikan null bila perintah gagal. */
function cobaJalankan(perintah) {
  try {
    return jalankan(perintah);
  } catch {
    return null;
  }
}

/** Isi berkas di HEAD, atau null bila berkas belum ada di HEAD. */
function isiDiHead(f) {
  return cobaJalankan(`git show "HEAD:${path.relative(REPO, f)}"`);
}

function temuanBaru(f, nomor, jenis, teks = "") {
  return `${relatif(f)}:${nomor}: ${jenis}${teks ? ": " + String(teks).trim().slice(0, 90) : ""}`;
}

module.exports = { REPO, DOCS, daftarDokumen, bacaBaris, relatif, jalankan, cobaJalankan, isiDiHead, temuanBaru };