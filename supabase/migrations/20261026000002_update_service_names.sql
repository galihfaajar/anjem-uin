-- Migration: Update service names to match frontend display
-- Rename svc-1 to include '(Ride)' suffix for clearer labeling

UPDATE public.services
SET name = 'Antar Jemput Motor (Ride)'
WHERE id = 'svc-1' AND name = 'Antar Jemput Motor';
