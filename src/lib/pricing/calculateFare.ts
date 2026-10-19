import type { FareZone, FareResult } from "@/types";

/**
 * calculateFare — Fungsi domain tunggal untuk menghitung tarif.
 * Digunakan oleh kalkulator landing page, form order, dan API server.
 *
 * CATATAN: Tarif di bawah adalah CONTOH AWAL dan belum dikonfirmasi
 * sebagai tarif resmi operasional. Admin wajib memverifikasi sebelum
 * layanan berjalan.
 */
export function calculateFare(
  distanceKm: number,
  serviceExtraFee: number,
  zones: FareZone[]
): FareResult {
  if (distanceKm < 0) {
    throw new Error("Jarak tidak boleh negatif.");
  }

  const activeZones = [...zones]
    .filter((z) => z.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  if (activeZones.length === 0) {
    throw new Error("Tidak ada zona tarif aktif.");
  }

  // Cari zona yang cocok
  const zone =
    activeZones.find((z) => {
      const minOk = distanceKm >= z.min_km;
      const maxOk = z.max_km === null || distanceKm <= z.max_km;
      return minOk && maxOk;
    }) ?? activeZones[activeZones.length - 1]; // fallback ke zona terakhir

  // Hitung biaya per-km:
  // Jika zona memiliki per_km_price > 0, biaya dihitung untuk jarak di atas batas bawah zona (misal di atas 10 km)
  let overDistance = 0;
  if (zone.per_km_price > 0) {
    const threshold = Math.floor(zone.min_km);
    if (distanceKm > threshold) {
      overDistance = distanceKm - threshold;
    }
  } else if (zone.max_km !== null && distanceKm > zone.max_km) {
    overDistance = distanceKm - zone.max_km;
  }

  const per_km_extra = Math.ceil(overDistance) * zone.per_km_price;
  const total = zone.base_price + serviceExtraFee + per_km_extra;

  return {
    zone,
    base_price: zone.base_price,
    extra_fee: serviceExtraFee,
    per_km_extra,
    total,
    distance_km: distanceKm,
  };
}

/**
 * formatRupiah — format angka ke string Rupiah Indonesia
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * getZoneForDistance — hanya cari zona tanpa hitung total
 */
export function getZoneForDistance(
  distanceKm: number,
  zones: FareZone[]
): FareZone | null {
  const activeZones = zones
    .filter((z) => z.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    activeZones.find((z) => {
      const minOk = distanceKm >= z.min_km;
      const maxOk = z.max_km === null || distanceKm <= z.max_km;
      return minOk && maxOk;
    }) ?? null
  );
}
