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

Enam helper disimpan di `~/.cache/frontend-web/alat/`, bersebelahan dengan cache
kontrak. Sampai submodul stok, helper disimpan di `/tmp`, dan folder itu dua
kali dikosongkan sistem dalam sehari: sekali membuat perbaikan dokumen tidak
masuk sebelum commit (`b0d11d2` menyusulkannya). Skrip sekali pakai tetap di
`/tmp`. Periksa dengan `ls ~/.cache/frontend-web/alat` sebelum blok pertama
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
  if (a !== iAwal || z !== iAkhir) {
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
```

- `ganti.js`: dipanggil dengan ``node -e 'require(process.env.HOME + "/.cache/frontend-web/alat/ganti.js")("berkas", [[`lama`, `baru`]])'``.
  Berkas hanya ditulis bila setiap pasangan cocok tepat satu kali. Argumen
  ketiga `true` merapikan baris kosong berlebih.
- `ganti-baris.js`: mengganti rentang baris dari jangkar awal sampai jangkar
  akhir, dengan indeks yang diharapkan sebagai pengaman. Indeks diambil dari
  `grep -n` yang mencetak kedua jangkar di blok yang sama (nomor baris dikurangi
  satu).
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
  tepat satu kali.
- Di dalam template literal skrip, backtick dan tanda dolar yang diikuti kurung
  kurawal ditulis dengan escape, dan tanda miring terbalik ditulis ganda agar
  sampai ke berkas. Hindari kutip bersarang di konten yang disisipkan.
- Untuk menyisipkan kutip tunggal ke dalam argumen `node -e '...'`, tulis
  `'"'"'` (tutup kutip, kutip tunggal di dalam kutip ganda, buka kutip lagi),
  atau pakai skrip heredoc berisi string JavaScript.

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
