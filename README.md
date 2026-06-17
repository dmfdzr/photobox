# SnappBox

SnappBox adalah aplikasi photobox berbasis web untuk membuat hasil foto bergaya photobox secara cepat. Pengguna bisa mengambil foto dari kamera, mengunggah foto dari perangkat, memilih layout, frame, dan filter, lalu menyimpan hasil akhir sebagai gambar.

Aplikasi ini dibuat sebagai pengalaman yang ringan dan langsung pakai. Tidak ada login, akun, dashboard admin, pembayaran, galeri online, atau proses setup panjang sebelum user bisa mulai membuat photobox.

## Fitur Utama

- Landing page dengan branding SnappBox dan CTA `Start Creating`.
- Flow pembuatan bertahap melalui `/create`, `/camera`, `/upload`, dan `/preview`.
- Pilihan input foto dari kamera atau upload perangkat.
- Kamera dengan countdown 3 detik, capture manual, flash effect, retake, progress foto, dan toggle kamera depan/belakang.
- Kamera otomatis mati setelah sesi foto sesuai layout selesai.
- Upload JPG, PNG, dan WebP dengan validasi ukuran file.
- Preview foto, remove, replace, dan crop controls.
- Crop controls untuk horizontal, vertical, dan zoom pada camera dan upload flow.
- Pilihan layout: Single Photo, Classic Strip, Grid 2x2, dan Double Frame.
- Pilihan frame: Minimal White, Soft Cream, Pastel Pink, Sky Blue, Dark Elegant, dan Green Fresh.
- Pilihan filter: Normal, Black & White, Warm, Cool, Vintage, dan Soft Contrast.
- Preview final sebelum download.
- Download hasil sebagai PNG atau JPG.
- Dark mode dan light mode dengan toggle di landing page dan semua halaman aplikasi.
- Logo dan favicon menggunakan `public/assets/snapp.png`.

## User Flow

### Take Photo

1. User membuka landing page.
2. User klik `Start Creating`.
3. User memilih `Take Photo`.
4. User memilih layout, frame awal, dan filter awal.
5. User masuk ke halaman kamera.
6. User mengambil foto sesuai jumlah yang dibutuhkan layout.
7. Kamera otomatis mati setelah sesi foto selesai.
8. User bisa retake atau mengatur crop foto.
9. User lanjut ke halaman preview.
10. User menyesuaikan layout, frame, atau filter.
11. User download hasil akhir.

### Upload Photo

1. User membuka landing page.
2. User klik `Start Creating`.
3. User memilih `Upload Photo`.
4. User memilih layout, frame awal, dan filter awal.
5. User upload foto sesuai jumlah layout.
6. User bisa remove, replace, dan mengatur crop foto.
7. User lanjut ke halaman preview.
8. User menyesuaikan layout, frame, atau filter.
9. User download hasil akhir.

## Halaman Aplikasi

```txt
/          Landing page
/create    Pilih input method, layout, frame, dan filter awal
/camera    Ambil foto dari kamera
/upload    Upload foto dari perangkat
/preview   Preview final dan download
```

## Tech Stack

- Next.js 16.2.6 App Router
- React 19.2.4
- TypeScript
- Tailwind CSS 4
- shadcn/ui button
- Lucide React
- Browser APIs: MediaDevices, File, Canvas

Catatan: project tetap memakai `.tsx` dan `.ts` sesuai keputusan implementasi saat ini.

## Arsitektur Singkat

SnappBox bersifat frontend-only. Foto tidak dikirim ke backend dan tidak disimpan di database. Semua proses foto, preview, dan export dilakukan di sisi browser.

State aplikasi dikelola oleh `PhotoboxProvider`. Foto disimpan sementara sebagai object URL di memory browser, sedangkan pilihan ringan seperti layout, frame, filter, input method, dan step disimpan di `sessionStorage`.

Keputusan ini menjaga aplikasi tetap cepat dan sederhana. Trade-off-nya: foto tidak bersifat permanen. Jika user refresh atau menutup tab, foto aktif bisa hilang. Karena itu aplikasi menampilkan warning sebelum reload saat sudah ada foto aktif.

## Struktur Project

```txt
app/
  layout.tsx          Root layout, metadata, providers, theme wrapper
  page.tsx            Landing page
  create/page.tsx     Setup input method, layout, frame, filter
  camera/page.tsx     Camera route
  upload/page.tsx     Upload route
  preview/page.tsx    Final preview route
  favicon.ico         Favicon dari snapp.png
  icon.png            App icon dari snapp.png

components/
  brand-mark.tsx      Logo + brand reusable component
  theme-provider.tsx  Light/dark theme state
  theme-toggle.tsx    Theme toggle button
  photobox/
    CameraCapture.tsx       Camera capture UI and controls
    PhotoboxProvider.tsx    Shared photobox session state
    ResultPreview.tsx       Final preview and download controls
    Selectors.tsx           Layout, frame, and filter selectors
    StepIndicator.tsx       Creation step indicator
    UploadPhotoManager.tsx  Upload, preview, replace, remove, crop
    canvas.ts               Canvas renderer and download helper
    config.ts               Layout, frame, filter, and data config
  ui/
    button.tsx

lib/
  utils.ts

public/
  assets/
    snapp.png         Logo source
```

## Data Konfigurasi

Konfigurasi utama ada di `components/photobox/config.ts`:

- `LAYOUTS`: jumlah foto, ukuran output, dan posisi slot foto.
- `FRAMES`: warna background, border, text, accent, dan radius.
- `FILTERS`: filter CSS dan canvas.
- `DEFAULT_SESSION`: state awal aplikasi.

Renderer hasil akhir ada di `components/photobox/canvas.ts`. File ini menggambar frame, slot foto, filter, tanggal, label SnappBox, dan melakukan export PNG/JPG.

## Privacy Model

- Foto diproses di perangkat user.
- Foto tidak di-upload ke server.
- Foto tidak disimpan di database.
- Object URL di-revoke saat foto dihapus, diganti, reset, atau saat app unmount.
- Settings ringan disimpan sementara di `sessionStorage`.
- Tidak ada login atau data akun.

## Menjalankan Project

Install dependencies:

```bash
npm install
```

Jalankan development server:

```bash
npm run dev
```

Buka:

```txt
http://localhost:3000
```

## Verifikasi

Lint:

```bash
npm run lint
```

Typecheck:

```bash
npm run typecheck
```

Production build:

```bash
npm run build
```

## Batasan MVP

SnappBox saat ini tidak mencakup:

- Login/register.
- Backend API.
- Database.
- Cloud storage.
- Online gallery.
- Share link online.
- Payment.
- Admin dashboard.
- Auto print.

## Catatan Deployment

Fitur kamera membutuhkan HTTPS di production agar permission kamera bekerja dengan benar di browser modern. Deploy ke platform seperti Vercel sudah memenuhi kebutuhan ini secara default.

## Commit Message

```txt
chore: rename app branding to SnappBox
```
