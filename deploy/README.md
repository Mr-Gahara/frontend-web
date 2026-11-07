# Deploy frontend web ke VPS

Frontend berjalan di VPS yang sama dengan backend, sebagai satu container di
belakang Caddy milik stack backend (keputusan pemilik proyek, 7 November
2026). Panduan VPS, DNS, backup, dan update backend tetap di
`deploy/RUNBOOK.md` repo backend; berkas ini hanya menambahkan frontend.

| Komponen | Keterangan |
|---|---|
| Domain web | Misalnya `app.domainkamu.id`. `/api/*` diteruskan Caddy langsung ke `backend:4000`; sisanya ke `frontend:3000` |
| Domain API | `API_DOMAIN` (misalnya `api.domainkamu.id`) tetap untuk aplikasi Flutter, tidak berubah |
| frontend | Next.js 16 output standalone, Node 22, port 3000 di jaringan internal |
| Sumber daya | Sekitar 165 MB RAM saat berjalan; build memuncak sekitar 2 GB (diukur 7 November 2026) |

Web dan API satu asal, sehingga browser tidak butuh CORS lintas domain dan
cookie `refreshToken` tetap cookie pihak pertama. Rewrite `/api` di
`next.config.ts` hanya dipakai di development.

## Berkas

- `Dockerfile` dan `.dockerignore` di akar repo: image frontend.
- `deploy/Caddyfile.web`: blok situs web untuk Caddyfile backend.
- `deploy/compose.web.yml`: service `frontend` dan dua perubahan service
  `caddy` untuk `docker-compose.prod.yml` backend.

## Langkah sekali (di VPS, setelah stack backend berjalan)

1. DNS: record `A` untuk domain web ke IP VPS, aktif sebelum Caddy dijalankan
   ulang (sertifikat diterbitkan lewat port 80).
2. Ambil kode:

   ```bash
   sudo mkdir -p /opt/pos-frontend && sudo chown deploy:deploy /opt/pos-frontend
   git clone https://github.com/Mr-Gahara/frontend-web.git /opt/pos-frontend
   ```

3. Di repo backend (`/opt/pos-backend`), diubah oleh pemilik repo backend:
   - salin isi `deploy/Caddyfile.web` ke bawah `deploy/Caddyfile`;
   - salin service `frontend` dari `deploy/compose.web.yml` ke
     `docker-compose.prod.yml`, lalu tambahkan `depends_on` frontend dan
     `WEB_DOMAIN` ke service `caddy`;
   - di `deploy/.env.production`, tambahkan `WEB_DOMAIN=app.domainkamu.id`
     dan pastikan `CORS_ORIGINS` memuat `https://app.domainkamu.id`.
     Browser tetap mengirim header `Origin` pada POST walau satu asal, dan
     backend menolak origin yang tidak terdaftar;
   - perbarui `deploy/RUNBOOK.md` bagian Arsitektur, yang masih mencatat
     frontend di Vercel.
4. Jalankan:

   ```bash
   cd /opt/pos-backend
   dc() { docker compose -f docker-compose.prod.yml --env-file deploy/.env.production "$@"; }
   dc config --quiet && echo "compose valid"
   dc up -d --build frontend caddy
   dc ps
   ```

## Verifikasi

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://app.domainkamu.id/login     # 200
curl -s -o /dev/null -w "%{http_code}\n" https://app.domainkamu.id/api/tenant  # 401, dijawab backend
dc logs caddy | grep -i certificate
```

`/api/tenant` tanpa token dijawab 401 oleh backend, tanda `/api/*` sampai ke
backend.

## Update rutin

```bash
cd /opt/pos-frontend && git log --oneline -1 && git pull
cd /opt/pos-backend
docker tag pos-frontend:latest pos-frontend:sebelum-$(date +%Y%m%d%H%M)
dc up -d --build frontend
dc ps
```

Build memakai sekitar 2 GB RAM; di VPS 4 GB dengan swap 2 GB (RUNBOOK 3.3)
jalankan di luar jam operasional outlet. Rollback:
`docker tag pos-frontend:sebelum-<tanggal> pos-frontend:latest` lalu
`dc up -d --no-build frontend`.

## Menjalankan build produksi di lokal

```bash
npm run build      # next build, lalu salin public dan .next/static ke .next/standalone
npm start          # node .next/standalone/server.js, port 3000 (PORT=3100 npm start untuk port lain)
```
