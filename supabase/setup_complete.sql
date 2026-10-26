-- ====================================================================
-- SQL SETUP LENGKAP ANJEM UIN — JALANKAN DI SUPABASE SQL EDITOR
-- Salin semua ini, paste di SQL Editor, lalu klik RUN
-- ====================================================================

-- ============================================
-- BAGIAN 1: SETUP TABEL (Jika belum ada)
-- ============================================

-- Aktifkan ekstensi
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabel profiles (auto-dibuat dari auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT 'User',
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('customer', 'driver', 'admin')) DEFAULT 'customer',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabel drivers
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  plate_number TEXT NOT NULL DEFAULT '-',
  vehicle_type TEXT NOT NULL DEFAULT 'Motor',
  photo_url TEXT,
  qris_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'blocked')) DEFAULT 'pending',
  is_online BOOLEAN NOT NULL DEFAULT FALSE,
  rating_avg NUMERIC(3, 2) NOT NULL DEFAULT 5.0,
  total_trips INTEGER NOT NULL DEFAULT 0,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabel services
CREATE TABLE IF NOT EXISTS public.services (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Bike',
  badge_text TEXT,
  extra_fee INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabel fare_zones
CREATE TABLE IF NOT EXISTS public.fare_zones (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  min_km NUMERIC NOT NULL CHECK (min_km >= 0),
  max_km NUMERIC,
  base_price INTEGER NOT NULL CHECK (base_price >= 0),
  per_km_price INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabel popular_routes
CREATE TABLE IF NOT EXISTS public.popular_routes (
  id TEXT PRIMARY KEY,
  origin_name TEXT NOT NULL,
  destination_name TEXT NOT NULL,
  distance_km NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabel orders (customer_id nullable untuk guest checkout)
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  customer_id UUID REFERENCES public.profiles(id),
  customer_name TEXT,
  customer_phone TEXT,
  driver_id UUID REFERENCES public.drivers(id),
  -- Denormalized driver info (diisi saat driver mengambil order)
  driver_name  TEXT,
  driver_phone TEXT,
  driver_plate TEXT,
  service_id TEXT NOT NULL REFERENCES public.services(id),
  -- Denormalized service name (diisi saat order dibuat)
  service_name TEXT,
  pickup_name TEXT NOT NULL,
  pickup_lat NUMERIC NOT NULL DEFAULT 0,
  pickup_lng NUMERIC NOT NULL DEFAULT 0,
  dropoff_name TEXT NOT NULL,
  dropoff_lat NUMERIC NOT NULL DEFAULT 0,
  dropoff_lng NUMERIC NOT NULL DEFAULT 0,
  distance_km NUMERIC NOT NULL,
  fare INTEGER NOT NULL,
  fare_snapshot JSONB NOT NULL DEFAULT '{}',
  is_rain BOOLEAN NOT NULL DEFAULT FALSE,
  rain_fee INTEGER NOT NULL DEFAULT 0,
  is_night BOOLEAN NOT NULL DEFAULT FALSE,
  night_fee INTEGER NOT NULL DEFAULT 0,
  extra_fee_details JSONB NOT NULL DEFAULT '{}',
  item_notes TEXT,
  items_estimate INTEGER,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('qris_driver', 'cash')) DEFAULT 'cash',
  status TEXT NOT NULL CHECK (status IN ('pending', 'assigned', 'on_the_way', 'completed', 'cancelled')) DEFAULT 'pending',
  cancel_reason TEXT,
  assigned_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- Tabel order_events
CREATE TABLE IF NOT EXISTS public.order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status_from TEXT,
  status_to TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabel reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.profiles(id),
  driver_id UUID REFERENCES public.drivers(id),
  service_id TEXT REFERENCES public.services(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL DEFAULT '',
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabel faqs
CREATE TABLE IF NOT EXISTS public.faqs (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- BAGIAN 2: ALTER TABEL (Perbaikan jika sudah ada)
-- ============================================

-- Buat customer_id nullable (untuk guest order)
ALTER TABLE public.orders ALTER COLUMN customer_id DROP NOT NULL;

-- Tambah kolom customer_name & customer_phone jika belum ada
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- Pastikan kolom phone pada profiles boleh NULL
ALTER TABLE public.profiles ALTER COLUMN phone DROP NOT NULL;

-- Normalisasi nomor yang sudah ada
UPDATE public.profiles
SET phone = CASE
  WHEN phone LIKE '+%' THEN substr(phone, 2)
  WHEN phone LIKE '0%' THEN '62' || substr(phone, 2)
  ELSE phone
END
WHERE phone IS NOT NULL;

-- Constraint format nomor WhatsApp: ^62[0-9]{9,13}$
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_phone_format_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_phone_format_check
  CHECK (phone IS NULL OR phone ~ '^62[0-9]{9,13}$');

-- Bersihkan duplikat nomor sebelum membuat unique index
-- Menyimpan nomor pada akun terbaru, dan mengosongkan (SET NULL) nomor pada akun lama yang duplikat
WITH ranked_profiles AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY phone
           ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
         ) AS rn
  FROM public.profiles
  WHERE phone IS NOT NULL
)
UPDATE public.profiles
SET phone = NULL
WHERE id IN (
  SELECT id FROM ranked_profiles WHERE rn > 1
);

-- Unique partial index untuk phone
DROP INDEX IF EXISTS public.profiles_phone_unique_idx;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique_idx
  ON public.profiles (phone)
  WHERE phone IS NOT NULL;



-- ============================================
-- BAGIAN 3: HELPER FUNCTION (Bypass RLS saat cek admin)
-- ============================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()),
    FALSE
  );
$$;

-- ============================================
-- BAGIAN 4: AKTIFKAN RLS
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fare_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popular_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- BAGIAN 5: POLICIES (Hapus lama, buat baru)
-- ============================================

-- PROFILES
DROP POLICY IF EXISTS "Profiles readable by owner or admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_read" ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- DRIVERS
DROP POLICY IF EXISTS "Approved drivers public readable minimal" ON public.drivers;
DROP POLICY IF EXISTS "Driver updatable by owner" ON public.drivers;
DROP POLICY IF EXISTS "drivers_read" ON public.drivers;
DROP POLICY IF EXISTS "drivers_insert" ON public.drivers;
DROP POLICY IF EXISTS "drivers_update" ON public.drivers;
CREATE POLICY "drivers_read" ON public.drivers FOR SELECT
  USING (status = 'approved' OR profile_id = auth.uid() OR public.is_admin());
CREATE POLICY "drivers_insert" ON public.drivers FOR INSERT
  WITH CHECK (profile_id = auth.uid() OR public.is_admin());
CREATE POLICY "drivers_update" ON public.drivers FOR UPDATE
  USING (profile_id = auth.uid() OR public.is_admin());

-- SERVICES (publik bisa baca)
DROP POLICY IF EXISTS "Public read services" ON public.services;
DROP POLICY IF EXISTS "Admin manage services" ON public.services;
DROP POLICY IF EXISTS "services_read" ON public.services;
CREATE POLICY "services_read" ON public.services FOR SELECT USING (true);
CREATE POLICY "Admin manage services" ON public.services FOR ALL USING (public.is_admin());

-- FARE ZONES (publik bisa baca)
DROP POLICY IF EXISTS "Public read fare_zones" ON public.fare_zones;
DROP POLICY IF EXISTS "Admin manage fare_zones" ON public.fare_zones;
DROP POLICY IF EXISTS "fare_zones_read" ON public.fare_zones;
CREATE POLICY "fare_zones_read" ON public.fare_zones FOR SELECT USING (true);
CREATE POLICY "Admin manage fare_zones" ON public.fare_zones FOR ALL USING (public.is_admin());

-- POPULAR ROUTES (publik bisa baca)
DROP POLICY IF EXISTS "Public read popular_routes" ON public.popular_routes;
DROP POLICY IF EXISTS "Admin manage popular_routes" ON public.popular_routes;
DROP POLICY IF EXISTS "popular_routes_read" ON public.popular_routes;
CREATE POLICY "popular_routes_read" ON public.popular_routes FOR SELECT USING (true);
CREATE POLICY "Admin manage popular_routes" ON public.popular_routes FOR ALL USING (public.is_admin());

-- ORDERS (Guest bisa buat, owner & driver & admin bisa baca)
DROP POLICY IF EXISTS "Customer can create orders" ON public.orders;
DROP POLICY IF EXISTS "Customer can read own orders" ON public.orders;
DROP POLICY IF EXISTS "orders_insert" ON public.orders;
DROP POLICY IF EXISTS "orders_read" ON public.orders;
DROP POLICY IF EXISTS "orders_update" ON public.orders;
CREATE POLICY "orders_insert" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_read" ON public.orders FOR SELECT
  USING (
    customer_id = auth.uid()
    OR driver_id IN (SELECT id FROM public.drivers WHERE profile_id = auth.uid())
    OR (status = 'pending' AND EXISTS (SELECT 1 FROM public.drivers WHERE profile_id = auth.uid() AND status = 'approved'))
    OR public.is_admin()
    OR auth.uid() IS NULL  -- Allow anon read for guest order tracking (by order ID)
  );
CREATE POLICY "orders_update" ON public.orders FOR UPDATE
  USING (
    -- Driver bisa update order yang sudah miliknya
    driver_id IN (SELECT id FROM public.drivers WHERE profile_id = auth.uid())
    -- ATAU driver approved bisa mengambil order yang masih pending (driver_id = NULL)
    OR (
      driver_id IS NULL
      AND status = 'pending'
      AND EXISTS (
        SELECT 1 FROM public.drivers
        WHERE profile_id = auth.uid()
          AND status = 'approved'
          AND is_online = TRUE
      )
    )
    OR public.is_admin()
  );

-- ORDER EVENTS
DROP POLICY IF EXISTS "Insert order events" ON public.order_events;
DROP POLICY IF EXISTS "order_events_insert" ON public.order_events;
DROP POLICY IF EXISTS "order_events_read" ON public.order_events;
CREATE POLICY "order_events_insert" ON public.order_events FOR INSERT WITH CHECK (true);
CREATE POLICY "order_events_read" ON public.order_events FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_events.order_id
    AND (
      o.customer_id = auth.uid()
      OR o.driver_id IN (SELECT id FROM public.drivers WHERE profile_id = auth.uid())
      OR public.is_admin()
      OR auth.uid() IS NULL
    )
  )
);

-- REVIEWS (publik bisa baca yang approved)
DROP POLICY IF EXISTS "Public read approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admin manage reviews" ON public.reviews;
DROP POLICY IF EXISTS "reviews_read" ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert" ON public.reviews;
CREATE POLICY "reviews_read" ON public.reviews FOR SELECT
  USING (is_approved = TRUE OR customer_id = auth.uid() OR public.is_admin());
CREATE POLICY "reviews_insert" ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admin manage reviews" ON public.reviews FOR ALL USING (public.is_admin());

-- FAQS (publik bisa baca)
DROP POLICY IF EXISTS "Public read faqs" ON public.faqs;
DROP POLICY IF EXISTS "Admin manage faqs" ON public.faqs;
DROP POLICY IF EXISTS "faqs_read" ON public.faqs;
CREATE POLICY "faqs_read" ON public.faqs FOR SELECT USING (true);
CREATE POLICY "Admin manage faqs" ON public.faqs FOR ALL USING (public.is_admin());

-- ============================================
-- BAGIAN 6: SEED DATA LAYANAN & TARIF
-- ============================================

INSERT INTO public.services (id, slug, name, description, icon, badge_text, extra_fee, sort_order)
VALUES
  ('svc-1', 'antar-jemput-motor', 'Antar Jemput Motor (Ride)', 'Layanan antar jemput menggunakan motor, cocok untuk mahasiswa yang ingin ke kampus atau area sekitar UIN dengan cepat dan hemat.', 'Bike', 'Terpopuler', 0, 1),
  ('svc-2', 'jastip-kuliner', 'Jastip Kuliner & Makanan', 'Pesan makanan atau minuman dari warung, kantin, atau kafe favorit sekitar kampus, diantar ke kos atau gedung kuliah.', 'UtensilsCrossed', null, 2000, 2),
  ('svc-3', 'jastip-belanja', 'Jastip Belanja Kampus', 'Titipkan belanja keperluan kuliah seperti ATK, fotokopi, atau kebutuhan sehari-hari.', 'ShoppingBasket', null, 2000, 3),
  ('svc-4', 'kirim-dokumen', 'Kirim Dokumen & Paket Kilat', 'Kirim berkas, dokumen penting, atau paket ringan ke lokasi di sekitar kampus UIN dengan aman dan cepat.', 'Package', null, 0, 4)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      extra_fee = EXCLUDED.extra_fee;

INSERT INTO public.fare_zones (id, name, min_km, max_km, base_price, per_km_price, color, sort_order)
VALUES
  ('zone-1', 'Radius Sekitar UIN (±1,3 km)', 0.0, 1.3, 5000, 0, '#10b981', 1),
  ('zone-2', 'Radius 1,4 km', 1.3, 1.4, 6000, 0, '#06b6d4', 2),
  ('zone-3', 'Radius 2 km', 1.4, 2.0, 7000, 0, '#3b82f6', 3),
  ('zone-4', 'Radius 3 km', 2.0, 3.0, 8000, 0, '#8b5cf6', 4),
  ('zone-5', 'Lebih dari 3 km', 3.0, 5.0, 8000, 1000, '#f59e0b', 5),
  ('zone-6', 'Di atas 5 km', 5.0, null, 10000, 2000, '#ef4444', 6)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      min_km = EXCLUDED.min_km,
      max_km = EXCLUDED.max_km,
      base_price = EXCLUDED.base_price,
      per_km_price = EXCLUDED.per_km_price,
      color = EXCLUDED.color,
      sort_order = EXCLUDED.sort_order;

INSERT INTO public.popular_routes (id, origin_name, destination_name, distance_km, sort_order)
VALUES
  ('route-1', 'Kos Sekitar Pabelan', 'Gerbang Utama UIN Raden Mas Said', 2.0, 1),
  ('route-2', 'Perumahan Fajar Indah', 'Gedung FITK Kampus UIN', 4.5, 2),
  ('route-3', 'Stasiun Solo Balapan', 'Gerbang Utama UIN Raden Mas Said', 8.5, 3),
  ('route-4', 'Terminal Tirtonadi', 'Gedung Rektorat UIN', 7.0, 4),
  ('route-5', 'Mall Solo Paragon', 'Asrama Mahasiswa UIN', 5.5, 5)
ON CONFLICT (id) DO UPDATE
  SET distance_km = EXCLUDED.distance_km;

INSERT INTO public.faqs (id, question, answer, sort_order)
VALUES
  ('faq-1', 'Bagaimana cara memesan layanan Anjem UIN?', 'Klik tombol "Pesan Sekarang" di halaman utama atau kunjungi halaman Pemesanan. Pilih jenis layanan, isi titik jemput dan tujuan, masukkan nomor WhatsApp aktif, lalu konfirmasi pesanan. Driver akan segera menghubungi Anda.', 1),
  ('faq-2', 'Berapa tarif layanan antar jemput?', 'Tarif dihitung berdasarkan zona jarak: Zona 1 (0-3 km) = Rp 5.000, Zona 2 (3-5 km) = Rp 8.000, Zona 3 (5-10 km) = Rp 12.000, Zona 4 (>10 km) = Rp 12.000 + Rp 2.000/km. Gunakan Kalkulator Tarif di halaman utama untuk estimasi akurat.', 2),
  ('faq-3', 'Apakah driver sudah terverifikasi keamanannya?', 'Ya! Semua mitra driver Anjem UIN adalah mahasiswa atau alumni UIN Raden Mas Said yang telah melalui proses verifikasi identitas, kendaraan, dan orientasi keselamatan oleh tim admin.', 3),
  ('faq-4', 'Metode pembayaran apa yang tersedia?', 'Saat ini tersedia dua metode: Tunai (Cash) langsung ke driver, dan QRIS Driver yang bisa di-scan dari HP Anda saat driver tiba.', 4),
  ('faq-5', 'Bagaimana jika saya ingin membatalkan pesanan?', 'Anda dapat membatalkan pesanan selama driver belum dalam perjalanan menjemput. Buka halaman Lacak Pesanan dan klik tombol Batalkan.', 5)
ON CONFLICT (id) DO UPDATE
  SET answer = EXCLUDED.answer;

-- ============================================
-- BAGIAN 7: TRIGGER AUTO-CREATE PROFILE
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_role TEXT;
  raw_phone TEXT;
  clean_phone TEXT;
  existing_id UUID;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'customer');
  raw_phone := NEW.raw_user_meta_data->>'phone';

  -- Normalisasi phone jika diinput saat registrasi
  IF raw_phone IS NOT NULL AND trim(raw_phone) <> '' THEN
    clean_phone := regexp_replace(trim(raw_phone), '[^0-9+]', '', 'g');
    IF clean_phone LIKE '+%' THEN
      clean_phone := substr(clean_phone, 2);
    END IF;
    IF clean_phone LIKE '0%' THEN
      clean_phone := '62' || substr(clean_phone, 2);
    END IF;

    -- Jika format tidak valid ^62[0-9]{9,13}$, jadikan NULL agar trigger tidak crash
    IF clean_phone !~ '^62[0-9]{9,13}$' THEN
      clean_phone := NULL;
    END IF;

    -- Jika nomor sudah terpakai akun lain, jadikan NULL agar pembuatan akun tetap berhasil
    IF clean_phone IS NOT NULL THEN
      SELECT id INTO existing_id FROM public.profiles WHERE phone = clean_phone LIMIT 1;
      IF existing_id IS NOT NULL AND existing_id <> NEW.id THEN
        clean_phone := NULL;
      END IF;
    END IF;
  ELSE
    clean_phone := NULL;
  END IF;

  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    clean_phone,
    user_role
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        role = COALESCE(EXCLUDED.role, profiles.role);

  -- Jika role driver, otomatis buat record driver (status pending)
  IF user_role = 'driver' THEN
    INSERT INTO public.drivers (profile_id, plate_number, vehicle_type, status)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'plate_number', '-'),
      COALESCE(NEW.raw_user_meta_data->>'vehicle_type', 'Motor'),
      'pending'
    )
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback aman: pastikan akun tetap terdaftar di tabel profiles
    INSERT INTO public.profiles (id, full_name, phone, role)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
      NULL,
      user_role
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- BAGIAN 8: RPC SET_MY_PHONE & TRIGGER ORDERS
-- ============================================

-- RPC set_my_phone (SECURITY DEFINER, hanya mengubah kolom phone milik auth.uid())
CREATE OR REPLACE FUNCTION public.set_my_phone(new_phone TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  clean_phone TEXT;
  existing_id UUID;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Anda harus login untuk menyimpan nomor WhatsApp.';
  END IF;

  IF new_phone IS NULL OR trim(new_phone) = '' THEN
    RAISE EXCEPTION 'Nomor WhatsApp belum diisi.';
  END IF;

  clean_phone := regexp_replace(trim(new_phone), '[^0-9+]', '', 'g');
  IF clean_phone LIKE '+%' THEN
    clean_phone := substr(clean_phone, 2);
  END IF;
  IF clean_phone LIKE '0%' THEN
    clean_phone := '62' || substr(clean_phone, 2);
  END IF;

  IF clean_phone !~ '^62[0-9]{9,13}$' THEN
    RAISE EXCEPTION 'Format nomor WhatsApp tidak valid. Gunakan format yang valid diawali 62 atau 08 (contoh: 081234567890).';
  END IF;

  SELECT id INTO existing_id
  FROM public.profiles
  WHERE phone = clean_phone AND id <> caller_id
  LIMIT 1;

  IF existing_id IS NOT NULL THEN
    RAISE EXCEPTION 'Nomor WhatsApp ini sudah terdaftar pada akun lain.';
  END IF;

  UPDATE public.profiles
  SET phone = clean_phone,
      updated_at = NOW()
  WHERE id = caller_id;

  RETURN jsonb_build_object(
    'success', true,
    'phone', clean_phone,
    'message', 'Nomor WhatsApp berhasil diperbarui.'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.set_my_phone(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_my_phone(TEXT) TO authenticated;

-- Trigger BEFORE INSERT pada orders: Tolak pesanan bila pelanggan belum punya nomor WhatsApp
CREATE OR REPLACE FUNCTION public.check_customer_phone_before_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cust_phone TEXT;
BEGIN
  IF NEW.customer_id IS NOT NULL THEN
    SELECT phone INTO cust_phone
    FROM public.profiles
    WHERE id = NEW.customer_id;

    IF cust_phone IS NULL OR trim(cust_phone) = '' THEN
      RAISE EXCEPTION 'Profil pelanggan belum memiliki nomor WhatsApp yang terdaftar. Harap lengkapi nomor WhatsApp terlebih dahulu.';
    END IF;

    IF NEW.customer_phone IS NULL OR trim(NEW.customer_phone) = '' THEN
      NEW.customer_phone := cust_phone;
    END IF;
  ELSE
    IF NEW.customer_phone IS NULL OR trim(NEW.customer_phone) = '' THEN
      RAISE EXCEPTION 'Nomor WhatsApp pemesan wajib diisi.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_customer_phone ON public.orders;
CREATE TRIGGER trg_check_customer_phone
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.check_customer_phone_before_order();

-- ============================================
-- SELESAI! Periksa tabel di Table Editor Supabase.
-- ============================================
