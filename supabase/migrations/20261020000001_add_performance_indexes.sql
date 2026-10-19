-- ====================================================================
-- MIGRATION: Performance Indexes & Query Optimization (Safe & Idempotent)
-- Anjem Kampus UIN Raden Mas Said Surakarta
--
-- File ini aman dijalankan kapan saja di Supabase SQL Editor.
-- Jika tabel sudah ada, index akan dibuat secara instan.
-- Jika tabel belum ada, skrip akan memberikan peringatan tanpa error 42P01.
-- ====================================================================

DO $$
BEGIN
  -- 1. Index untuk tabel public.orders
  IF to_regclass('public.orders') IS NOT NULL THEN
    -- Index status order (filter pending, assigned, dll)
    CREATE INDEX IF NOT EXISTS idx_orders_status 
      ON public.orders(status);

    -- Index driver_id (lookup order aktif driver)
    CREATE INDEX IF NOT EXISTS idx_orders_driver_id 
      ON public.orders(driver_id);

    -- Composite index order pending belum diambil (query order masuk driver)
    CREATE INDEX IF NOT EXISTS idx_orders_pending_unassigned 
      ON public.orders(created_at DESC) 
      WHERE status = 'pending' AND driver_id IS NULL;

    -- Composite index order aktif driver (status assigned / on_the_way)
    CREATE INDEX IF NOT EXISTS idx_orders_driver_active 
      ON public.orders(driver_id, status) 
      WHERE status IN ('assigned', 'on_the_way');

    -- Index customer_id (dashboard riwayat pelanggan)
    CREATE INDEX IF NOT EXISTS idx_orders_customer_id 
      ON public.orders(customer_id);

    -- Index urutan waktu order
    CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc 
      ON public.orders(created_at DESC);

    RAISE NOTICE 'SUCCESS: Seluruh index untuk tabel public.orders berhasil dibuat.';
  ELSE
    RAISE WARNING 'PERINGATAN: Tabel public.orders tidak ditemukan di database ini. Pastikan Anda membuka project Supabase yang sesuai (ndrnhaqgmqjboysmxtsu) atau sudah menjalankan migrasi initial_schema.sql.';
  END IF;

  -- 2. Index untuk tabel public.drivers
  IF to_regclass('public.drivers') IS NOT NULL THEN
    -- Index profile_id (relasi driver dengan auth profile)
    CREATE INDEX IF NOT EXISTS idx_drivers_profile_id 
      ON public.drivers(profile_id);

    -- Index driver approved & online (RLS query)
    CREATE INDEX IF NOT EXISTS idx_drivers_approved_online 
      ON public.drivers(profile_id) 
      WHERE status = 'approved' AND is_online = TRUE;

    RAISE NOTICE 'SUCCESS: Seluruh index untuk tabel public.drivers berhasil dibuat.';
  ELSE
    RAISE WARNING 'PERINGATAN: Tabel public.drivers tidak ditemukan di database ini.';
  END IF;

  -- 3. Index untuk tabel public.order_events
  IF to_regclass('public.order_events') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_order_events_order_id 
      ON public.order_events(order_id, created_at ASC);

    RAISE NOTICE 'SUCCESS: Index untuk tabel public.order_events berhasil dibuat.';
  ELSE
    RAISE WARNING 'PERINGATAN: Tabel public.order_events tidak ditemukan di database ini.';
  END IF;

  -- 4. Index untuk tabel public.profiles
  IF to_regclass('public.profiles') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_profiles_role 
      ON public.profiles(role);

    RAISE NOTICE 'SUCCESS: Index untuk tabel public.profiles berhasil dibuat.';
  ELSE
    RAISE WARNING 'PERINGATAN: Tabel public.profiles tidak ditemukan di database ini.';
  END IF;
END $$;
