-- ====================================================================
-- MIGRATION: Update Pricelist & Zona Layanan Baru + Integrasi Cuaca Hujan & Jam Malam
-- ====================================================================

-- 1. Perbarui 6 Zona Layanan Baru sesuai Pricelist Resmi
INSERT INTO public.fare_zones (id, name, min_km, max_km, base_price, per_km_price, color, sort_order, is_active)
VALUES
  ('zone-1', 'Radius Sekitar UIN (±1,3 km)', 0.0, 1.3, 5000, 0, '#10b981', 1, TRUE),
  ('zone-2', 'Radius 1,4 km', 1.3, 1.4, 6000, 0, '#06b6d4', 2, TRUE),
  ('zone-3', 'Radius 2 km', 1.4, 2.0, 7000, 0, '#3b82f6', 3, TRUE),
  ('zone-4', 'Radius 3 km', 2.0, 3.0, 8000, 0, '#8b5cf6', 4, TRUE),
  ('zone-5', 'Lebih dari 3 km', 3.0, 5.0, 8000, 1000, '#f59e0b', 5, TRUE),
  ('zone-6', 'Di atas 5 km', 5.0, NULL, 10000, 2000, '#ef4444', 6, TRUE)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  min_km = EXCLUDED.min_km,
  max_km = EXCLUDED.max_km,
  base_price = EXCLUDED.base_price,
  per_km_price = EXCLUDED.per_km_price,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- Pastikan hanya zona 1 s/d 6 yang aktif
UPDATE public.fare_zones
SET is_active = FALSE
WHERE id NOT IN ('zone-1', 'zone-2', 'zone-3', 'zone-4', 'zone-5', 'zone-6');

-- 2. Tambah kolom pendukung di tabel orders jika belum ada
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS is_rain BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS rain_fee INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_night BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS night_fee INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS extra_fee_details JSONB NOT NULL DEFAULT '{}';
