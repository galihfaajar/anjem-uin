-- ====================================================================
-- MIGRASI AWAL SUPABASE — ANJEM UIN
-- Versi: 20261019000001
-- ====================================================================

-- Aktifkan ekstensi UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABEL PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('customer', 'driver', 'admin')) DEFAULT 'customer',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABEL DRIVERS
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  plate_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  photo_url TEXT,
  qris_url TEXT,
  verification_doc_url TEXT, -- bucket privat
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'blocked')) DEFAULT 'pending',
  is_online BOOLEAN NOT NULL DEFAULT FALSE,
  rating_avg NUMERIC(3, 2) NOT NULL DEFAULT 5.0,
  total_trips INTEGER NOT NULL DEFAULT 0,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABEL SERVICES
CREATE TABLE IF NOT EXISTS public.services (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  badge_text TEXT,
  extra_fee INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABEL FARE_ZONES
CREATE TABLE IF NOT EXISTS public.fare_zones (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  min_km NUMERIC NOT NULL CHECK (min_km >= 0),
  max_km NUMERIC CHECK (max_km IS NULL OR max_km >= min_km),
  base_price INTEGER NOT NULL CHECK (base_price >= 0),
  per_km_price INTEGER NOT NULL DEFAULT 0 CHECK (per_km_price >= 0),
  color TEXT NOT NULL DEFAULT '#3b82f6',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABEL POPULAR_ROUTES
CREATE TABLE IF NOT EXISTS public.popular_routes (
  id TEXT PRIMARY KEY,
  origin_name TEXT NOT NULL,
  destination_name TEXT NOT NULL,
  distance_km NUMERIC NOT NULL CHECK (distance_km > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TABEL ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.profiles(id),
  driver_id UUID REFERENCES public.drivers(id),
  service_id TEXT NOT NULL REFERENCES public.services(id),
  pickup_name TEXT NOT NULL,
  pickup_lat NUMERIC NOT NULL,
  pickup_lng NUMERIC NOT NULL,
  dropoff_name TEXT NOT NULL,
  dropoff_lat NUMERIC NOT NULL,
  dropoff_lng NUMERIC NOT NULL,
  distance_km NUMERIC NOT NULL,
  fare INTEGER NOT NULL,
  fare_snapshot JSONB NOT NULL,
  item_notes TEXT,
  items_estimate INTEGER,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('qris_driver', 'cash')),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('unpaid', 'paid')) DEFAULT 'unpaid',
  status TEXT NOT NULL CHECK (status IN ('pending', 'assigned', 'on_the_way', 'completed', 'cancelled')) DEFAULT 'pending',
  cancel_reason TEXT,
  assigned_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABEL ORDER_EVENTS
CREATE TABLE IF NOT EXISTS public.order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status_from TEXT,
  status_to TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. TABEL REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id),
  driver_id UUID NOT NULL REFERENCES public.drivers(id),
  service_id TEXT NOT NULL REFERENCES public.services(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  is_sample BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. TABEL FAQS
CREATE TABLE IF NOT EXISTS public.faqs (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. TABEL SITE_SETTINGS
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. TABEL ADMIN_AUDIT_LOGS
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- FUNGSI & RPC ATOMIK
-- ====================================================================

-- Fungsi atomik untuk mengambil order oleh driver
CREATE OR REPLACE FUNCTION public.claim_order(
  p_order_id TEXT,
  p_driver_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_driver_status TEXT;
  v_driver_online BOOLEAN;
  v_order_status TEXT;
BEGIN
  -- Cek status driver
  SELECT status, is_online INTO v_driver_status, v_driver_online
  FROM public.drivers
  WHERE id = p_driver_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Driver tidak ditemukan.');
  END IF;

  IF v_driver_status != 'approved' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Status driver belum disetujui (approved).');
  END IF;

  IF NOT v_driver_online THEN
    RETURN jsonb_build_object('success', false, 'message', 'Driver harus dalam status Online untuk mengambil order.');
  END IF;

  -- Kunci row order untuk mencegah race condition dua driver bersamaan
  SELECT status INTO v_order_status
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Order tidak ditemukan.');
  END IF;

  IF v_order_status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Order sudah diambil oleh driver lain atau dibatalkan.');
  END IF;

  -- Update order
  UPDATE public.orders
  SET
    driver_id = p_driver_id,
    status = 'assigned',
    assigned_at = NOW(),
    updated_at = NOW()
  WHERE id = p_order_id;

  -- Catat event
  INSERT INTO public.order_events (order_id, status_from, status_to, actor_id, notes)
  VALUES (p_order_id, 'pending', 'assigned', (SELECT profile_id FROM public.drivers WHERE id = p_driver_id), 'Order diambil oleh driver');

  RETURN jsonb_build_object('success', true, 'message', 'Order berhasil diambil.');
END;
$$;

-- Fungsi agregat statistik publik yang aman
CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_orders_completed INTEGER;
  v_drivers_online INTEGER;
  v_rating_avg NUMERIC(3, 2);
  v_review_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_orders_completed
  FROM public.orders
  WHERE status = 'completed';

  SELECT COUNT(*) INTO v_drivers_online
  FROM public.drivers
  WHERE is_online = TRUE AND status = 'approved';

  SELECT COALESCE(AVG(rating), 5.0), COUNT(*)
  INTO v_rating_avg, v_review_count
  FROM public.reviews
  WHERE is_approved = TRUE;

  RETURN jsonb_build_object(
    'orders_completed', v_orders_completed,
    'drivers_online', v_drivers_online,
    'rating_avg', ROUND(COALESCE(v_rating_avg, 5.0), 1),
    'review_count', v_review_count
  );
END;
$$;

-- Trigger untuk sync auth.users ke public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Pengguna Baru'),
    NEW.raw_user_meta_data->>'phone',
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fare_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popular_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES RLS
CREATE POLICY "Profiles readable by owner or admin"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Profiles updatable by owner"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. DRIVERS RLS
CREATE POLICY "Approved drivers public readable minimal"
  ON public.drivers FOR SELECT
  USING (status = 'approved' OR profile_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Driver updatable by owner"
  ON public.drivers FOR UPDATE
  USING (profile_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Driver insertable by authenticated user"
  ON public.drivers FOR INSERT
  WITH CHECK (profile_id = auth.uid());

-- 3. SERVICES, FARE_ZONES, POPULAR_ROUTES, FAQS RLS (Public read, admin manage)
CREATE POLICY "Public read services" ON public.services FOR SELECT USING (is_active = TRUE OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin manage services" ON public.services FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Public read fare_zones" ON public.fare_zones FOR SELECT USING (is_active = TRUE OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin manage fare_zones" ON public.fare_zones FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Public read popular_routes" ON public.popular_routes FOR SELECT USING (is_active = TRUE OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin manage popular_routes" ON public.popular_routes FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Public read faqs" ON public.faqs FOR SELECT USING (is_active = TRUE OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin manage faqs" ON public.faqs FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 4. ORDERS RLS
CREATE POLICY "Customer can read own orders"
  ON public.orders FOR SELECT
  USING (
    customer_id = auth.uid()
    OR driver_id IN (SELECT id FROM public.drivers WHERE profile_id = auth.uid())
    OR (status = 'pending' AND EXISTS (SELECT 1 FROM public.drivers WHERE profile_id = auth.uid() AND status = 'approved'))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Customer can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Driver or Customer or Admin can update orders"
  ON public.orders FOR UPDATE
  USING (
    customer_id = auth.uid()
    OR driver_id IN (SELECT id FROM public.drivers WHERE profile_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 5. ORDER_EVENTS RLS
CREATE POLICY "Read order events for involved parties"
  ON public.order_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND (
        o.customer_id = auth.uid()
        OR o.driver_id IN (SELECT id FROM public.drivers WHERE profile_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      )
    )
  );

CREATE POLICY "Insert order events"
  ON public.order_events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 6. REVIEWS RLS
CREATE POLICY "Public read approved reviews"
  ON public.reviews FOR SELECT
  USING (is_approved = TRUE OR customer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Customer can create review for own completed order"
  ON public.reviews FOR INSERT
  WITH CHECK (
    customer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_id AND customer_id = auth.uid() AND status = 'completed'
    )
  );

CREATE POLICY "Admin manage reviews"
  ON public.reviews FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 7. AUDIT LOGS RLS
CREATE POLICY "Admin view audit logs"
  ON public.admin_audit_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
