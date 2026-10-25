# Helper, Shell, dan Form

Sifat perubahan: **Jarang**: bertambah saat ada pelajaran.

Lapis referensi: kirim bila pekerjaannya membutuhkan. Isinya dipindah dari docs/refactor pada 19 Oktober 2026 tanpa perubahan.

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

Dua belas helper disimpan di `~/.cache/frontend-web/alat/`, bersebelahan dengan cache
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
const ringkas = (e) => bersih(e.message).split("\n").slice(0, 4).join(" ").slice(0, 300);
const jalan = (su) =>
  su.forEach((x) => {
    (x.specs || []).forEach((sp) =>
      sp.tests.forEach((t) =>
        t.results.forEach((res) => {
          if (res.status === "passed") return;
          const galat = res.errors && res.errors.length ? res.errors : res.error ? [res.error] : [];
          console.log(res.status.toUpperCase() + ": " + sp.title.slice(0, 80) + (galat.length ? " (" + galat.length + " galat)" : ""));
          galat.forEach((e, i) => console.log("  " + (i + 1) + ". " + ringkas(e)));
          (t.annotations || []).forEach((a) => console.log("  ANOTASI " + a.type + (a.description ? ": " + a.description : "")));
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
  if (m[1] === "akhir") {
    pasangan.push(p);
    p = { berkas: p.berkas };
  }
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
cat > ~/.cache/frontend-web/alat/ganti-rentang.js <<'EOF'
const fs = require("fs");
const blok = [];
let p = null;
let mode = null;
let isi = [];
for (const b of fs.readFileSync(process.argv[2], "utf8").split("\n")) {
  const m = b.match(/^@@@ (berkas|dari|sampai|baru|akhir)(?: (.+))?$/);
  if (!m) {
    if (mode === "baru") isi.push(b);
    continue;
  }
  if (m[1] === "berkas") p = { berkas: m[2] };
  if (m[1] === "dari") p.dari = m[2].trim();
  if (m[1] === "sampai") p.sampai = m[2].trim();
  if (m[1] === "baru") {
    mode = "baru";
    isi = [];
  }
  if (m[1] === "akhir") {
    p.baru = isi;
    blok.push(p);
    mode = null;
  }
}
const berkas = {};
const gagal = [];
for (const { berkas: f, dari, sampai, baru } of blok) {
  if (!(f in berkas)) berkas[f] = fs.readFileSync(f, "utf8").split("\n");
  const baris = berkas[f];
  const akhirDicari = sampai ?? dari;
  const awal = baris.map((b, i) => (b.trim() === dari ? i : -1)).filter((i) => i >= 0);
  if (awal.length !== 1) {
    gagal.push("GAGAL dari " + f + " (" + awal.length + "): " + dari.slice(0, 70));
    continue;
  }
  const akhir = baris.findIndex((b, i) => i >= awal[0] && b.trim() === akhirDicari);
  if (akhir < 0) {
    gagal.push("GAGAL sampai " + f + ": " + akhirDicari.slice(0, 70));
    continue;
  }
  baris.splice(awal[0], akhir - awal[0] + 1, ...baru);
}
if (gagal.length) {
  console.error(gagal.join("\n"));
  process.exit(1);
}
for (const [f, baris] of Object.entries(berkas)) fs.writeFileSync(f, baris.join("\n"));
console.log("OK " + blok.length + " rentang di " + Object.keys(berkas).length + " berkas");
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
  if (aksi === "terima" && id) {
    const r = await panggil("PATCH", "/transferstok/" + id + "/terima", token, {});
    console.log("PATCH terima", r.status, String(r.json.message || "").slice(0, 150));
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
  for (const m of s.matchAll(/\b(apiData|apiMentah|api|apiClient)\.(get|post|put|patch|delete)\s*(?:<[^(]*?>)?\s*\(\s*EP\.([\w.]+)/g)) {
    if (ep[m[3]]) catat(kunci(m[2], ep[m[3]]), f); else tidakKenal.push(f + " EP." + m[3]);
  }
  for (const m of s.matchAll(/\b(apiData|apiMentah|api|apiClient)\.(get|post|put|patch|delete)\s*(?:<[^(]*?>)?\s*\(\s*`\$\{EP\.([\w.]+)(?:\([^)]*\))?\}([^`]*)`/g)) {
    if (ep[m[3]]) catat(kunci(m[2], ep[m[3]] + m[4]), f); else tidakKenal.push(f + " EP." + m[3]);
  }
  for (const m of s.matchAll(/\b(apiData|apiMentah|api|apiClient)\.(get|post|put|patch|delete)\s*(?:<[^(]*?>)?\s*\(\s*([`'"])(\/[^`'"]*)\3/g)) catat(kunci(m[2], m[4]), f);
  for (const m of s.matchAll(/fetch\(\s*`\$\{\w+\}(\/[^`]*)`([\s\S]{0,300})/g)) catat(kunci(metode(m[2]), m[1]), f);
  for (const m of s.matchAll(/fetch\(\s*([`'"])[^`'"]*\/api(\/[^`'"]*)\1([\s\S]{0,300})/g)) catat(kunci(metode(m[3]), m[2]), f);
}
const rute = {};
for (const n of fs.readdirSync(BE + "/routes")) {
  if (!/Routes?\.js$/.test(n)) continue;
  const mount = n.replace(/Routes?\.js$/, "").toLowerCase();
  const s = fs
    .readFileSync(BE + "/routes/" + n, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((b) => !/^\s*\/\//.test(b))
    .join("\n");
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
cat > ~/.cache/frontend-web/alat/galat-e2e.js <<'EOF'
const path = require("path");
const r = require(path.resolve(process.argv[2] || "/tmp/p.json"));
let n = 0;
const lokasi = (e) =>
  e && e.location ? " @ " + e.location.file.split("/").slice(-2).join("/") + ":" + e.location.line : "";
const jalan = (daftar) =>
  daftar.forEach((s) => {
    (s.specs || []).forEach((sp) =>
      sp.tests.forEach((t) =>
        t.results.forEach((res) => {
          if (res.status !== "failed" && res.status !== "timedOut") return;
          n++;
          console.log("== " + sp.title.slice(0, 90) + " (" + sp.file + ":" + sp.line + ", " + res.status + ")");
          const galat = res.errors && res.errors.length ? res.errors : [res.error];
          galat.forEach((e, i) =>
            console.log("-- galat " + (i + 1) + lokasi(e) + "\n" +
              String(e && e.message).replace(/\x1b\[[0-9;]*m/g, "").slice(0, 700)),
          );
        }),
      ),
    );
    if (s.suites) jalan(s.suites);
  });
jalan(r.suites);
console.log("gagal: " + n);
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
  berkas di argumen pertama): jumlah per status, lalu untuk setiap test
  yang tidak lolos status, judul, jumlah galatnya, empat baris pertama
  setiap galat (paling banyak 300 karakter), dan anotasinya (`ANOTASI
  fixme` atau `skip` beserta alasannya), sehingga test yang dilewati
  terbaca alasannya tanpa membuka spec.
- `daftar-eslint.js`: membaca `eslint -f json` dari stdin, mencetak setiap
  error beserta berkas, baris, dan aturannya, lalu selalu `error: N`.
- `ganti-blok.js`: seperti `ganti.js`, tetapi pasangan dibaca dari berkas
  teks bermarka baris `@@@ berkas <path>`, `@@@ lama`, `@@@ baru`, dan
  `@@@ akhir`, sehingga teks berisi backtick dan tanda dolar (dokumentasi
  Markdown) tidak perlu di-escape. Pasangan tanpa `@@@ berkas` sendiri
  memakai berkas pasangan sebelumnya (sejak 8 Oktober 2026). Berkas marka
  ditulis dengan heredoc
  berdelimiter kutip yang berbeda dari `EOF` bila isinya memuat heredoc.
  Seluruh pasangan diperiksa lebih dulu dan setiap kegagalan dilaporkan
  sekaligus; tidak ada berkas yang ditulis bila satu pasangan tidak cocok
  tepat satu kali. Pasangan yang teks barunya memuat teks lamanya (sisipan
  di sekitar jangkar) ditolak dengan `SUDAH DITERAPKAN` bila teks baru itu
  sudah ada di berkas, sehingga blok yang tertempel atau dijalankan dua kali
  tidak menyisipkan ulang. Tanpa pengaman ini, `bentuk.cjs` sempat berisi
  setiap sisipan dua kali (21 September 2026).
- `ganti-rentang.js`: mengganti rentang baris per pasangan dari berkas
  marka bertanda `@@@ berkas <path>`, `@@@ dari <baris>`, `@@@ sampai
  <baris>` (opsional; tanpa itu hanya baris `dari` yang diganti),
  `@@@ baru`, dan `@@@ akhir`. Jangkar dicocokkan setelah spasi awal dan
  akhirnya dipangkas: `dari` harus muncul tepat sekali di seluruh berkas,
  dan `sampai` adalah kecocokan pertama sejak `dari`. Teks baru ditulis
  apa adanya, termasuk indentasinya. Seluruh pasangan diperiksa lebih
  dulu, dan tidak ada berkas yang ditulis bila satu pasangan gagal.
  Dipakai untuk rentang kode yang teks lamanya panjang, karena cukup dua
  baris jangkar yang terlihat di keluaran. Karena dipangkas, `sampai`
  berupa penutup seperti `}` atau `});` dapat mengenai penutup blok
  dalam; pakai baris yang khas.
- `tinjau-surat-jalan.js`: membaca basis data development (baca-saja) dan
  mencetak sampai 10 surat jalan berstatus argumen pertama (bawaan
  DIKIRIM), beserta jumlah jurnal kirim, batal, dan terima miliknya serta
  status pengajuannya. Dipakai memastikan tidak ada surat jalan uji yang
  tertinggal DIKIRIM.
- `api-surat-jalan.js`: masuk lewat API dengan akun uji. Tanpa argumen
  mencetak daftar surat jalan, dengan `detail <id>` mencetak satu surat
  jalan, dengan `batal <id>` membatalkannya lewat backend sehingga stok
  gudang kembali, dan dengan `terima <id>` menerimanya penuh (body kosong
  berarti seluruh barang diterima, sejak backend `465b438`). Terima dipakai
  menutup surat jalan uji yang tertinggal DIKIRIM, karena batal dari
  DIKIRIM ditolak backend (keputusan PB10a). Login PIN-nya mengambil alih
  sesi web Ridho.
- `audit-endpoint.js`: dijalankan dari akar repo frontend-web. Memetakan
  setiap panggilan frontend (`apiData`, `apiMentah`, `api`, dan `apiClient`
  dengan `EP`,
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
  Lampiran A kini membuat cacat semacam itu langsung terlihat. Komentar
  blok dan baris yang diawali `//` di berkas route dibuang sebelum
  dibaca; sampai 28 September 2026 route yang dikomentari
  (`create-tenant` di `akunRoute.js`) ikut terhitung sebagai route ke-247.
- `audit-fulfill.js`: menghitung `route.fulfill` per spec di folder
  argumen pertama (bawaan `tests/e2e`). Setiap pemanggilan dibaca sampai
  pemanggilan berikutnya, sehingga `status` di baris lain ikut terbaca:
  status 4xx atau 5xx dan `JAWAB_GAGAL` dihitung gagal, tanda
  `// simulasi:` di baris itu atau tepat di atasnya dihitung simulasi dan
  dicetak beserta alasannya, dan sisanya, termasuk status dari variabel,
  dihitung sukses. Keluar dengan kode 1 bila ada yang sukses, sehingga
  dapat menjadi gerbang (`referensi/playwright.md`, Perintah verifikasi).
- `galat-e2e.js`: membaca `/tmp/p.json` (atau berkas di argumen pertama)
  dan mencetak judul, berkas, baris, dan status setiap test yang gagal
  atau habis waktu, lalu setiap galatnya beserta lokasinya di spec dan
  700 karakter pertama pesannya, diakhiri `gagal: N`. Dipakai
  setelah `ringkas-e2e.js` bila nilai yang diterima terpotong; di spec
  master data reservasi, nilai itulah yang membedakan status 500, elemen
  yang tidak ditemukan, dan data yang tidak berubah.
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
  `referensi/disiplin-perubahan.md` untuk `5a3deea` harus dikirim ulang karenanya.

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
- ESLint 9 tidak punya formatter `unix`. `-f unix` gagal, dan bila
  galatnya dibuang ke `/dev/null` keluarannya kosong seolah bersih.
  Pakai `-f json` dengan helper yang sudah ada: `daftar-eslint.js` untuk
  error per berkas dan aturan, atau `hitung-eslint.js` untuk jumlahnya.
  Keduanya hanya membaca error; warning dibaca dari `warningCount` dan
  `messages` lewat `node -e` (25 Oktober 2026, ketika helper itu
  terlewat dan ringkasan ditulis ulang).
- `npm run lint` dan `eslint .` mencakup `scripts/`, sedangkan `eslint`
  per folder tidak. Bandingkan lingkupnya sebelum menyimpulkan bersih
  atau gagal: per `a972956`, `eslint .` gagal di `scripts/dokumen/*.cjs`
  sementara berkas yang diubah bersih.
  Sejak `78c82d7` `eslint .` bersih dari error, lewat pengecualian
  `@typescript-eslint/no-require-imports` untuk `scripts/**/*.cjs`.
- Saat menyaring potongan JSX dengan `grep -v`, pola atribut seperti
  `className=` ikut membuang baris teks yang memuat ikon
  (`<Clock className="..." /> Draft SJ`). Saring hanya baris yang
  seluruh isinya pembungkus, misalnya `^(return \(|\);|</Badge>)$`.
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
  dibutuhkan, dan baca waktu ubah berkas lewat `stat -c '%y %n' <berkas>`
  (17 Oktober 2026, gerbang commit K-C).

- **Kata yang diawali `=` diperluas zsh.** `echo ====` gagal dengan
  `=== not found`, karena zsh membaca `=perintah` sebagai path perintah
  itu, dan sisa baris tidak berjalan. Pemisah ditulis berkutip, misalnya
  `echo '== judul'`.
- **Kolom keluaran Jest tidak tetap.** Baris `FAIL` memuat nama project
  (`unit`, `integration`) dan kadang durasi (`(811.617 s)`), sehingga
  `awk '{print $2}'` maupun `$NF` salah mengambil path. Ambil path dengan
  pola `grep -oE '__tests__/[^ ]+\.test\.js'`.
- **Substitusi `$(grep -n ...)` untuk nomor baris dipastikan tunggal.**
  Bila polanya cocok di dua baris, variabelnya berisi dua angka dan
  aritmetika zsh gagal dengan `bad math expression`; judul skenario
  validasi di spec tarif muncul di dua `describe`. Pakai `grep -m1 -n`,
  atau cetak dulu seluruh kecocokan.

- **Daftar berkas di variabel diteruskan dengan `$=VAR`.** Di zsh,
  `$=F` memecah isi variabel per spasi, sehingga daftar berkas yang
  dipakai dua kali (gerbang yang memeriksa waktu ubah dan `git add`)
  cukup ditulis sekali: `F="a.ts b.ts"`, lalu `git add $=F`. Terbukti
  pada commit `9ce288b`.

- **`grep` tanpa berkas menunggu masukan keyboard.** Pola
  `grep ... $(find ...)` yang hasil `find`-nya kosong membuat terminal
  diam tanpa pesan; tambahkan `/dev/null` sebagai berkas terakhir.
- **Tanda `✘` di prompt berarti perintah terakhir keluar dengan kode
  bukan 0.** `grep -c` yang menjawab 0 juga keluar dengan kode 1, sehingga
  hitungan ditulis `echo "label: $(grep -c ...)"`, agar `✘` hanya muncul
  bila ada yang benar-benar gagal.
- **Pola glob beberapa ekstensi sekaligus gagal seluruhnya bila salah
  satunya tidak cocok.** `grep ... dir/*.ts dir/*.tsx` di folder tanpa
  `.tsx` membatalkan seluruh perintah, termasuk bagian `.ts` yang cocok;
  pakai `find dir -name '*.ts*'` (30 September 2026, ekspor `features/`).
- **Rangkaian `&&` berhenti di langkah pertama yang gagal**, termasuk
  pemeriksaan pendahulu seperti `wc -c` atas berkas yang belum dibuat,
  sehingga `tsc` sesudahnya tidak berjalan tanpa tanda. Pemeriksaan yang
  boleh gagal ditulis `echo "x: $(wc -c < f 2>/dev/null || echo TIDAK ADA)"`.

Kode keluar perintah yang keluarannya disalurkan lewat pipa tidak
terbaca dari `$?`, karena `$?` adalah kode keluar perintah terakhir di
pipa, misalnya `tail`. Di zsh, bacalah `${pipestatus[1]}` (huruf kecil,
mulai dari 1); `${PIPESTATUS[0]}` hanya ada di bash. Untuk gerbang,
jalankan tanpa pipa dengan keluaran ke `/dev/null`, lalu rangkai dengan
`&&`. Pada putaran pengembalian (25 Oktober 2026), audit-fulfill.js
yang disalurkan ke `tail -3` mencetak kode 0 padahal alat itu keluar 1.

## Catatan form (React Hook Form dan Zod)

- **Hindari `z.coerce`.** Ia membuat tipe input dan output skema berbeda,
  sehingga `useForm<T>` dengan satu parameter tipe bentrok dengan resolver.
  Pengecualian (keputusan T2a, tarif `365553f`): bila halaman lama
  mengikat angka lewat `register` biasa dan migrasinya hanya memindah
  logika, `z.coerce` boleh dipertahankan dengan
  `useForm<z.input, unknown, z.output>`. Isian kosong yang harus ditolak
  dipetakan ke `undefined` lewat `z.preprocess`, karena `z.coerce`
  membaca teks kosong sebagai 0.
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
- **Callback `refine` diberi anotasi `: boolean`** bila isian harus tetap
  bertipe lebar. TypeScript 5.5 ke atas menyimpulkan
  `(v) => v === "1" || v === "2"` sebagai predikat tipe, dan zod 4
  mempersempit tipe keluaran menjadi `"1" | "2"`, sehingga nilai awal `""`
  ditolak `tsc` (`features/pajak/schema.ts`).
- **Form memakai `noValidate` dan skema**, bukan validasi browser. Atribut
  `required` dan `min` menahan submit tanpa pesan yang terlihat bagi
  pengguna maupun test; form buat pajak lama menahan submit selama isian
  prioritas kosong, walau state form berisi 1.
