-- ====================================================================
-- MIGRATION: Handle Profile Phone, RPC set_my_phone & Order Phone Enforcement
-- ====================================================================

-- 1. Pastikan kolom phone pada profiles boleh NULL
ALTER TABLE public.profiles ALTER COLUMN phone DROP NOT NULL;

-- 2. Normalisasi format data nomor yang sudah ada (jika ada data awalan 0 atau +)
UPDATE public.profiles
SET phone = CASE
  WHEN phone LIKE '+%' THEN substr(phone, 2)
  WHEN phone LIKE '0%' THEN '62' || substr(phone, 2)
  ELSE phone
END
WHERE phone IS NOT NULL;

-- 3. Tambahkan constraint format regex nomor WhatsApp: ^62[0-9]{9,13}$
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_phone_format_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_phone_format_check
  CHECK (phone IS NULL OR phone ~ '^62[0-9]{9,13}$');

-- 4. Bersihkan duplikat nomor sebelum membuat unique index
-- Jika ada beberapa akun yang memiliki nomor telepon sama, pertahankan nomor pada akun terbaru (SET NULL pada akun lama)
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

-- 5. Unique partial index untuk nomor WhatsApp (hanya untuk nomor yang tidak null)
DROP INDEX IF EXISTS public.profiles_phone_unique_idx;
CREATE UNIQUE INDEX profiles_phone_unique_idx
  ON public.profiles (phone)
  WHERE phone IS NOT NULL;


-- 5. Kunci policy UPDATE profiles: Jangan izinkan user update langsung (mencegah manipulasi role).
-- Pembaruan nomor telepon dilakukan terkontrol lewat RPC public.set_my_phone.
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 6. RPC set_my_phone (SECURITY DEFINER, hanya mengubah kolom phone milik auth.uid())
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
  -- Dapatkan user yang sedang login
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Anda harus login untuk menyimpan nomor WhatsApp.';
  END IF;

  IF new_phone IS NULL OR trim(new_phone) = '' THEN
    RAISE EXCEPTION 'Nomor WhatsApp belum diisi.';
  END IF;

  -- Normalisasi: hilangkan spasi, tanda strip, dan karakter non-digit selain '+'
  clean_phone := regexp_replace(trim(new_phone), '[^0-9+]', '', 'g');
  IF clean_phone LIKE '+%' THEN
    clean_phone := substr(clean_phone, 2);
  END IF;
  IF clean_phone LIKE '0%' THEN
    clean_phone := '62' || substr(clean_phone, 2);
  END IF;

  -- Validasi regex format Indonesia: 62 diikuti 9 sampai 13 digit
  IF clean_phone !~ '^62[0-9]{9,13}$' THEN
    RAISE EXCEPTION 'Format nomor WhatsApp tidak valid. Gunakan format yang valid diawali 62 atau 08 (contoh: 081234567890).';
  END IF;

  -- Cek apakah nomor sudah dipakai akun lain
  SELECT id INTO existing_id
  FROM public.profiles
  WHERE phone = clean_phone AND id <> caller_id
  LIMIT 1;

  IF existing_id IS NOT NULL THEN
    RAISE EXCEPTION 'Nomor WhatsApp ini sudah terdaftar pada akun lain.';
  END IF;

  -- Update HANYA kolom phone untuk akun caller_id (kolom role tetap aman dan tidak dapat diubah)
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

-- Hak akses eksekusi RPC hanya untuk authenticated user
REVOKE ALL ON FUNCTION public.set_my_phone(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_my_phone(TEXT) TO authenticated;

-- 7. Trigger BEFORE INSERT pada orders: Tolak pesanan bila profil pelanggan belum punya nomor WhatsApp
CREATE OR REPLACE FUNCTION public.check_customer_phone_before_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cust_phone TEXT;
BEGIN
  -- Untuk pesanan pengguna login
  IF NEW.customer_id IS NOT NULL THEN
    SELECT phone INTO cust_phone
    FROM public.profiles
    WHERE id = NEW.customer_id;

    IF cust_phone IS NULL OR trim(cust_phone) = '' THEN
      RAISE EXCEPTION 'Profil pelanggan belum memiliki nomor WhatsApp yang terdaftar. Harap lengkapi nomor WhatsApp terlebih dahulu.';
    END IF;

    -- Pastikan customer_phone pada orders tersinkron dengan nomor profil jika kosong
    IF NEW.customer_phone IS NULL OR trim(NEW.customer_phone) = '' THEN
      NEW.customer_phone := cust_phone;
    END IF;
  ELSE
    -- Untuk pesanan tamu (guest), customer_phone wajib ada
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

-- 8. Update handle_new_user(): Normalisasi phone & cegah trigger crash saat pendaftaran akun baru
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

  -- Normalisasi phone jika ada
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
    -- Fallback aman: pastikan akun tetap tersimpan di tabel profiles
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

