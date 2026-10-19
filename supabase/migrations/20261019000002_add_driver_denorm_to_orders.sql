-- ====================================================================
-- MIGRATION: Tambahkan kolom denormalized driver & service ke tabel orders
-- Jalankan di Supabase SQL Editor
-- ====================================================================

-- 1. Tambahkan kolom driver info (denormalized untuk performa & realtime)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS driver_name   TEXT,
  ADD COLUMN IF NOT EXISTS driver_phone  TEXT,
  ADD COLUMN IF NOT EXISTS driver_plate  TEXT,
  ADD COLUMN IF NOT EXISTS service_name  TEXT;

-- 2. Backfill service_name dari tabel services untuk order yang sudah ada
UPDATE public.orders o
SET service_name = s.name
FROM public.services s
WHERE o.service_id = s.id
  AND o.service_name IS NULL;

-- 3. Backfill driver_name, driver_phone, driver_plate dari tabel drivers+profiles
--    untuk order yang sudah diassign tapi kolom driver_* belum terisi
UPDATE public.orders o
SET
  driver_name  = p.full_name,
  driver_phone = p.phone,
  driver_plate = d.plate_number
FROM public.drivers d
JOIN public.profiles p ON p.id = d.profile_id
WHERE o.driver_id = d.id
  AND o.driver_id IS NOT NULL
  AND (o.driver_name IS NULL OR o.driver_phone IS NULL OR o.driver_plate IS NULL);

-- Verifikasi hasil
SELECT id, status, driver_id, driver_name, driver_phone, driver_plate, service_name
FROM public.orders
ORDER BY created_at DESC
LIMIT 10;
