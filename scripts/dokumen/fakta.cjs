// Pemeriksaan fakta dokumentasi yang dapat dicocokkan dengan keadaan repo.
const fs = require("fs");
const os = require("os");
const path = require("path");
const { REPO, DOCS, bacaBaris, temuanBaru, jalankan, cobaJalankan } = require("./umum.cjs");

const BACKEND = process.env.BE || path.join(os.homedir(), "Documents", "backend-js");
const PATH_KODE = /`((?:app|components|features|hooks|lib|scripts|tests|types)\/[^`\s]*)`/g;

/** Path kode yang disebut dokumentasi harus masih ada. */
function periksaPath(berkas, temuan) {
  for (const f of berkas) {
    for (const b of bacaBaris(f)) {
      if (b.kode) continue;
      for (const m of b.teks.matchAll(PATH_KODE)) {
        const p = m[1];
        if (/[<*]/.test(p)) continue;
        if (!fs.existsSync(path.join(REPO, p.replace(/\/$/, "")))) {
          temuan.push(temuanBaru(f, b.nomor, "path tidak ada di repo", p));
        }
      }
    }
  }
}

function adaCommit(hash) {
  if (cobaJalankan(`git cat-file -e ${hash}^{commit}`) !== null) return true;
  return fs.existsSync(BACKEND) && cobaJalankan(`git -C "${BACKEND}" cat-file -e ${hash}^{commit}`) !== null;
}

/** Hash yang disebut harus ada; judul commit sementara harus diganti hash bila commitnya sudah ada. */
function periksaCommit(berkas, temuan) {
  const riwayat = jalankan("git --no-pager log --format='%h %s'")
    .split("\n")
    .map((b) => ({ hash: b.slice(0, b.indexOf(" ")), subjek: b.slice(b.indexOf(" ") + 1) }));
  const hasilHash = new Map();
  for (const f of berkas) {
    for (const b of bacaBaris(f)) {
      if (b.kode) continue;
      for (const m of b.teks.matchAll(/`([0-9a-f]{7})`/g)) {
        if (!hasilHash.has(m[1])) hasilHash.set(m[1], adaCommit(m[1]));
        if (!hasilHash.get(m[1])) temuan.push(temuanBaru(f, b.nomor, "hash commit tidak ada", m[1]));
      }
      for (const m of b.teks.matchAll(/`((?:refactor|docs|fix|feat|chore|test)\([a-z0-9-]+\))`/g)) {
        const commit = riwayat.find((r) => r.subjek.startsWith(m[1] + ":"));
        if (commit) {
          temuan.push(temuanBaru(f, b.nomor, "judul commit sementara, hash sudah ada", `${m[1]} = ${commit.hash}`));
        }
      }
    }
  }
}

/** Tabel features/ di arsitektur.md harus sama dengan folder dan berkasnya. */
function periksaFeatures(temuan) {
  const f = path.join(DOCS, "refactor", "arsitektur.md");
  const baris = bacaBaris(f);
  const awal = baris.findIndex((b) => b.teks.startsWith("Isi tiap `features/` yang sudah ada"));
  if (awal < 0) {
    temuan.push(temuanBaru(f, 1, "tabel features/ tidak ditemukan"));
    return;
  }
  const tercatat = new Map();
  for (let i = awal + 1; i < baris.length; i++) {
    const t = baris[i].teks;
    if (t === "" && tercatat.size) break;
    const m = t.match(/^\| `([a-z-]+)` \|/);
    if (m) {
      const berkas = [...t.split("|")[2].matchAll(/`([^`]+)`/g)].map((x) => x[1]);
      tercatat.set(m[1], { nomor: baris[i].nomor, berkas });
    }
  }
  const akar = path.join(REPO, "features");
  const folder = fs.readdirSync(akar).filter((n) => fs.statSync(path.join(akar, n)).isDirectory());
  for (const n of folder) {
    const catatan = tercatat.get(n);
    if (!catatan) {
      temuan.push(temuanBaru(f, baris[awal].nomor, "folder features/ belum tercatat", n));
      continue;
    }
    const nyata = fs.readdirSync(path.join(akar, n)).filter((x) => /\.tsx?$/.test(x));
    for (const x of nyata) {
      if (!catatan.berkas.includes(x)) temuan.push(temuanBaru(f, catatan.nomor, "berkas belum tercatat", `features/${n}/${x}`));
    }
    for (const x of catatan.berkas) {
      if (!nyata.includes(x)) temuan.push(temuanBaru(f, catatan.nomor, "berkas tercatat tetapi tidak ada", `features/${n}/${x}`));
    }
  }
  for (const [n, c] of tercatat) {
    if (!folder.includes(n)) temuan.push(temuanBaru(f, c.nomor, "folder tercatat tetapi tidak ada", `features/${n}`));
  }
}

/** Setiap tabel di status.md paling banyak punya satu **Berikutnya**. */
function periksaBerikutnya(temuan) {
  const f = path.join(DOCS, "refactor", "status.md");
  let blok = [];
  let total = 0;
  const tutupBlok = () => {
    blok.slice(1).forEach((n) => temuan.push(temuanBaru(f, n, "lebih dari satu **Berikutnya** dalam satu tabel")));
    blok = [];
  };
  for (const b of bacaBaris(f)) {
    if (!b.teks.startsWith("|")) {
      tutupBlok();
      continue;
    }
    if (b.teks.includes("**Berikutnya**")) {
      blok.push(b.nomor);
      total++;
    }
  }
  tutupBlok();
  if (total === 0) temuan.push(temuanBaru(f, 1, "tidak ada **Berikutnya** di tabel status"));
}

// Definisi sama dengan perintah angka di docs/README.md. Toleransi mengikuti
// aturan "perbarui bila angkanya berubah cukup jauh".
const METRIK = [
  { label: "Pemakaian `any`", toleransi: 5, perintah: `grep -rc ": any" app components lib features | awk -F: '{s+=$2} END {print s+0}'` },
  { label: "Kemunculan `_id`", toleransi: 5, perintah: `grep -rc "_id" app components features | awk -F: '{s+=$2} END {print s+0}'` },
  { label: "`useAuthGuard()` berulang di halaman", toleransi: 0, perintah: `grep -rlc "useAuthGuard()" app | wc -l` },
  {
    label: "Berkas di atas 700 baris",
    toleransi: 0,
    perintah: `find app components features -name "*.tsx" -o -name "*.ts" | xargs wc -l | sort -rn | awk '$1>700 && $2!="total"' | wc -l`,
  },
];

/** Angka metrik di status.md dihitung ulang dan dibandingkan. */
function periksaMetrik(temuan) {
  const f = path.join(DOCS, "refactor", "status.md");
  const baris = bacaBaris(f);
  for (const m of METRIK) {
    const b = baris.find((x) => x.teks.startsWith(`| ${m.label} |`));
    if (!b) {
      temuan.push(temuanBaru(f, 1, "baris metrik tidak ditemukan", m.label));
      continue;
    }
    const tercatat = Number(b.teks.split("|")[3].trim().split(" ")[0]);
    const sekarang = Number(jalankan(m.perintah));
    if (Math.abs(sekarang - tercatat) > m.toleransi) {
      temuan.push(temuanBaru(f, b.nomor, "metrik basi", `${m.label}: tercatat ${tercatat}, sekarang ${sekarang}`));
    }
  }
}

function periksaFakta(berkas, { metrik }) {
  const temuan = [];
  periksaPath(berkas, temuan);
  periksaCommit(berkas, temuan);
  periksaFeatures(temuan);
  periksaBerikutnya(temuan);
  if (metrik) periksaMetrik(temuan);
  return temuan;
}

module.exports = { periksaFakta };