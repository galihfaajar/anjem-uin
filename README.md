# Anjem UIN — Layanan Antar-Jemput & Jastip Mahasiswa UIN Raden Mas Said Surakarta

Aplikasi web modern, responsif, dan siap produksi untuk layanan antar-jemput motor, jastip kuliner/makanan, jastip belanja harian, dan pengiriman dokumen/paket kilat bagi mahasiswa di lingkungan **UIN Raden Mas Said Surakarta**, Kartasura, Sukoharjo, dan Solo Raya.

---

## 🚀 Fitur Utama

1. **Landing Page Interaktif (`/`)**
   - **Hero Section**: Dua kolom dengan CTA pesan WhatsApp terformat dan ilustrasi SVG kurir orisinal.
   - **Statistik Transparan**: Jumlah pesanan selesai, driver standby, dan rating ulasan.
   - **4 Layanan Unggulan**: Antar Jemput Motor, Jastip Kuliner, Jastip Belanja Harian, Kirim Dokumen.
   - **Kalkulator Ongkir Interaktif**: Pilihan layanan, slider jarak (0.5 – 20 km), tombol cepat rute populer kampus, dan kartu ringkasan estimasi live.
   - **Cara Pesan (01-03)**: Langkah jelas tanpa janji dispatch palsu.
   - **Driver Showcase**: Menampilkan driver terverifikasi dengan rating dan jumlah trip.
   - **Ulasan Terverifikasi**: Tab filter kategori & ulasan dengan penyamaran nama pelanggan (`R***n`).
   - **Jangkauan & FAQ**: Peta interaktif Leaflet/OpenStreetMap dan accordion FAQ.
   - **Floating WhatsApp Button**: Tombol chat mengambang dengan accessible label.

2. **Halaman Publik Pendukung**
   - **Ulasan (`/ulasan`)**: Filter tab bintang, pencarian teks, dan daftar ulasan terverifikasi.
   - **Struktur Tarif (`/tarif`)**: Penjelasan 4 zona tarif, biaya layanan tambahan, rute populer kampus, dan syarat jarak.
   - **Pusat Bantuan (`/bantuan`)**: FAQ kategori accordion, kontak CS WhatsApp, jam layanan, dan email pengaduan.
   - **Kebijakan Privasi (`/privasi`)**: Draf perlindungan data kontak dan rute perjalanan.
   - **Ketentuan Layanan (`/syarat`)**: Draf aturan pembatalan, jastip makanan, dan keselamatan berkendara.

3. **Autentikasi & Akses Akun (`/masuk` & `/daftar`)**
   - Integrasi Supabase Auth (Email & Password).
   - Registrasi Pelanggan vs Pendaftaran Mitra Driver.
   - Status driver baru otomatis `pending` (tidak dapat mengambil order sebelum disetujui admin).
   - Tombol **⚡ Akses Cepat Mode Demo** (Pelanggan, Driver, Admin) untuk evaluasi instan tanpa perlu kredensial Supabase live.

4. **Alur Pemesanan Multi-Step (`/pesan`)**
   - Langkah 1: Pilih Layanan.
   - Langkah 2: Titik Jemput, Titik Tujuan, Pilihan Rute Populer, & Slider Jarak.
   - Langkah 3: Kontak Pemesan, Catatan Driver, Estimasi Belanja, & Pilihan Pembayaran (Tunai / QRIS Driver).
   - Langkah 4: Ringkasan Rinci & Kalkulasi Tarif Live oleh Server via `/api/orders`.
   - Pencegahan double submit dan manipulasi tarif.

5. **Pelacakan Pesanan Realtime (`/order/[id]`)**
   - Badge status pesanan (`pending` → `assigned` → `on_the_way` → `completed` / `cancelled`).
   - Timeline riwayat perjalanan dari `order_events`.
   - Kartu identitas driver jika sudah ditugaskan + tombol chat WhatsApp ke driver.
   - Modal pembatalan pesanan dengan alasan.
   - Modal ulasan bintang 1-5 setelah pesanan selesai.

6. **Dashboard Mitra Driver (`/driver`)**
   - Tampilan dioptimalkan khusus mobile.
   - Toggle Status **Online / Offline** (order pool hanya terbuka saat Online).
   - Pool "Order Masuk" dengan tombol **Ambil Order** (simulasi transaksi atomik tanpa race condition).
   - Bagian "Order Aktif" dengan tombol transisi: `[Mulai Perjalanan]` → `[Selesaikan Order]`.
   - Riwayat perjalanan dan ringkasan total pendapatan harian.

7. **Dashboard Admin (`/admin`)**
   - Ringkasan metrik harian (Total Order, Menunggu, Aktif, Selesai, Driver Online).
   - Kelola Order: Tabel lengkap dengan pencarian, filter status, dan modal penugasan driver.
   - Verifikasi Driver: Setujui (*Approve*) atau Blokir (*Block*) permohonan mitra.
   - Kelola Tarif & Layanan: Inspeksi 4 layanan dan 4 zona tarif.
   - Audit Log: Pencatatan aksi krusial admin (verifikasi, assign order, ubah tarif).
   - Ekspor Laporan: Unduh data pesanan ke file CSV.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui design tokens
- **Icons**: lucide-react
- **Database & Auth**: Supabase (PostgreSQL, RLS, Auth, Storage)
- **Maps**: Leaflet + OpenStreetMap
- **Testing**: Vitest (Unit tests untuk domain pricing `calculateFare`)
- **Deployment**: Vercel ready

---

## 💻 Cara Menjalankan Lokal

1. **Clone repository dan masuk ke folder:**
   ```bash
   git clone https://github.com/your-username/antarjemput-uin.git
   cd antarjemput-uin/app
   ```

2. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Salin file environment:**
   ```bash
   cp .env.example .env.local
   ```
   *(Aplikasi tetap dapat dijalankan dalam mode demo tanpa mengisi kredensial Supabase)*.

4. **Jalankan development server:**
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) di browser.

5. **Jalankan unit tests:**
   ```bash
   npm test
   ```

---

## 🗄️ Setup Database Supabase

Jika ingin menghubungkan ke database PostgreSQL Supabase Anda sendiri:

1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka menu **SQL Editor** pada dashboard Supabase.
3. Jalankan file migrasi:
   - Salin isi `supabase/migrations/20261019000001_initial_schema.sql` dan klik **Run**.
4. Jalankan file seed data awal:
   - Salin isi `supabase/seed.sql` dan klik **Run**.
5. Buka menu **Project Settings -> API**, salin `Project URL` dan `anon key` ke file `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh......
   ```

### Cara Membuat Akun Admin Pertama Secara Aman

1. Daftar akun baru melalui halaman `/daftar` dengan email admin Anda.
2. Buka SQL Editor di Dashboard Supabase, jalankan perintah:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE id = (SELECT id FROM auth.users WHERE email = 'email-admin-anda@kampus.ac.id');
   ```
3. Akun tersebut kini memiliki hak akses penuh ke dashboard `/admin`.

---

## ⚙️ Konfigurasi Terpusat (`src/config/site.ts`)

Semua konfigurasi brand, nomor WhatsApp, jam layanan, koordinat peta, dan area operasional disimpan terpusat di `src/config/site.ts`.

### ⚠️ Checklist Hal Operasional yang Perlu Dikonfirmasi Pengelola:

- [ ] **Nomor WhatsApp Resmi Admin**: Ganti placeholder `628XXXXXXXXXX` dengan nomor WhatsApp bisnis resmi.
- [ ] **Tarif Resmi 4 Zona**: Konfirmasi apakah tarif Zona 1 (Rp5.000), Zona 2 (Rp9.500), Zona 3 (Rp14.000), Zona 4 (Rp14.000 + Rp2.000/km) sudah sesuai kesepakatan pengelola.
- [ ] **Batas Area Operasional**: Verifikasi batas wilayah layanan di sekitar Kartasura, Sukoharjo, dan Solo Raya.
- [ ] **Jam Operasional**: Konfirmasi jam operasional resmi (default: 06.00 – 22.00 WIB).
- [ ] **Metode Pembayaran**: Konfirmasi kebijakan penggunaan QRIS driver vs tunai.

---

## 🧪 Hasil Pengujian & QA

- ✅ **TypeScript Check**: `npx tsc --noEmit` lulus 100% tanpa error.
- ✅ **Unit Tests**: `npm test` lulus 9/9 skenario pengujian kalkulasi tarif (Zona 1-4, biaya tambahan jastip, batas atas jarak, dan penanganan input negatif).
- ✅ **Desain & Responsivitas**: Mobile drawer, tablet grid, dan desktop 2 kolom dengan layout bersih dan kontras WCAG AA.
