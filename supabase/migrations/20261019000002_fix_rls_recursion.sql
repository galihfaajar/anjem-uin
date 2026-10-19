-- ====================================================================
-- PERBAIKAN RLS RECURSION & DUKUNGAN GUEST ORDER — ANJEM UIN
-- Salin seluruh isi file ini, lalu jalankan (RUN) di SQL Editor Supabase
-- ====================================================================

-- 1. Buat helper function SECURITY DEFINER agar bypass RLS saat periksa role admin
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

-- 2. Dukungan Order Tamu / Mahasiswa Tanpa Akun (Guest Order)
ALTER TABLE public.orders ALTER COLUMN customer_id DROP NOT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- 3. Perbaiki Policy Profiles (Cegah infinite loop)
DROP POLICY IF EXISTS "Profiles readable by owner or admin" ON public.profiles;
CREATE POLICY "Profiles readable by owner or admin"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

-- 4. Perbaiki Policy Services (Publik bisa baca layanan)
DROP POLICY IF EXISTS "Public read services" ON public.services;
DROP POLICY IF EXISTS "Admin manage services" ON public.services;
CREATE POLICY "Public read services" ON public.services FOR SELECT USING (is_active = TRUE OR public.is_admin());
CREATE POLICY "Admin manage services" ON public.services FOR ALL USING (public.is_admin());

-- 5. Perbaiki Policy Fare Zones (Publik bisa baca tarif)
DROP POLICY IF EXISTS "Public read fare_zones" ON public.fare_zones;
DROP POLICY IF EXISTS "Admin manage fare_zones" ON public.fare_zones;
CREATE POLICY "Public read fare_zones" ON public.fare_zones FOR SELECT USING (is_active = TRUE OR public.is_admin());
CREATE POLICY "Admin manage fare_zones" ON public.fare_zones FOR ALL USING (public.is_admin());

-- 6. Perbaiki Policy Popular Routes (Publik bisa baca rute)
DROP POLICY IF EXISTS "Public read popular_routes" ON public.popular_routes;
DROP POLICY IF EXISTS "Admin manage popular_routes" ON public.popular_routes;
CREATE POLICY "Public read popular_routes" ON public.popular_routes FOR SELECT USING (is_active = TRUE OR public.is_admin());
CREATE POLICY "Admin manage popular_routes" ON public.popular_routes FOR ALL USING (public.is_admin());

-- 7. Perbaiki Policy FAQs (Publik bisa baca FAQ)
DROP POLICY IF EXISTS "Public read faqs" ON public.faqs;
DROP POLICY IF EXISTS "Admin manage faqs" ON public.faqs;
CREATE POLICY "Public read faqs" ON public.faqs FOR SELECT USING (is_active = TRUE OR public.is_admin());
CREATE POLICY "Admin manage faqs" ON public.faqs FOR ALL USING (public.is_admin());

-- 8. Perbaiki Policy Drivers
DROP POLICY IF EXISTS "Approved drivers public readable minimal" ON public.drivers;
DROP POLICY IF EXISTS "Driver updatable by owner" ON public.drivers;
CREATE POLICY "Approved drivers public readable minimal"
  ON public.drivers FOR SELECT
  USING (status = 'approved' OR profile_id = auth.uid() OR public.is_admin());
CREATE POLICY "Driver updatable by owner"
  ON public.drivers FOR UPDATE
  USING (profile_id = auth.uid() OR public.is_admin());

-- 9. Perbaiki Policy Orders (Izinkan customer buat order & guest checkout)
DROP POLICY IF EXISTS "Customer can create orders" ON public.orders;
CREATE POLICY "Customer can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Customer can read own orders" ON public.orders;
CREATE POLICY "Customer can read own orders"
  ON public.orders FOR SELECT
  USING (
    customer_id = auth.uid()
    OR driver_id IN (SELECT id FROM public.drivers WHERE profile_id = auth.uid())
    OR (status = 'pending' AND EXISTS (SELECT 1 FROM public.drivers WHERE profile_id = auth.uid() AND status = 'approved'))
    OR public.is_admin()
  );

-- 10. Perbaiki Policy Order Events
DROP POLICY IF EXISTS "Insert order events" ON public.order_events;
CREATE POLICY "Insert order events"
  ON public.order_events FOR INSERT
  WITH CHECK (true);

-- 11. Perbaiki Policy Reviews
DROP POLICY IF EXISTS "Public read approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admin manage reviews" ON public.reviews;
CREATE POLICY "Public read approved reviews" ON public.reviews FOR SELECT USING (is_approved = TRUE OR customer_id = auth.uid() OR public.is_admin());
CREATE POLICY "Admin manage reviews" ON public.reviews FOR ALL USING (public.is_admin());

-- 12. Perbaiki Policy Audit Logs
DROP POLICY IF EXISTS "Admin view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admin view audit logs" ON public.admin_audit_logs FOR SELECT USING (public.is_admin());
