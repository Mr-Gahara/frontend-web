# Cara Kerja

Sifat perubahan: **Jarang**: bertambah saat ada pelajaran. "Alur setiap perubahan" dan "Aturan blok perintah" **tetap**.

Aturan kerja sehari-hari: alur setiap perubahan, blok perintah, helper,
catatan alat, dan disiplin yang lahir dari kesalahan sebelumnya. Alur setiap
perubahan dan aturan blok perintah ditetapkan pemilik proyek dan hanya diubah
atas permintaannya; bagian lain bertambah setiap ada pelajaran baru.

## Alur setiap perubahan

Bagian **tetap**: hanya diubah atas perintah pemilik proyek.

1. Komparasi lama dan baru, ditulis lengkap tanpa placeholder.
2. Blok perintah siap tempel yang menerapkannya (menjalankannya adalah persetujuan).
3. Perintah verifikasi: `tsc`, ESLint, dan pemeriksaan hasil.
4. Menjalankan test yang ada, menambah skenario untuk perubahan itu, menjalankan ulang.
5. Sebelum commit: vitest penuh dan suite e2e penuh, dibandingkan dengan
   baseline. Seluruhnya harus lolos, bukan hanya spec modul.
6. Setelah lolos: `git add`, commit dengan pesan lengkap (masalah, keputusan rancangan beserta alasan, dampak, pengujian), lalu push.

Tidak ada perubahan yang diterapkan tanpa persetujuan. Komparasi dan blok
penerapnya dikirim dalam respons yang sama, dan menjalankan blok itulah bentuk
persetujuannya. Setelah dijalankan, hasilnya diverifikasi sebelum melangkah ke
perubahan berikutnya.

## Aturan blok perintah

Bagian **tetap**: hanya diubah atas perintah pemilik proyek.

- Hanya berisi perintah, tanpa baris komentar atau judul di dalamnya.
- Efisien, tidak memakai pager, output ringkas dan mudah disalin.
- Berkas baru di repo frontend-web diberikan sebagai isi lengkap untuk dibuat
  manual, tanpa perintah terminal. Perubahan pada berkas yang sudah ada tetap
  lewat terminal karena harus presisi. Pengecualian: berkas baru yang
  dibangun dari salinan berkas lama (misalnya komponen form bersama) dibuat
  dengan `cp` lalu diubah lewat helper, agar isi lamanya tidak diketik ulang.
- Berkas di luar repo yang bersifat cache atau alat (helper di
  `~/.cache/frontend-web/alat/`, skrip sekali pakai di `/tmp`) dibuat lewat
  blok terminal, bukan manual (ditetapkan pemilik proyek, 21 September 2026).
- Satu blok untuk satu berkas atau satu tujuan. Blok yang panjang tidak dapat
  dijalankan sekaligus dan mudah terpotong saat ditempel.

## Helper penggantian

Penggantian teks memakai skrip Node inline yang menolak bila jumlah kecocokan
bukan satu, sehingga tidak ada penggantian ambigu:

```bash
node -e '
const fs = require("fs");
const f = "path/ke/berkas.tsx";
const isi = fs.readFileSync(f, "utf8");
const lama = `...`;
const baru = `...`;
if (isi.split(lama).length - 1 !== 1) { console.error("GAGAL"); process.exit(1); }
fs.writeFileSync(f, isi.replace(lama, () => baru));
console.log("OK");
'
```

Untuk penggantian di banyak berkas, kumpulkan pasangan dalam array dan tulis
berkas hanya bila seluruhnya cocok.

Sepuluh helper disimpan di `~/.cache/frontend-web/alat/`, bersebelahan dengan cache
kontrak. Sampai submodul stok, helper disimpan di `/tmp`, dan folder itu dua
kali dikosongkan sistem dalam sehari: sekali membuat perbaikan dokumen tidak
masuk sebelum commit (`b0d11d2` menyusulkannya). Skrip sekali pakai tetap di
`/tmp`. Skrip tinjau data yang dipakai berulang lintas sesi
(`tinjau-surat-jalan.js`, `api-surat-jalan.js`) ikut dipindah ke sana pada
22 September 2026, setelah `/tmp` kembali dikosongkan di tengah pemakaiannya.
Periksa dengan `ls ~/.cache/frontend-web/alat` sebelum blok pertama
sesi, dan buat ulang bila hilang:

```bash
mkdir -p ~/.cache/frontend-web/alat
cat > ~/.cache/frontend-web/alat/ganti.js <<'EOF'
const fs = require("fs");
module.exports = (f, pasangan, rapikan) => {
  let isi = fs.readFileSync(f, "utf8");
  for (const [lama, baru] of pasangan) {
    const n = isi.split(lama).length - 1;
    if (n === 1) {
      isi = isi.replace(lama, () => baru);
      continue;
    }
    console.error("GAGAL " + f + " (" + n + "): " + lama.slice(0, 70).replace(/\n/g, " | "));
    process.exit(1);
  }
  if (rapikan) isi = isi.replace(/^[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n").replace(/\s*$/, "\n");
  fs.writeFileSync(f, isi);
  console.log("OK " + f + " (" + pasangan.length + " pasangan)");
};
EOF
cat > ~/.cache/frontend-web/alat/ganti-baris.js <<'EOF'
const fs = require("fs");
module.exports = (f, awal, akhir, iAwal, iAkhir, baru) => {
  const baris = fs.readFileSync(f, "utf8").split("\n");
  const a = baris.indexOf(awal);
  const z = baris.indexOf(akhir, a);
  if (a < 0 || z < 0 || a !== iAwal || z !== iAkhir) {
    console.error("GAGAL jangkar " + f + " " + a + " " + z);
    process.exit(1);
  }
  baris.splice(a, z - a + 1, baru);
  fs.writeFileSync(f, baris.join("\n"));
  console.log("OK " + f + " baris " + (a + 1) + "-" + (z + 1));
};
EOF
cat > ~/.cache/frontend-web/alat/hitung-eslint.js <<'EOF'
let d = "";
process.stdin.on("data", (c) => (d += c)).on("end", () => {
  const r = JSON.parse(d || "[]");
  console.log(r.reduce((s, x) => s + x.errorCount, 0));
});
EOF
cat > ~/.cache/frontend-web/alat/ringkas-e2e.js <<'EOF'
const r = require(require("path").resolve(process.argv[2] || "/tmp/p.json"));
const s = r.stats;
console.log(`e2e passed:${s.expected} failed:${s.unexpected} flaky:${s.flaky} skipped:${s.skipped}`);
const bersih = (t) => String(t).replace(/\x1b\[[0-9;]*m/g, "");
const jalan = (su) =>
  su.forEach((x) => {
    (x.specs || []).forEach((sp) =>
      sp.tests.forEach((t) =>
        t.results.forEach((res) => {
          if (res.status === "passed") return;
          const pesan = res.error
            ? " | " + bersih(res.error.message).split("\n").slice(0, 4).join(" ").slice(0, 300)
            : "";
          console.log(res.status.toUpperCase() + ": " + sp.title.slice(0, 80) + pesan);
        }),
      ),
    );
    if (x.suites) jalan(x.suites);
  });
jalan(r.suites);
EOF
cat > ~/.cache/frontend-web/alat/daftar-eslint.js <<'EOF'
let d = "";
process.stdin.on("data", (c) => (d += c)).on("end", () => {
  let n = 0;
  for (const f of JSON.parse(d || "[]"))
    for (const m of f.messages)
      if (m.severity === 2) {
        n++;
        console.log(f.filePath.replace(process.cwd() + "/", "") + ":" + m.line + ":" + m.column + " " + m.ruleId);
      }
  console.log("error: " + n);
});
EOF
cat > ~/.cache/frontend-web/alat/ganti-blok.js <<'EOF'
const fs = require("fs");
const pasangan = [];
let p = null;
let mode = null;
let isi = [];
for (const b of fs.readFileSync(process.argv[2], "utf8").split("\n")) {
  const m = b.match(/^@@@ (berkas|lama|baru|akhir)(?: (.+))?$/);
  if (!m) {
    if (mode) isi.push(b);
    continue;
  }
  if (mode) p[mode] = isi.join("\n");
  isi = [];
  if (m[1] === "berkas") p = { berkas: m[2] };
  if (m[1] === "akhir") pasangan.push(p);
  mode = m[1] === "lama" || m[1] === "baru" ? m[1] : null;
}
const berkas = {};
const gagal = [];
for (const { berkas: f, lama, baru } of pasangan) {
  if (!(f in berkas)) berkas[f] = fs.readFileSync(f, "utf8");
  if (baru !== lama && baru.includes(lama) && berkas[f].includes(baru)) {
    gagal.push("SUDAH DITERAPKAN " + f + ": " + baru.slice(0, 70).replace(/\n/g, " | "));
    continue;
  }
  const n = berkas[f].split(lama).length - 1;
  if (n !== 1) {
    gagal.push("GAGAL " + f + " (" + n + "): " + lama.slice(0, 70).replace(/\n/g, " | "));
    continue;
  }
  berkas[f] = berkas[f].replace(lama, () => baru);
}
if (gagal.length) {
  console.error(gagal.join("\n"));
  process.exit(1);
}
for (const [f, isiBaru] of Object.entries(berkas)) fs.writeFileSync(f, isiBaru);
console.log("OK " + pasangan.length + " pasangan di " + Object.keys(berkas).length + " berkas");
EOF
cat > ~/.cache/frontend-web/alat/tinjau-surat-jalan.js <<'EOF'
const BE = process.env.HOME + "/Documents/backend-js";
const fs = require("fs");
const mongoose = require(BE + "/node_modules/mongoose");
const uri = fs.readFileSync(BE + "/.env", "utf8").split("\n").map((l) => l.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "")).find((v) => v.startsWith("mongodb"));
const status = process.argv[2] || "DIKIRIM";
(async () => {
  await mongoose.connect(uri);
  try {
    const db = mongoose.connection.db;
    const kol = (f) => db.collection(require(BE + "/models/" + f).collection.name);
    const jam = (d) => (d ? new Date(d).toISOString().slice(0, 16).replace("T", " ") : "-");
    const daftar = await kol("transferStokModel").find({ status }).sort({ createdAt: -1 }).limit(10).toArray();
    if (!daftar.length) {
      console.log("tidak ada surat jalan " + status);
      return;
    }
    for (const t of daftar) {
      const n = t.nomorTransfer;
      const jurnal = await kol("jurnalStokModel").countDocuments({ keterangan: { $in: ["Kirim Transfer: " + n, "Pembatalan Transfer: " + n, "Terima Transfer: " + n] } });
      const p = await kol("pengajuanStokModel").findOne({ _id: t.pengajuanStokID });
      console.log(n, "id", String(t._id), "dibuat", jam(t.createdAt), "item", t.items.length, "jurnal", jurnal, "pengajuan", p ? p.nomorPengajuan + " " + p.status : "-");
    }
  } finally {
    await mongoose.disconnect();
  }
})().catch((e) => {
  console.error("GAGAL", e.message);
  process.exit(1);
});
EOF
cat > ~/.cache/frontend-web/alat/api-surat-jalan.js <<'EOF'
const BASIS = "http:/" + "/localhost:4000/api";
const jwt = (o) => {
  if (typeof o === "string" && /^eyJ[\w-]+\.[\w-]+\.[\w-]+$/.test(o)) return o;
  if (o && typeof o === "object") for (const v of Object.values(o)) {
    const t = jwt(v);
    if (t) return t;
  }
  return null;
};
const panggil = async (method, path, token, body) => {
  const res = await fetch(BASIS + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
};
(async () => {
  const akun = await panggil("POST", "/akun/auth/login", null, { email: "toko@gmail.com", password: "Toko1234" });
  const pin = await panggil("POST", "/pengguna/pin-login", jwt(akun.json), { nama: "Ridho", pin: "123456", loginType: "web", installationId: "cli-api-surat-jalan" });
  const token = jwt(pin.json);
  console.log("login akun", akun.status, "pin", pin.status, token ? "token ada" : "token tidak ada: " + JSON.stringify(pin.json).slice(0, 120));
  if (!token) return;
  const [aksi, id] = process.argv.slice(2);
  if (!aksi) {
    const daftar = await panggil("GET", "/transferstok", token);
    console.log("GET /transferstok", daftar.status);
    for (const t of daftar.json.data || []) console.log(t.id, t.nomorTransfer, t.status, "item", (t.items || []).length);
  }
  if (aksi === "detail" && id) {
    const r = await panggil("GET", "/transferstok/" + id, token);
    console.log("GET detail", r.status, "status", (r.json.data || {}).status, "item", ((r.json.data || {}).items || []).length, String(r.json.message || "").slice(0, 120));
  }
  if (aksi === "batal" && id) {
    const r = await panggil("PATCH", "/transferstok/" + id + "/batal", token, {});
    console.log("PATCH batal", r.status, String(r.json.message || "").slice(0, 150));
  }
})().catch((e) => {
  console.error("GAGAL", e.message);
  process.exit(1);
});
EOF
cat > ~/.cache/frontend-web/alat/audit-endpoint.js <<'EOF'
const fs = require("fs");
const path = require("path");
const ts = require(path.resolve("node_modules/typescript"));
const BE = process.env.HOME + "/Documents/backend-js";
const TULIS = process.argv.includes("--tulis");
const norm = (p) => ("/" + p.replace(/^\/api(?=\/)/, "").replace(/\?.*$/, "").replace(/%3a\w+/gi, ":p").replace(/\/\$\{[^}]*\}/g, "/:p").replace(/\$\{[^}]*\}/g, "").replace(/:\w+/g, ":p").replace(/^\/+|\/+$/g, "")).toLowerCase();
const kunci = (m, p) => m.toUpperCase() + " " + norm(p);
const js = ts.transpileModule(fs.readFileSync("lib/api/endpoints.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const mod = { exports: {} };
new Function("module", "exports", "require", js)(mod, mod.exports, require);
const EP = mod.exports.EP || Object.values(mod.exports)[0];
const ep = {};
const jalan = (o, pre) => {
  for (const [k, v] of Object.entries(o)) {
    const n = pre ? pre + "." + k : k;
    if (typeof v === "string") ep[n] = v;
    else if (typeof v === "function") {
      try { ep[n] = String(v(":p", ":p", ":p")); } catch (e) {}
    } else if (v && typeof v === "object") jalan(v, n);
  }
};
jalan(EP, "");
const berkas = [];
const telusur = (d) => {
  if (!fs.existsSync(d)) return;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== "node_modules" && !e.name.startsWith(".")) telusur(f); }
    else if (/\.(ts|tsx)$/.test(e.name)) berkas.push(f);
  }
};
["app", "components", "lib", "hooks", "features"].forEach(telusur);
const fe = {};
const catat = (k, f) => (fe[k] = fe[k] || new Set()).add(f);
const metode = (sisa) => { const m = sisa.match(/method:\s*["'](\w+)["']/); return m ? m[1] : "GET"; };
const tidakKenal = [];
for (const f of berkas) {
  if (f === path.join("lib", "api", "endpoints.ts")) continue;
  const s = fs.readFileSync(f, "utf8");
  for (const m of s.matchAll(/\b(apiData|api|apiClient)\.(get|post|put|patch|delete)\s*(?:<[^(]*?>)?\s*\(\s*EP\.([\w.]+)/g)) {
    if (ep[m[3]]) catat(kunci(m[2], ep[m[3]]), f); else tidakKenal.push(f + " EP." + m[3]);
  }
  for (const m of s.matchAll(/\b(apiData|api|apiClient)\.(get|post|put|patch|delete)\s*(?:<[^(]*?>)?\s*\(\s*`\$\{EP\.([\w.]+)(?:\([^)]*\))?\}([^`]*)`/g)) {
    if (ep[m[3]]) catat(kunci(m[2], ep[m[3]] + m[4]), f); else tidakKenal.push(f + " EP." + m[3]);
  }
  for (const m of s.matchAll(/\b(apiData|api|apiClient)\.(get|post|put|patch|delete)\s*(?:<[^(]*?>)?\s*\(\s*([`'"])(\/[^`'"]*)\3/g)) catat(kunci(m[2], m[4]), f);
  for (const m of s.matchAll(/fetch\(\s*`\$\{\w+\}(\/[^`]*)`([\s\S]{0,300})/g)) catat(kunci(metode(m[2]), m[1]), f);
  for (const m of s.matchAll(/fetch\(\s*([`'"])[^`'"]*\/api(\/[^`'"]*)\1([\s\S]{0,300})/g)) catat(kunci(metode(m[3]), m[2]), f);
}
const rute = {};
for (const n of fs.readdirSync(BE + "/routes")) {
  if (!/Routes?\.js$/.test(n)) continue;
  const mount = n.replace(/Routes?\.js$/, "").toLowerCase();
  const s = fs.readFileSync(BE + "/routes/" + n, "utf8");
  for (const m of s.matchAll(/\.(get|post|put|patch|delete)\(\s*["'`](\/[^"'`]*)["'`]/g)) rute[kunci(m[1], "/" + mount + m[2])] = n;
  for (const m of s.matchAll(/\.route\(\s*["'`](\/[^"'`]*)["'`]\s*\)([\s\S]*?);/g)) {
    for (const x of m[2].matchAll(/\.(get|post|put|patch|delete)\(/g)) rute[kunci(x[1], "/" + mount + m[1])] = n;
  }
}
const lampiran = fs.readFileSync("docs/kontrak/route-backend.md", "utf8").split("\n").map((b) => b.match(/^\| (GET|POST|PUT|PATCH|DELETE) \| `([^`]+)` \|/)).filter(Boolean).map((m) => kunci(m[1], m[2]));
const doc = [];
for (const b of fs.readFileSync("docs/kontrak/endpoint.md", "utf8").split("\n")) {
  const m = b.match(/^\| (GET|POST|PUT|PATCH|DELETE) \| `([^`]+)` \|.*\| ([^|]*) \|$/);
  if (m) doc.push({ k: kunci(m[1], m[2]), sel: m[3].trim() });
}
const pendek = (s) => {
  const a = [...s];
  const f = a.filter((x) => x.startsWith("features"));
  const lain = a.length - f.length;
  return [...f, lain ? lain + " file lain" : ""].filter(Boolean).join(", ");
};
console.log("lampiran A: " + lampiran.length + " | rute backend: " + Object.keys(rute).length + " | panggilan frontend unik: " + Object.keys(fe).length + " | baris endpoint.md: " + doc.length + " | EP tak dikenal: " + tidakKenal.length);
tidakKenal.slice(0, 5).forEach((x) => console.log("  EP? " + x));
lampiran.filter((k) => !rute[k]).forEach((k) => console.log("  route Lampiran A tidak ditemukan di backend: " + k));
Object.keys(rute).filter((k) => !lampiran.includes(k)).forEach((k) => console.log("  route backend di luar Lampiran A: " + k + " | " + rute[k]));
console.log("== baris endpoint.md tanpa pemanggil frontend");
doc.filter((d) => !fe[d.k]).forEach((d) => console.log("  " + d.k + " | backend " + (rute[d.k] ? "ada" : "TIDAK ADA") + " | kolom: " + d.sel.slice(0, 40)));
console.log("== panggilan frontend yang tidak ada di endpoint.md");
Object.keys(fe).filter((k) => !doc.some((d) => d.k === k)).forEach((k) => console.log("  " + k + " | backend " + (rute[k] ? "ada" : "TIDAK ADA") + " | " + pendek(fe[k]).slice(0, 80)));
console.log("== panggilan frontend yang tidak ada di backend");
Object.keys(fe).filter((k) => !rute[k]).forEach((k) => console.log("  " + k + " | " + pendek(fe[k]).slice(0, 80)));
const hasil = doc.map((d) => ({ k: d.k, lama: d.sel, pemanggil: fe[d.k] ? [...fe[d.k]].sort() : [], backend: rute[d.k] || null }));
fs.writeFileSync("/tmp/audit-endpoint.json", JSON.stringify(hasil, null, 1));
const campur = hasil.filter((h) => h.pemanggil.some((x) => x.startsWith("features")) && h.pemanggil.some((x) => !x.startsWith("features")));
console.log("== dipanggil features dan halaman lama sekaligus: " + campur.length);
campur.forEach((h) => console.log("  " + h.k + " | " + h.pemanggil.filter((x) => !x.startsWith("features")).join(", ").slice(0, 90)));
if (TULIS) {
  const peta = Object.fromEntries(hasil.map((h) => [h.k, h]));
  const f = "docs/kontrak/endpoint.md";
  const gagal = [];
  let berubah = 0;
  const keluar = fs.readFileSync(f, "utf8").split("\n").map((b) => {
    const m = b.match(/^(\| (GET|POST|PUT|PATCH|DELETE) \| `([^`]+)` \|.*\| )([^|]*)( \|)$/);
    if (!m) return b;
    const a = peta[kunci(m[2], m[3])];
    const lama = m[4].trim();
    if (!a.pemanggil.length) {
      if (!/tidak dipanggil lagi/.test(lama)) gagal.push(m[2] + " " + m[3]);
      return b;
    }
    const kurung = lama.match(/ (\(.*\))$/);
    const fitur = a.pemanggil.filter((x) => x.startsWith("features"));
    const lain = a.pemanggil.length - fitur.length;
    let sel = [...fitur.map((x) => "`" + x + "`"), lain ? lain + " file" + (fitur.length ? " halaman lama" : "") : ""].filter(Boolean).join(", ");
    if (kurung) sel += " " + kurung[1];
    if (sel === lama) return b;
    berubah++;
    return m[1] + sel + m[5];
  });
  if (gagal.length) {
    console.error("GAGAL baris tanpa pemanggil yang belum ditandai tidak dipanggil lagi:\n  " + gagal.join("\n  "));
    process.exit(1);
  }
  fs.writeFileSync(f, keluar.join("\n"));
  console.log("OK kolom Dipakai di: " + berubah + " berubah");
}
EOF
cat > ~/.cache/frontend-web/alat/audit-fulfill.js <<'EOF'
const fs = require("fs");
const path = require("path");
const akar = process.argv[2] || "tests/e2e";
const berkas = [];
(function jalan(d) {
  for (const n of fs.readdirSync(d)) {
    const p = path.join(d, n);
    if (fs.statSync(p).isDirectory()) jalan(p);
    else if (p.endsWith(".spec.ts")) berkas.push(p);
  }
})(akar);
let total = 0;
const simulasi = [];
for (const f of berkas.sort()) {
  const baris = fs.readFileSync(f, "utf8").split("\n");
  let rute = 0, sukses = 0, gagal = 0, sim = 0;
  const contoh = [];
  baris.forEach((b, i) => {
    if (/\.route\(/.test(b)) rute++;
    if (!/\.fulfill\(/.test(b)) return;
    const jendela = [b];
    for (let j = i + 1; j < Math.min(i + 10, baris.length); j++) {
      if (/\.fulfill\(/.test(baris[j])) break;
      jendela.push(baris[j]);
    }
    const teks = jendela.join(" ");
    const m = teks.match(/status:\s*(\d{3})/);
    const tanda = (b + " " + (baris[i - 1] || "")).match(/\/\/ simulasi: (.*)$/);
    if (/JAWAB_GAGAL/.test(teks) || (m && Number(m[1]) >= 400)) gagal++;
    else if (tanda) {
      sim++;
      simulasi.push(f.replace(akar + "/", "") + ":" + (i + 1) + " " + tanda[1].trim().slice(0, 80));
    } else {
      sukses++;
      if (contoh.length < 4) contoh.push(i + 1);
    }
  });
  total += sukses;
  if (rute || sukses || gagal || sim)
    console.log(f.replace(akar + "/", "") + " route:" + rute + " sukses:" + sukses + " gagal:" + gagal + " simulasi:" + sim + (contoh.length ? " baris " + contoh.join(",") : ""));
}
simulasi.forEach((s) => console.log("SIMULASI " + s));
console.log("total fulfill sukses: " + total + " di " + berkas.length + " spec");
process.exit(total ? 1 : 0);
EOF
```

- `ganti.js`: dipanggil dengan ``node -e 'require(process.env.HOME + "/.cache/frontend-web/alat/ganti.js")("berkas", [[`lama`, `baru`]])'``.
  Berkas hanya ditulis bila setiap pasangan cocok tepat satu kali. Argumen
  ketiga `true` merapikan baris kosong berlebih.
- `ganti-baris.js`: mengganti rentang baris dari jangkar awal sampai jangkar
  akhir, dengan indeks yang diharapkan sebagai pengaman. Indeks diambil dari
  `grep -n` yang mencetak kedua jangkar di blok yang sama (nomor baris dikurangi
  satu). `grep` yang kosong menghasilkan indeks `-1`; helper menolaknya sejak
  26 September 2026, sedangkan sebelumnya menerimanya karena `indexOf` juga
  `-1`.
- `hitung-eslint.js`: menjumlahkan error dari `eslint -f json`.
- `ringkas-e2e.js`: meringkas `/tmp/p.json` hasil `--reporter=json` (atau
  berkas di argumen pertama): jumlah per status, lalu status, judul, dan
  empat baris pertama pesan error setiap test yang tidak lolos.
- `daftar-eslint.js`: membaca `eslint -f json` dari stdin, mencetak setiap
  error beserta berkas, baris, dan aturannya, lalu selalu `error: N`.
- `ganti-blok.js`: seperti `ganti.js`, tetapi pasangan dibaca dari berkas
  teks bermarka baris `@@@ berkas <path>`, `@@@ lama`, `@@@ baru`, dan
  `@@@ akhir`, sehingga teks berisi backtick dan tanda dolar (dokumentasi
  Markdown) tidak perlu di-escape. Berkas marka ditulis dengan heredoc
  berdelimiter kutip yang berbeda dari `EOF` bila isinya memuat heredoc.
  Seluruh pasangan diperiksa lebih dulu dan setiap kegagalan dilaporkan
  sekaligus; tidak ada berkas yang ditulis bila satu pasangan tidak cocok
  tepat satu kali. Pasangan yang teks barunya memuat teks lamanya (sisipan
  di sekitar jangkar) ditolak dengan `SUDAH DITERAPKAN` bila teks baru itu
  sudah ada di berkas, sehingga blok yang tertempel atau dijalankan dua kali
  tidak menyisipkan ulang. Tanpa pengaman ini, `bentuk.cjs` sempat berisi
  setiap sisipan dua kali (21 September 2026).
- `tinjau-surat-jalan.js`: membaca basis data development (baca-saja) dan
  mencetak sampai 10 surat jalan berstatus argumen pertama (bawaan
  DIKIRIM), beserta jumlah jurnal kirim, batal, dan terima miliknya serta
  status pengajuannya. Dipakai memastikan tidak ada surat jalan uji yang
  tertinggal DIKIRIM.
- `api-surat-jalan.js`: masuk lewat API dengan akun uji. Tanpa argumen
  mencetak daftar surat jalan, dengan `detail <id>` mencetak satu surat
  jalan, dan dengan `batal <id>` membatalkannya lewat backend sehingga stok
  gudang kembali. Login PIN-nya mengambil alih sesi web Ridho.
- `audit-endpoint.js`: dijalankan dari akar repo frontend-web. Memetakan
  setiap panggilan frontend (`apiData`, `api`, dan `apiClient` dengan `EP`,
  path tertulis, atau template, serta `fetch` ke backend) ke method dan
  path, membaca seluruh route backend dengan aturan mount `routes/index.js`,
  lalu membandingkan keduanya dengan tabel `docs/kontrak/endpoint.md` dan
  Lampiran A. Laporannya memuat jumlah per sumber, route backend di luar
  Lampiran A, baris tanpa pemanggil, panggilan yang tidak tercatat atau
  tidak ada di backend, dan endpoint yang dipanggil `features/` sekaligus
  halaman lama; pemetaan lengkapnya disimpan di `/tmp/audit-endpoint.json`.
  Dengan `--tulis`, kolom "Dipakai di" diisi ulang dengan berkas `features/`
  pemanggilnya dan jumlah berkas halaman lama. Keterangan dalam kurung
  dipertahankan, dan baris tanpa pemanggil harus sudah ditandai "tidak
  dipanggil lagi". Versi pertamanya hanya menemukan 136 dari 246 route,
  karena rantai `.route()` yang dipecah baris terlewat; pembanding terhadap
  Lampiran A kini membuat cacat semacam itu langsung terlihat.
- `audit-fulfill.js`: menghitung `route.fulfill` per spec di folder
  argumen pertama (bawaan `tests/e2e`). Setiap pemanggilan dibaca sampai
  pemanggilan berikutnya, sehingga `status` di baris lain ikut terbaca:
  status 4xx atau 5xx dan `JAWAB_GAGAL` dihitung gagal, tanda
  `// simulasi:` di baris itu atau tepat di atasnya dihitung simulasi dan
  dicetak beserta alasannya, dan sisanya, termasuk status dari variabel,
  dihitung sukses. Keluar dengan kode 1 bila ada yang sukses, sehingga
  dapat menjadi gerbang (`pengujian.md`, Perintah verifikasi).
- Di dalam template literal skrip, backtick dan tanda dolar yang diikuti kurung
  kurawal ditulis dengan escape, dan tanda miring terbalik ditulis ganda agar
  sampai ke berkas. Hindari kutip bersarang di konten yang disisipkan.
- Untuk menyisipkan kutip tunggal ke dalam argumen `node -e '...'`, tulis
  `'"'"'` (tutup kutip, kutip tunggal di dalam kutip ganda, buka kutip lagi),
  atau pakai skrip heredoc berisi string JavaScript.
- Skrip heredoc yang memuat banyak pasangan kode TypeScript menulis setiap
  teks dengan `String.raw`, agar garis miring terbalik di regex sampai
  utuh, dan teks barunya tidak memakai backtick maupun `${`, sehingga
  tidak ada yang perlu di-escape (`/tmp/ganti-login.js` untuk `5a3deea`).
- Berkas marka yang teksnya memuat pagar kode Markdown ditulis dengan
  penanda `PAGAR` di baris itu, lalu penanda diganti tiga backtick lewat
  `\x60` sebelum `ganti-blok.js` dijalankan. Pagar kode di dalam blok
  tempel memotong blok itu saat pesan ditampilkan, dan blok marka
  `cara-kerja.md` untuk `5a3deea` harus dikirim ulang karenanya.

**Catatan penting**: blok panjang kadang tertempel dua kali di terminal. Bila
sebuah penggantian melaporkan 0 kecocokan padahal seharusnya ada, periksa dulu
apakah perubahannya sudah masuk dari tempelan pertama, sebelum menyimpulkan
polanya salah.

## Catatan shell (zsh)

- Tanda `!` di dalam kutip tunggal (`node -e '...'`) dan di heredoc
  berdelimiter kutip (`<<'EOF'`) terbukti aman: skrip modul produk yang
  memuat `!==` berjalan normal. Di luar dua bentuk itu, jalankan
  `setopt nobanghist` lebih dulu atau hindari `!`. Contoh yang pernah terjadi:
  pola grep berkutip ganda yang memuat `!` membuat zsh menunggu masukan
  (`dquote>`) dan menyisipkan perintah dari riwayat.
- Pola glob yang tidak cocok menghasilkan `no matches found` dan menghentikan
  perintah. Pesan itu datang dari zsh sendiri, sehingga `2>/dev/null` tidak
  meredamnya. Untuk berkas yang mungkin tidak ada, pakai `find`, misalnya
  `find test-results -name trace.zip | head -1`. Folder `test-results`
  dikosongkan di setiap run, sehingga hasilnya selalu dari run terakhir.
- Path berisi `[id]` selalu dikutip, karena kurung siku dibaca sebagai pola glob.
- Perintah git yang dapat membuka pager ditulis `git --no-pager`.
- Argumen berpola seperti `--include=*.ts` pada grep juga terkena ekspansi
  glob. Kutip polanya: `--include='*.ts'`.
- Variabel berisi daftar berkas tidak dipecah menjadi beberapa argumen di zsh,
  berbeda dengan bash: `grep pola $F` mengirim seluruh daftar sebagai satu nama
  berkas (`No such file or directory` dengan nama berisi banyak baris). Simpan
  daftarnya ke berkas lalu pakai `tr '\n' '\0' < daftar | xargs -0 grep ...`,
  atau baca per baris dengan `while read f; do ...; done`.
- Pola `grep` selalu ditulis dalam kutip tunggal, tanpa pengecualian. Aturan
  tanda `!` di atas tetap terlanggar selama pola sesekali ditulis dalam kutip
  ganda; pada penyesuaian backend `f27f093`, pola `[=!]==` dalam kutip ganda
  membuat zsh menjawab `event not found`.
- Nama identifier di pola `grep` memakai batas kata `\b`, agar tidak
  menangkap nama yang memuatnya (`ItemAdjustment` ikut menangkap
  `BarisItemAdjustment`).
- Teks berbentuk URL yang ditempel ke terminal diberi garis miring terbalik
  oleh `url-quote-magic` zsh, termasuk di dalam heredoc berdelimiter kutip:
  titik koma sesudah URL di skrip `/tmp/sj-api.js` (kini helper
  `api-surat-jalan.js`) tertulis `\;` dan skripnya gagal. Di blok tempel,
  URL ditulis terpecah
  (`"http:/" + "/localhost"`), lalu baris pertama berkas diperiksa dengan
  `head -1`.
- `ls` di mesin pemilik proyek adalah alias `lsd`, yang tidak mengenal opsi
  GNU seperti `--time-style`. Pakai `command ls` bila opsi `ls` asli
  dibutuhkan.

- **Kata yang diawali `=` diperluas zsh.** `echo ====` gagal dengan
  `=== not found`, karena zsh membaca `=perintah` sebagai path perintah
  itu, dan sisa baris tidak berjalan. Pemisah ditulis berkutip, misalnya
  `echo '== judul'`.
- **Kolom keluaran Jest tidak tetap.** Baris `FAIL` memuat nama project
  (`unit`, `integration`) dan kadang durasi (`(811.617 s)`), sehingga
  `awk '{print $2}'` maupun `$NF` salah mengambil path. Ambil path dengan
  pola `grep -oE '__tests__/[^ ]+\.test\.js'`.

## Catatan form (React Hook Form dan Zod)

- **Hindari `z.coerce`.** Ia membuat tipe input dan output skema berbeda,
  sehingga `useForm<T>` dengan satu parameter tipe bentrok dengan resolver.
- Untuk input angka, pakai `z.number()` di skema dan
  `register("field", { valueAsNumber: true })` di komponen. Tanpa itu, nilai
  terkirim sebagai string dan validasi menahan submit tanpa pesan yang terlihat.
- Bila isian kosong harus bernilai 0 (bukan NaN), pakai `setValueAs: keAngka`
  dari `features/produk/schema.ts` sebagai pengganti `valueAsNumber`.
- Hindari `.default()` di skema form. Ia juga membuat tipe input dan output
  berbeda. Nilai awal diberikan lewat `defaultValues`.
- Input yang judulnya bukan `label` (misalnya `h3`) dihubungkan lewat
  `aria-labelledby`, sehingga tetap dapat dipilih dengan nama aksesibel.
- Skema buat dan edit disatukan bila entitasnya sama; field yang hanya relevan
  saat membuat dibuat opsional.
- Setiap `label` wajib punya `htmlFor` dan input punya `id` yang sepadan.
  Tombol ikon tanpa teks wajib punya `aria-label`.
- `AlertDialogAction` dari Radix menutup dialog secara bawaan saat diklik.
  Bila dialog harus bertahan sampai operasi berhasil (keputusan Fase 0),
  panggil `e.preventDefault()` di `onClick`. Bug hapus bahan baku (`50e8815`)
  berasal dari sini.

## Cara berbagi konteks

Konteks proyek dibagikan dengan menjalankan perintah terminal dan menempel
outputnya. Berkas diunggah hanya untuk pemeriksaan dokumentasi yang terlalu
panjang untuk ditempel. Karena itu setiap perintah harus
ringkas outputnya: batasi jumlah baris, potong lebar dengan `cut -c1-110`,
dan hindari pager.

Untuk kode, informasi diambil bertahap, bukan dengan `cat` seluruh berkas:

1. **Peta** berkas lewat `grep -n` pada baris penting (pemanggilan API, query,
   mutation, state, handler, dialog), atau hunk `diff` saja untuk
   membandingkan dua halaman.
2. **Potongan** yang dibutuhkan lewat `sed -n 'awal,akhirp'`, dengan nomor
   baris dari peta itu.
3. **Sekaligus saat memetakan sebuah perubahan**: test yang menguji perilaku
   yang akan diubah, seluruh pemanggil fungsi atau hook yang diubah (grep),
   dan jalur backend endpoint-nya utuh. Pada penyesuaian backend `f27f093`,
   potongan yang diambil sedikit demi sedikit menambah banyak putaran.

Satu blok pengambilan dijaga di bawah sekitar 100 baris keluaran. Pengecualian:
pemeriksaan dokumentasi yang strukturnya berubah besar memakai isi utuh berkas
yang berubah (`docs/README.md`), agar pemeriksaannya cukup sekali.

## Disiplin saat menerapkan perubahan

Kesalahan yang pernah terjadi dan cara menghindarinya:

- **Jangan mengubah test dua kali tanpa bukti baru.** Bila perbaikan
  pertama tidak menolong, ambil bukti sebelum mencoba yang kedua.
- **Kembalikan perubahan yang memperburuk, segera.** Menumpuk perbaikan di
  atas perubahan yang salah membuat penyebabnya makin sulit dikenali.
- **Verifikasi keadaan akhir, bukan keluaran `OK` dari skrip.** Sebuah skrip
  dapat melaporkan berhasil padahal tidak mengubah apa pun; periksa
  berkasnya dengan grep atau sed.
- **Ambil selector dari kode komponen sebelum menulis spec**, bukan
  menebaknya. Satu perintah grep untuk teks tombol, label, dan placeholder
  menghemat banyak putaran.
- **Tulis spec untuk alur yang akan diubah sebelum migrasi selesai.** Bug
  navigasi pada modul role baru ketahuan berjam-jam setelah kodenya jadi.
- **Blok perintah dijaga pendek dan bertujuan tunggal.** Blok panjang
  kadang tertempel dua kali atau terpotong di terminal, dan kegagalannya
  tidak selalu terlihat.
- **Untuk blok besar, ganti berbasis nomor baris**, dengan memeriksa isi
  baris sebagai pengaman. Pencocokan teks panjang mudah gagal hanya karena
  indentasi meleset dua spasi.
- **Hindari skrip pembersih otomatis berbasis keluaran ESLint.** Dua kali
  dicoba dan dua kali gagal (escaping regex berlapis, lalu execSync yang
  melempar saat ESLint keluar dengan kode bukan nol). Membaca daftarnya
  lalu mengganti blok import secara langsung lebih cepat dan pasti.
- **Angka pengaman untuk penggantian berbasis baris diambil dari `grep -n`**
  yang mencetak jangkar di blok yang sama, bukan dihitung dengan mata dari
  output sebelumnya. Pada modul produk, hitungan manual dua kali meleset satu
  baris.
- **Jangan membuat blok yang bergantung pada penanda sementara dari blok
  lain.** Cari sasaran dari isi kode yang memang ada, agar urutan blok tidak
  menentukan hasil.
- **Bentuk pesan error backend dipastikan dari respons nyata** (trace atau
  cache kontrak) sebelum dipetakan di frontend. Pada kategori, service menyebut
  field yang salah, dan hal itu baru ketahuan dari trace.
- **Jangan menyimpulkan selesai dari satu run yang lolos** bila sebelumnya ada
  kegagalan. Jalankan ulang dengan `--repeat-each`.
- **Sebelum menghapus atau mengganti nama fungsi, grep seluruh pemakaiannya**
  di berkas itu. `next dev` tidak memeriksa tipe, sehingga pemakaian yang
  tertinggal baru muncul sebagai halaman crash di e2e. Pada stock adjustment,
  `formatTanggal` terhapus tetapi masih dipanggil di halaman detail.
- **Nilai yang bergantung pada locale tidak ditebak di unit test.** Periksa
  bentuknya, bukan teksnya. Pada stock adjustment, tebakan singkatan bulan
  dari locale `id` date-fns membuat unit test gagal.
- **Setelah menambah berkas test, pastikan jumlah test bertambah sesuai
  harapan**, bukan hanya tidak ada yang gagal. Vitest melewati berkas yang
  namanya tidak cocok pola `*.test.ts` tanpa error; pada jurnal stok, berkas
  bernama `*.tst.ts` membuat 9 test tidak berjalan.
- **Keluaran reporter `line` Playwright menghapus baris terminal sebelumnya.**
  Reporter itu mencetak kode kontrol `ESC[1A` dan `ESC[2K` (naik baris, hapus
  baris) yang tetap lolos lewat `tail`, sehingga keluaran `tsc`, ESLint, atau
  vitest di blok yang sama tampak hilang. Buang kodenya dengan
  `sed 's/\x1b\[[0-9;]*[A-Za-z]//g'`, atau jalankan Playwright paling
  akhir. Terbukti dengan `cat -v` pada modul stok.
- **Setiap dialog konfirmasi diuji juga jalur gagalnya**, dengan `page.route`
  pada method dan path operasinya. Bug hapus bahan baku (`50e8815`) lolos
  karena spec lama hanya menguji hapus yang berhasil, sedangkan dialog yang
  tertutup sebelum waktunya baru terlihat saat operasi gagal.
- **Nama tombol untuk selector diambil dari snapshot DOM (`error-context.md`)
  atau baris kode utuh**, bukan dari hasil ekstraksi regex. Pola
  `[A-Za-z ...]` memotong "Setujui & Sesuaikan Stok" menjadi "Setujui" tanpa
  tanda apa pun, dan spec alur stock opname sempat gagal karena itu.
- **Test tidak pernah diubah hanya agar lolos.** Bila sebuah skenario tidak
  dapat berjalan karena keadaan data atau menunggu backend, biarkan `skipped`
  atau gagal dengan alasan yang terlihat, lalu catat di
  `pengujian.md` (Test yang ditandai fixme dan skip bersyarat) dan, bila
  memang dari backend, di laporan untuk tim backend. Sebelum menyebut
  penyebabnya backend, pastikan dari kode: pada stock opname, pembatalan DRAFT
  ternyata diizinkan backend dan hanya dibatasi tampilan frontend.
- **Saat menyaring keluaran Playwright, jangan ikutkan pola yang menangkap
  baris progres** (misalnya `›`). Baris progres menghabiskan jatah `head`
  sebelum ringkasan tercetak. Untuk ringkasan, pakai pola
  `"  [0-9]+ (passed|failed|skipped)"`.
- **Isi dokumen dipindah lewat skrip, lalu dibuktikan tidak ada yang hilang.**
  Saat dokumentasi dipecah, potongan diambil menurut judul dan ditulis apa
  adanya, lalu setiap baris dokumen lama dicari di gabungan berkas baru; yang
  tidak ditemukan hanyalah baris yang sengaja diubah. Rujukan dokumen di
  komentar kode dan spec (`bagian N`, nama berkas lama) ikut di-grep dan
  diperbarui. Cara ini membuktikan kelengkapan pemecahan dokumentasi dalam
  satu putaran.
- **Skrip penerap tidak bergantung pada berkas yang harus dibuat manual di
  luar bloknya.** Pada pengajuan stok, skrip membaca dua halaman dari `/tmp`
  yang belum dibuat, lalu berhenti di tengah. Berkas yang ditulis ulang utuh
  memakai heredoc di blok yang sama.
- **Invalidasi memakai akar domain, bukan `daftar()` tanpa argumen.** Kunci
  daftar selalu membawa objek filter, sehingga `daftar()` (filter
  `undefined`) tidak mengenai daftar mana pun. Terjadi di stock opname dan
  pengajuan stok.
- **Tipe field referensi dipastikan dari `.populate(` di service dan dari
  mapper-nya**, bukan dari laporan backend atau komentar model.
  `referenceID` stock adjustment ditipekan string padahal berisi objek hasil
  populate, sehingga href menjadi `[object Object]` dan halaman daftar crash.
- **Jalur backend ditelusuri utuh sebelum menyimpulkan**: route, controller,
  service, lalu validator. Pemanggil sebuah fungsi dicari di seluruh backend
  (`backend.md`), bukan hanya di `routes/` dan `controllers/`. Pencarian yang
  terlalu sempit membuat `validateUpdateItems` sempat disimpulkan kode mati,
  padahal dipanggil dari service.
- **Klaim perbaikan di laporan backend adalah petunjuk, bukan bukti.**
  Perbaikan dibuktikan lewat e2e atau trace terhadap backend yang berjalan
  sebelum penanganan sementara di frontend dibuang atau payload dirancang
  ulang. Laporan 20 September menyatakan `qtyPhysical: null` diterima,
  tetapi validator di depan service masih menolaknya.
- **Keluaran kosong tidak pernah berarti bersih.** Filter yang tidak mencetak
  apa pun bisa berarti perintahnya gagal (formatter ESLint yang tidak ada)
  atau polanya salah (kode warna ANSI di ringkasan vitest). Pakai perintah
  verifikasi baku dan helper yang selalu mencetak jumlah (`pengujian.md`).
- **Jangkar penggantian diambil dari berkas nyata**, lewat `grep -n` atau
  `sed -n`, bukan dari salinan dokumen yang diunggah. Pembungkusan baris di
  salinan bisa berbeda dari berkasnya; jangkar Catatan shell di berkas ini
  sempat gagal karena itu.
- **Jangkar untuk prosa yang dibungkus mencakup baris utuh sampai akhir
  baris.** Jangkar yang berhenti di tengah baris membuat sisa baris lama
  tersambung ke teks baru; baseline di `pengujian.md` sempat menjadi satu
  baris kepanjangan karena itu.
- **Filter diff dokumentasi tidak boleh membuang butir daftar.** Pola
  `^[-+][^-+]` yang sempat dipakai di langkah 6 tata cara (`docs/README.md`)
  membuang setiap baris yang diawali `-- ` atau `+- `, sehingga butir daftar
  yang berubah tidak terlihat saat verifikasi. Sejak 21 September 2026, atas
  perintah pemilik proyek, langkah itu memakai
  `grep -E '^[-+]' | grep -vE '^(\+\+\+|---) '` setelah
  `git --no-pager diff -U0 docs`.
- **Makna sebuah field dipastikan dari jalur hilirnya dan dari dokumentasi
  backend** (folder `docs/` di repo backend), sebelum menyimpulkan sisi mana
  yang salah. Pada pengajuan stok, dugaan pertama menyalahkan backend karena
  stok diperiksa di `dariLocationID`; penelusuran surat jalan (kirim dan
  terima) dan skenario e2e backend membuktikan justru frontend yang membalik
  arah.
- **Apakah kerusakan data sudah terjadi dinilai dari `git blame` baris
  penentu, dibandingkan dengan `createdAt` datanya.** Transfer satu-satunya
  dari pengajuan terbalik ternyata dibuat sebelum baris penyalin arah masuk,
  sehingga stok belum pernah bergerak ke arah salah.
- **Data development diukur sebelum ditangani, dan skrip pengubah data
  selalu punya mode tinjau.** Hitungan per arah dan status menentukan
  pilihan penanganan; pembalikan dijalankan setelah daftar sasarannya
  dicetak dan diperiksa.
- **Teks yang bergantung pada spasi di awal baris disusun lewat skrip**,
  bukan lewat baris heredoc yang ditempel. Pagar blok kode di dalam butir
  daftar `docs/README.md` sempat kehilangan indentasinya saat ditempel, dan
  `4214e13` memperbaikinya.
- **Pesan commit yang panjang disimpan ke berkas di `/tmp` lebih dulu**, lalu
  dipakai dengan `git commit -F`, sehingga commit dapat diulang tanpa
  menempel ulang bila gerbangnya gagal.
- **Tanda tangan sebuah hook dibaca sebelum dipakai**, bukan ditebak dari
  namanya. `useLokasiBertipe` ternyata mengembalikan satu lokasi pertama
  (`{ lokasi, lokasiId }`), bukan daftar; form pengajuan membutuhkan
  `useDaftarLokasi` yang disaring per tipe.
- **Dugaan penyebab kegagalan diuji terhadap bukti sebelum dijadikan
  kesimpulan**, termasuk dugaan yang terasa cocok dengan semua pengamatan.
  Kehilangan sesi pada spec alur pengajuan sempat diduga benturan login
  paralel, lalu terbantah oleh `workers: 1` di konfigurasi Playwright.
- **Skrip basis data memutus koneksi di `finally`.** Keluar lebih awal lewat
  `return` sebelum `mongoose.disconnect()` membuat Node menunggu tanpa
  batas; skrip tinjau surat jalan sempat menggantung pada jalur "tidak ada
  surat jalan DIKIRIM" dan disangka pengujian yang macet.
- **Teks tombol yang sebaris dengan ikon ikut hilang bila keluaran disaring
  dari baris `className`.** Ambil baris itu utuh dengan `sed -n` pada nomor
  baris yang hilang dari keluaran. Pada submodul 6, judul "Finalisasi
  Kedatangan" sempat dipakai sebagai nama tombol karena baris tombolnya
  ("Konfirmasi Terima Barang") tersaring, padahal aturan nama tombol di
  atas sudah ada.
- **Asal kerusakan data dicari juga dari riwayat berkas penentunya.** Pada
  penerimaan, `git log --follow` membuktikan halaman web belum ada saat
  surat jalan yang rusak diterima, sehingga penyebabnya kemungkinan klien
  lain yang memakai backend yang sama.
- **Pasangan penggantian yang teks barunya memuat teks lamanya tidak
  idempoten.** Menjalankannya dua kali menyisipkan ulang, karena jangkarnya
  masih ada tepat satu kali. `ganti-blok.js` kini menolaknya dengan
  `SUDAH DITERAPKAN`; dengan `ganti.js`, periksa hasilnya dengan grep
  jumlah kemunculan sebelum melangkah.
- **Halaman dimigrasikan lewat salinan dan penyusunan ulang berjangkar.**
  `cp` halaman lama ke `features/`, lalu skrip mengganti rentang dari baris
  jangkar unik sampai sebelum `return (` utama, membungkus tombol dengan
  mencari `<Button` dan `</Button>` terdekat dari baris `onClick` uniknya,
  dan memindah blok penjaga utuh ke komponen luar. Urutan jangkar diperiksa
  sebelum menulis. Cara ini memigrasikan keenam halaman submodul 6 tanpa
  mengetik ulang tampilannya.
- **Berkas salinan membawa error ESLint warisan, dan itu dibereskan di
  commit migrasi**, karena definisi selesai berlaku untuk berkas modul,
  bukan hanya baris yang diubah. Detail surat jalan membawa empat tanda
  kutip tanpa escape di teks dialog.
- **Penggantian global dijalankan terakhir dan jumlahnya dicocokkan dengan
  hitungan yang diharapkan.** Pada detail penerimaan, penggantian `_id`
  menjadi `kunci` melaporkan 11, bukan 7, karena empat atribut yang
  disisipkan skrip yang sama ikut terganti. Selisih semacam ini dijelaskan
  dari grep hasilnya sebelum melangkah.
- **Blok tempel yang memuat pagar kode Markdown ditulis lewat skrip yang
  membaca isinya dari berkas**, bukan ditempel utuh. Pagar kode di dalam
  heredoc menutup blok perintah saat ditampilkan, sehingga blok tercetak
  terpotong (sumber skrip tinjau di bagian Helper penggantian).
- **Makna konsep yang akan digeneralisasi dipastikan dari backend dan dari
  model bisnis pemilik proyek.** Rencana cakupan per gudang dibangun di
  atas "lokasi aktif" sebagai lokasi pengguna, padahal pengguna hanya
  terikat ke tenant dan `/location/current` selalu mengembalikan outlet
  tenant. Satu fungsi backend dan satu pertanyaan kepada pemilik proyek
  membatalkan rencana itu sebelum ada kode yang ditulis.
- **Perilaku komponen bersama dipastikan per nilai pembedanya** (`ruang`,
  objek `TEKS`), bukan dari fakta bahwa komponennya dipakai bersama. Pada
  stock adjustment, tautan dari detail opname ke rute outlet sempat
  disimpulkan berlaku di kedua ruang dan diajukan sebagai keputusan,
  padahal hanya ada di `TEKS.outlet`.
- **Sebelum merancang pengiriman query ke backend, pastikan service
  benar-benar memakainya.** Validator hanya memeriksa format. Daftar
  adjustment menyaring `locationID`, sedangkan `GET /jurnalstok` dan
  `GET /transferstok` mengabaikan query.
- **Gerbang di blok tempel tidak pernah memakai `exit`.** Di shell
  interaktif, `exit` menutup terminal beserta pesan alasannya; pada commit
  gate stock adjustment, cabang `{ echo ...; exit 1; }` menutup terminal
  tanpa jejak. Pakai `if <gerbang>; then <commit>; else echo "GAGAL ...";
  fi`.
- **Berkas baru yang dibuat manual diperiksa ukurannya sebelum menjalankan
  apa pun** (`wc -c`, yang juga gagal bila berkasnya belum ada). Berkas
  yang belum dibuat atau belum tersimpan (0 byte) membuat vitest menjawab
  "No test suite found" atau tidak menambah jumlah test, `tsc` gagal
  menemukan modul, dan Playwright tidak menjalankan satu test pun. Terjadi
  tiga kali pada putaran izin lintas outlet: dua kali berkas belum dibuat,
  sekali berukuran 0 byte.
- **Keluaran panjang disimpan ke berkas lalu dibaca per bagian.** Pencarian
  dampak menghasilkan ratusan baris; simpan ke `/tmp`, cetak judul bagian
  dengan `grep -n '^=='`, lalu bagian tertentu dengan `awk`.

- **Kegagalan e2e diperiksa dari snapshot DOM lebih dulu**, untuk
  memastikan halaman yang tampil memang halaman yang diuji. Pesan
  `element(s) not found` pada tombol yang seharusnya ada sering berarti
  sesi hilang, bukan status dokumen atau nama tombol yang salah. Snapshot
  di `test-results/*/error-context.md` menjawabnya dalam satu perintah;
  pastikan berkasnya dari run terakhir dengan `find -newermt`.
- **`awk` dengan rentang baris lintas berkas memakai `FNR`, bukan `NR`.**
  `NR` menghitung terus antarberkas, sehingga berkas kedua dan seterusnya
  tidak pernah tercetak. Terjadi saat memetakan dua berkas halaman stock
  opname sekaligus.
- **Blok perintah tidak diletakkan di dalam butir daftar.** Indentasinya
  ikut tersalin, sehingga delimiter heredoc tidak dikenali dan terminal
  menggantung di `heredoc>`, dan marka `@@@` tidak dikenali
  `ganti-blok.js`.
- **Membuang `any` dari parameter generik mengubah tipe di hilirnya.**
  Pemakai hasilnya dibaca lebih dulu: pada sidebar, `res.data.nama ||
  pengguna.nama` menjadi `string | undefined` dan ditolak `setNamaUser`,
  sehingga perubahan itu dikembalikan.
- **Jangkar akhir untuk penggantian berbasis baris harus unik.** Baris
  kosong sebagai jangkar akhir cocok dengan baris kosong pertama sesudah
  jangkar awal, bukan yang dimaksud; `ganti-baris.js` menolaknya lewat
  indeks pengaman. Pakai baris berisi teks khas, misalnya rujukan temuan.
- **Helper lokal bernama sama dengan helper bersama adalah jebakan.**
  Sebelum memakai helper yang didefinisikan di dalam spec, cari nama itu di
  `tests/helpers/`: bila ada, versi bersama biasanya sudah menangani hal
  yang belum diketahui saat versi lokal ditulis. `bukaDenganAuth` ada dua,
  dan yang lokal membekukan token sehingga spec pengajuan gagal sesekali
  selama tiga hari (`pengujian.md`, Catatan Playwright).
- **Aturan yang sudah tertulis tetap perlu diperiksa penerapannya di
  setiap berkas.** Catatan token mengikuti `pin-refresh` sudah ada sejak
  submodul transfer, tetapi satu spec tertinggal memakai pola lama. Saat
  sebuah aturan ditulis, grep pemakaian pola lamanya di seluruh spec dan
  perbaiki sekaligus, jangan hanya di berkas yang sedang dikerjakan.

- **Salinan untuk migrasi diambil dari `git show HEAD:`, bukan dari berkas
  kerja.** Pada halaman buat penjualan, blok salinan dijalankan setelah
  blok yang menulis halaman tipis, sehingga yang tersalin adalah halaman
  tipis itu. Sumber dari HEAD tidak bergantung pada urutan eksekusi blok.
- **Jangkar diperiksa ada tepat sekali oleh skrip yang menulis, sebelum
  menulis apa pun.** `ganti-baris.js` sempat membandingkan
  `indexOf(jangkar)` dengan indeks yang diberikan; saat jangkar tidak ada,
  keduanya `-1` sehingga dianggap cocok, dan wilayah baru tertempel di
  akhir berkas. Sejak 26 September 2026 helper itu menolak indeks negatif
  dan keluar dengan kode 1. Skrip wilayah di modul penjualan tetap
  menghitung kemunculan setiap jangkar dan berhenti bila tidak tepat satu.
- **Berkas marka hanya memuat pasangan yang wajib.** `ganti-blok.js`
  menulis semua atau tidak sama sekali, sehingga satu pasangan yang tidak
  cocok menahan seluruhnya. Di halaman buat penjualan, pasangan pengganti
  deklarasi tipe union yang setara dengan `JenisPenjualan` gagal cocok
  tanpa sebab yang terjelaskan dan menahan 15 pasangan lain; pasangan itu
  tidak diperlukan dan dibuang.
- **Teks yang muncul berulang diganti dengan jumlah kemunculan yang
  ditetapkan**, bukan lewat pasangan unik: skrip memeriksa setiap pola
  muncul tepat N kali sebelum mengganti semuanya (`d._id || d.id` delapan
  kali di halaman buat penjualan).
- **Istilah `docs:dampak` harus khas.** Istilah umum seperti "lama" atau
  "buat" menjaring ratusan baris derau (237 baris untuk "Lama" di modul
  penjualan). Pakai nama fungsi, nama berkas, atau frasa khas.
- **Gerbang atas kode ditulis sebagai helper yang membaca per pemanggilan,
  bukan grep per baris.** Gerbang grep pertama untuk `route.fulfill`
  salah menghitung, karena `status` hampir selalu ditulis di baris sesudah
  `route.fulfill({`; `audit-fulfill.js` membaca setiap pemanggilan sampai
  pemanggilan berikutnya.
- **Pernyataan dokumentasi tentang seluruh suite diaudit, bukan
  diasumsikan.** Kalimat bahwa seluruh spec e2e memakai backend sungguhan
  bertahan sejak Fase 0, padahal empat spec memalsukan respons sukses:
  aturan `page.route` di Catatan Playwright tidak pernah diperiksa
  terhadap spec yang ditulis sebelum aturan itu ada. Spec lama yang
  dijadikan pembanding migrasi diaudit dulu dengan `audit-fulfill.js`.
- **Variabel daftar berkas di zsh tetap terlupa walau sudah dicatat.**
  Blok pemetaan reservasi memakai `$S` berisi daftar service dan gagal.
  Daftar berkas diteruskan langsung lewat `$(...)` di argumen, bukan
  disimpan ke variabel lebih dulu.

## Kapan berhenti dan bertanya

Beberapa keputusan bukan milik sisi teknis dan harus ditanyakan lebih dulu:

- **Keputusan produk**: apakah sebuah data boleh dilihat semua orang, apakah
  sebuah field masih dibutuhkan, bagaimana perilaku yang benar bila backend dan
  UI berselisih.
- **Cakupan pekerjaan yang membengkak**: bila sebuah perbaikan ternyata
  menyeret banyak berkas di luar rencana, sampaikan pilihannya beserta
  konsekuensi masing-masing, jangan diputuskan sendiri.
- **Menandai test `fixme` atau membuang skenario**: mengurangi cakupan uji
  selalu perlu persetujuan.
- **Menghapus field atau perilaku** yang tampak tidak terpakai, sebelum
  dibuktikan bahwa backend memang tidak memakainya.

Sampaikan pilihan secara ringkas beserta alasan condongnya ke mana, lalu
tunggu jawaban.

Keputusan perbaikan tidak diajukan satu per satu selagi informasi masih
dikumpulkan (pemilik proyek, 21 September 2026). Kumpulkan bukti sampai
cukup, lalu ajukan seluruh temuan yang memerlukan keputusan sekaligus:
masalahnya sekarang, opsi solusi, dan rekomendasi beserta alasannya.
Sebelum keputusan diambil, tidak ada perbaikan yang diterapkan.

## Keputusan berdasar bukti

Setiap keputusan harus bersandar pada kode atau output yang benar-benar
diperiksa, bukan pada dugaan dari gejala. Bila sebuah dugaan muncul, verifikasi
dulu dengan perintah, baru lanjut. Beberapa kali dugaan yang masuk akal ternyata
salah, dan pemeriksaan singkat mencegah bug baru.

## Belajar dari setiap putaran

Setiap debug, penelusuran masalah, dan perbaikan adalah bahan untuk
mempercepat putaran berikutnya. Begitu satu masalah selesai, jawab tiga
pertanyaan ini sebelum melangkah:

1. **Apa yang memperlambat?** Dugaan yang meleset, perintah yang outputnya
   terlalu panjang atau gagal, bukti yang diambil terlambat, atau langkah
   yang diulang.
2. **Apa yang akan menemukannya lebih cepat?** Perintah, urutan pemeriksaan,
   atau sumber bukti yang seharusnya dipakai lebih dulu.
3. **Apakah itu akan berulang?** Bila ya, catat di tempat yang sesuai: pola
   kegagalan ke tabel "Urutan debug kegagalan e2e", perintah baru ke "Perintah
   verifikasi yang biasa dipakai", dan kebiasaan Playwright ke "Catatan
   Playwright" (ketiganya di `pengujian.md`); kesalahan penerapan ke "Disiplin
   saat menerapkan perubahan", dan kebiasaan form atau shell ke catatannya
   (di berkas ini).

Catatan ditulis dalam commit modul yang sama atau commit dokumen penutup
modul itu, selagi konteksnya masih segar. Tulis sebagai aturan yang dapat
langsung diterapkan beserta contoh nyata singkat, bukan sebagai kronologi
kejadian. Bila catatan lama terbukti keliru atau ada cara yang lebih cepat,
perbarui catatan itu alih-alih menambah catatan baru yang bertentangan.
