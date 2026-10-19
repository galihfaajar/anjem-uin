-- ====================================================================
-- MIGRATION: Fix RLS policy agar driver approved bisa mengambil order pending
-- 
-- MASALAH: Policy lama hanya mengizinkan driver update order yang sudah
-- berisi driver_id miliknya sendiri. Akibatnya, order pending (driver_id = NULL)
-- tidak bisa diambil karena blocked oleh RLS → API return "diambil driver lain"
-- padahal tidak ada driver lain.
--
-- SOLUSI: Tambahkan kondisi yang mengizinkan driver approved & online
-- untuk mengupdate order yang masih pending (driver_id IS NULL).
-- ====================================================================

-- Hapus policy UPDATE lama yang bermasalah
DROP POLICY IF EXISTS "orders_update" ON public.orders;

-- Buat policy UPDATE yang benar
CREATE POLICY "orders_update" ON public.orders FOR UPDATE
  USING (
    -- Driver bisa update order yang sudah miliknya (status update: on_the_way, completed, dll)
    driver_id IN (SELECT id FROM public.drivers WHERE profile_id = auth.uid())

    -- ATAU: driver approved & online bisa MENGAMBIL order yang masih pending
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

    -- Admin selalu bisa update
    OR public.is_admin()
  );

-- Verifikasi: tampilkan semua policy aktif di tabel orders
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'orders'
ORDER BY cmd, policyname;
