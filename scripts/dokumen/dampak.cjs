// Pencarian dampak: seluruh baris dokumentasi yang menyebut hal yang berubah,
// untuk dinilai satu per satu (masih benar, perbarui, atau hapus).
// Pemakaian: npm run --silent docs:dampak -- [--commit <hash>] [istilah ...]
const path = require("path");
const { daftarDokumen, bacaBaris, relatif, jalankan } = require("./umum.cjs");

// Nama berkas yang terlalu umum untuk dijadikan istilah.
const UMUM = new Set(["page", "layout", "index", "route", "api", "hooks", "schema", "payload", "izin", "tampilan", "filter", "pesan", "types", "constants", "lokasi"]);

/** Istilah dari berkas yang diubah sebuah commit (tanpa docs/). */
function istilahDariCommit(rev) {
  const istilah = new Set();
  const berkas = jalankan(`git diff-tree --no-commit-id --name-only -r ${rev}`)
    .split("\n")
    .filter((p) => p && !p.startsWith("docs/"));
  for (const p of berkas) {
    const bagian = p.split("/");
    if (bagian[0] === "app" && bagian[1] === "dashboard") {
      // Rute halaman, tanpa segmen dinamis: outlet/inventaris/stok
      const rute = bagian.slice(2, -1).filter((s) => !s.startsWith("[")).join("/");
      if (rute) istilah.add(rute);
      continue;
    }
    if (bagian[0] === "features" && bagian[1]) istilah.add(bagian[1]);
    const nama = path.basename(p).replace(/(\.spec|\.test)?\.(tsx?|c?js|json)$/, "");
    if (!UMUM.has(nama) && nama.length >= 4) istilah.add(nama);
  }
  // Dokumentasi menyebut hal yang sama dalam bentuk prosa: jurnalStok dan
  // jurnal-stok juga dicari sebagai "jurnal stok". Istilah satu kata tidak
  // ditambahkan karena terlalu umum.
  for (const t of [...istilah]) {
    const kata = t.split("/").pop().replace(/([a-z])([A-Z])/g, "$1 $2").replace(/-/g, " ").toLowerCase();
    if (kata.includes(" ")) istilah.add(kata);
  }
  return istilah;
}

const argumen = process.argv.slice(2);
const istilah = new Set();
for (let i = 0; i < argumen.length; i++) {
  if (argumen[i] === "--commit") istilahDariCommit(argumen[++i]).forEach((x) => istilah.add(x));
  else istilah.add(argumen[i]);
}
if (!istilah.size) {
  console.error('Pemakaian: npm run --silent docs:dampak -- [--commit <hash>] ["istilah" ...]');
  process.exit(2);
}

// route-backend.md dibangkitkan dari backend dan bertanda Tetap, jadi dilewati.
const semua = daftarDokumen()
  .filter((f) => !f.endsWith("route-backend.md"))
  .flatMap((f) => bacaBaris(f).map((b) => ({ ...b, berkas: relatif(f) })));

const unik = new Set();
for (const t of istilah) {
  const kecil = t.toLowerCase();
  const cocok = semua.filter((b) => b.teks.toLowerCase().includes(kecil));
  console.log(`== ${t} (${cocok.length} baris)`);
  for (const b of cocok) {
    const kunci = `${b.berkas}:${b.nomor}`;
    unik.add(kunci);
    console.log(`${kunci}${b.kode ? " [kode]" : ""}${/^#{1,6} /.test(b.teks) ? " [judul]" : ""}: ${b.teks.trim().slice(0, 100)}`);
  }
}
console.log(`${unik.size} baris unik untuk ${istilah.size} istilah. Nilai setiap baris: masih benar, perbarui, atau hapus.`);