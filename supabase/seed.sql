-- ====================================================================
-- SEED DATA — ANJEM UIN
-- Semua data di bawah adalah DATA CONTOH (DEMO)
-- ====================================================================

-- 1. LAYANAN
INSERT INTO public.services (id, slug, name, description, icon, badge_text, extra_fee, is_active, sort_order)
VALUES
  ('svc-1', 'antar-jemput-motor', 'Antar Jemput Motor', 'Naik motor langsung dari lokasi kamu ke tujuan. Cepat, aman, dan terjangkau untuk mobilitas harian mahasiswa.', 'Bike', 'Paling Populer', 0, TRUE, 1),
  ('svc-2', 'jastip-kuliner', 'Jastip Kuliner & Makanan', 'Titip beli makanan, minuman, atau jajanan favoritmu. Driver belikan dan antar langsung ke kosan.', 'UtensilsCrossed', 'Favorit Mahasiswa', 2000, TRUE, 2),
  ('svc-3', 'jastip-belanja', 'Jastip Belanja Harian & Pasar', 'Titip belanja kebutuhan sehari-hari dari minimarket, pasar, atau toko langgananmu.', 'ShoppingBasket', 'Praktis & Hemat', 2000, TRUE, 3),
  ('svc-4', 'kirim-dokumen', 'Kirim Dokumen & Paket Kilat', 'Kirim surat, berkas tugas, atau paket kecil antar lokasi di area layanan dengan cepat.', 'Package', 'Instan Sampai', 0, TRUE, 4)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  extra_fee = EXCLUDED.extra_fee;

-- 2. ZONA TARIF (CONTOH AWAL — Wajib dikonfirmasi sebelum operasional)
INSERT INTO public.fare_zones (id, name, min_km, max_km, base_price, per_km_price, color, sort_order, is_active)
VALUES
  ('zone-1', 'Zona 1', 0, 3, 5000, 0, '#22c55e', 1, TRUE),
  ('zone-2', 'Zona 2', 3, 6, 9500, 0, '#3b82f6', 2, TRUE),
  ('zone-3', 'Zona 3', 6, 10, 14000, 0, '#f59e0b', 3, TRUE),
  ('zone-4', 'Zona 4', 10, NULL, 14000, 2000, '#ef4444', 4, TRUE)
ON CONFLICT (id) DO UPDATE SET
  base_price = EXCLUDED.base_price,
  per_km_price = EXCLUDED.per_km_price;

-- 3. RUTE POPULER (Jarak estimasi — belum diverifikasi lapangan)
INSERT INTO public.popular_routes (id, origin_name, destination_name, distance_km, is_active, sort_order)
VALUES
  ('route-1', 'Kampus UIN Raden Mas Said', 'Stasiun Solo Balapan', 8.5, TRUE, 1),
  ('route-2', 'Kampus UIN Raden Mas Said', 'Terminal Tirtonadi', 9.2, TRUE, 2),
  ('route-3', 'Kampus UIN Raden Mas Said', 'Bandara Adi Soemarmo', 6.0, TRUE, 3),
  ('route-4', 'Kampus UIN Raden Mas Said', 'Stasiun Purwosari', 10.5, TRUE, 4),
  ('route-5', 'Kampus UIN Raden Mas Said', 'Pasar Kartasura', 2.0, TRUE, 5),
  ('route-6', 'Kampus UIN Raden Mas Said', 'Solo Paragon Mall', 12.0, TRUE, 6),
  ('route-7', 'Kampus UIN Raden Mas Said', 'Stadion Manahan', 11.5, TRUE, 7),
  ('route-8', 'Kampus UIN Raden Mas Said', 'Kampus UMS Pabelan', 1.5, TRUE, 8)
ON CONFLICT (id) DO UPDATE SET
  distance_km = EXCLUDED.distance_km;

-- 4. FAQ
INSERT INTO public.faqs (id, question, answer, sort_order, is_active)
VALUES
  ('faq-1', 'Bagaimana cara memesan layanan Anjem UIN?', 'Kamu bisa pesan melalui tombol "Pesan via WhatsApp" di halaman ini, atau melalui form pemesanan web. Sampaikan titik jemput, tujuan, dan jenis layanan yang kamu butuhkan.', 1, TRUE),
  ('faq-2', 'Berapa tarif layanan antar-jemput?', 'Tarif dihitung berdasarkan jarak dan zona layanan. Kamu bisa mengecek estimasi tarif di kalkulator ongkir pada halaman ini. Tarif yang tertera adalah estimasi dan akan dikonfirmasi sebelum operasional resmi.', 2, TRUE),
  ('faq-3', 'Di mana saja area yang dilayani?', 'Area layanan meliputi kawasan kampus UIN Raden Mas Said Surakarta, Kartasura, Sukoharjo, dan beberapa titik di Solo Raya. Wilayah resmi akan diumumkan setelah verifikasi operasional.', 3, TRUE),
  ('faq-4', 'Apa saja metode pembayaran yang diterima?', 'Saat ini mendukung pembayaran tunai (cash) dan QRIS langsung ke driver. Pembayaran QRIS dilakukan langsung kepada driver, bukan melalui platform website.', 4, TRUE),
  ('faq-5', 'Apakah driver sudah terverifikasi?', 'Semua mitra driver menjalani proses verifikasi identitas sebelum bisa menerima order. Driver yang tampil di halaman ini telah mendapat status "approved" dari admin.', 5, TRUE),
  ('faq-6', 'Bagaimana cara mendaftar sebagai driver?', 'Klik tombol "Daftar jadi Driver" di halaman ini atau di footer, lalu lengkapi data diri dan dokumen yang diminta. Tim kami akan memverifikasi dan menghubungimu melalui WhatsApp.', 6, TRUE)
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  answer = EXCLUDED.answer;

-- 5. SITE SETTINGS
INSERT INTO public.site_settings (key, value)
VALUES
  ('contact', '{"whatsapp": "628XXXXXXXXXX", "email": "bantuan@anjemuin.id"}'::jsonb),
  ('operating_hours', '{"value": "06.00 – 22.00 WIB", "note": "Jam layanan dapat berubah sesuai kondisi operasional"}'::jsonb),
  ('service_area', '{"primary": "UIN Raden Mas Said Surakarta, Kartasura", "radius_km": 20}'::jsonb)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();
