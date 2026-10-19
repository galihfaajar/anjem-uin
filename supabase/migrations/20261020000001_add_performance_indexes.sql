-- ====================================================================
-- MIGRATION: Performance Indexes & Query Optimization
-- Anjem Kampus UIN Raden Mas Said Surakarta
--
-- Jalankan file SQL ini di Supabase SQL Editor agar database responsif,
-- instan, dan bebas lag saat driver mengambil order atau update status.
-- ====================================================================

-- 1. Index untuk status order (sangat sering difilter: pending, assigned, dll)
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- 2. Index untuk driver_id pada orders (lookup order aktif driver)
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON public.orders(driver_id);

-- 3. Composite Index untuk pending orders (query driver cari order masuk)
CREATE INDEX IF NOT EXISTS idx_orders_pending_unassigned 
  ON public.orders(created_at DESC) 
  WHERE status = 'pending' AND driver_id IS NULL;

-- 4. Composite Index untuk active order driver (lookup status assigned/on_the_way)
CREATE INDEX IF NOT EXISTS idx_orders_driver_active 
  ON public.orders(driver_id, status) 
  WHERE status IN ('assigned', 'on_the_way');

-- 5. Index untuk customer_id pada orders (dashboard riwayat pelanggan)
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);

-- 6. Index untuk urutan waktu order (ORDER BY created_at DESC)
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON public.orders(created_at DESC);

-- 7. Index untuk profile_id di drivers (menghilangkan lag pada RLS dan auth check)
CREATE INDEX IF NOT EXISTS idx_drivers_profile_id ON public.drivers(profile_id);

-- 8. Index untuk drivers approved & online (RLS query)
CREATE INDEX IF NOT EXISTS idx_drivers_approved_online 
  ON public.drivers(profile_id) 
  WHERE status = 'approved' AND is_online = TRUE;

-- 9. Index untuk order_events (riwayat event / timeline tracking per order)
CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON public.order_events(order_id, created_at ASC);

-- 10. Index untuk profiles role (pemeriksaan is_admin dan RBAC)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
