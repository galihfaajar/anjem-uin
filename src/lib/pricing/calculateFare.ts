import type { FareZone, FareResult, FareBreakdownItem, JastipDetails } from "@/types";

export interface JastipPricingOptions {
  extraPlaces?: number;      // Pindah tempat jastip: +Rp2.000/tempat (1 tempat = Rp0)
  isSameArea?: boolean;       // Tempat beda tapi 1 area (foodcourt): tidak dihitung per tempat, melainkan per item > 3
  totalItems?: number;        // Lebih dari 3 item: +Rp1.000/item di atas 3
  isOutsideUin?: boolean;     // Jastip di luar area UIN (estimasi 2 km): ongkir dasar Rp5.000
  waitHoursOver1?: boolean;   // Menunggu lebih dari 1 jam: +Rp2.000
  closedAttempts?: number;    // Toko tutup setelah percobaan (≥2x): ongkir Rp2.000
}

export interface CalculateFareOptions {
  serviceExtraFee?: number;
  isRain?: boolean;
  isNight?: boolean;
  extraStops?: number;       // Anjem mampir ke tempat tambahan: +Rp1.000/tempat
  jastipOptions?: JastipPricingOptions;
}

export const DEFAULT_FARE_ZONES: FareZone[] = [
  {
    id: "zone-1",
    name: "Radius Sekitar UIN (±1,3 km)",
    min_km: 0.0,
    max_km: 1.3,
    base_price: 5000,
    per_km_price: 0,
    color: "#10b981",
    sort_order: 1,
    is_active: true,
  },
  {
    id: "zone-2",
    name: "Radius 1,4 km",
    min_km: 1.3,
    max_km: 1.4,
    base_price: 6000,
    per_km_price: 0,
    color: "#06b6d4",
    sort_order: 2,
    is_active: true,
  },
  {
    id: "zone-3",
    name: "Radius 2 km",
    min_km: 1.4,
    max_km: 2.0,
    base_price: 7000,
    per_km_price: 0,
    color: "#3b82f6",
    sort_order: 3,
    is_active: true,
  },
  {
    id: "zone-4",
    name: "Radius 3 km",
    min_km: 2.0,
    max_km: 3.0,
    base_price: 8000,
    per_km_price: 0,
    color: "#8b5cf6",
    sort_order: 4,
    is_active: true,
  },
  {
    id: "zone-5",
    name: "Lebih dari 3 km",
    min_km: 3.0,
    max_km: 5.0,
    base_price: 8000,
    per_km_price: 1000,
    color: "#f59e0b",
    sort_order: 5,
    is_active: true,
  },
  {
    id: "zone-6",
    name: "Di atas 5 km",
    min_km: 5.0,
    max_km: null,
    base_price: 10000,
    per_km_price: 2000,
    color: "#ef4444",
    sort_order: 6,
    is_active: true,
  },
];

/**
 * isNightTime — Cek apakah waktu saat ini (atau waktu diberikan) berada di atas pukul 22.30 WIB
 * Jam malam operasional: 22:30 WIB - 05:00 WIB
 */
export function isNightTime(date: Date = new Date()): boolean {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Jakarta",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
    const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);

    return hour > 22 || (hour === 22 && minute >= 30) || hour < 5;
  } catch {
    const localHour = date.getHours();
    const localMin = date.getMinutes();
    return localHour > 22 || (localHour === 22 && localMin >= 30) || localHour < 5;
  }
}

/**
 * calculateFare — Fungsi domain tunggal untuk menghitung tarif Anjem UIN.
 * Mendukung 6 zona resmi, opsi cuaca hujan (+Rp2.000), jam malam >22.30 WIB (+Rp1.000),
 * mampir tempat tambahan (+Rp1.000/tempat), dan ketentuan lengkap Jastip.
 */
export function calculateFare(
  distanceKm: number,
  serviceExtraFeeOrOptions: number | CalculateFareOptions = 0,
  zones: FareZone[] = DEFAULT_FARE_ZONES
): FareResult {
  if (distanceKm < 0) {
    throw new Error("Jarak tidak boleh negatif.");
  }

  const options: CalculateFareOptions =
    typeof serviceExtraFeeOrOptions === "number"
      ? { serviceExtraFee: serviceExtraFeeOrOptions }
      : serviceExtraFeeOrOptions || {};

  const serviceExtraFee = options.serviceExtraFee || 0;
  const isRain = Boolean(options.isRain);
  const isNight = Boolean(options.isNight);
  const extraStops = Math.max(0, options.extraStops || 0);
  const jastip = options.jastipOptions;

  const activeZones = [...(zones && zones.length > 0 ? zones : DEFAULT_FARE_ZONES)]
    .filter((z) => z.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  if (activeZones.length === 0) {
    throw new Error("Tidak ada zona tarif aktif.");
  }

  // Cari zona yang cocok berdasarkan max_km
  const matchedZone =
    activeZones.find((z) => {
      if (z.max_km === null) return true;
      return distanceKm <= z.max_km;
    }) ?? activeZones[activeZones.length - 1];

  let basePrice = matchedZone.base_price;
  let perKmExtra = 0;

  // Kasus khusus: Toko tutup sudah terjadi ≥2 kali -> flat ongkir Rp2.000
  if (jastip && typeof jastip.closedAttempts === "number" && jastip.closedAttempts >= 2) {
    basePrice = 2000;
    perKmExtra = 0;
  } else {
    // Kasus jastip di luar area UIN: jika estimasi 2 km dikenakan ongkir dasar Rp5.000
    if (jastip?.isOutsideUin && distanceKm <= 2.0) {
      basePrice = 5000;
    }

    // Hitung per-km extra jika zona memiliki per_km_price > 0
    if (matchedZone.per_km_price > 0) {
      const threshold = matchedZone.min_km;
      if (distanceKm > threshold) {
        const overDistance = distanceKm - threshold;
        perKmExtra = Math.ceil(overDistance) * matchedZone.per_km_price;
      }
    }
  }

  // 1. Biaya Hujan: +Rp2.000
  const rainFee = isRain ? 2000 : 0;

  // 2. Biaya Order Malam > 22.30 WIB: +Rp1.000
  const nightFee = isNight ? 1000 : 0;

  // 3. Biaya Anjem Mampir Tambahan: +Rp1.000 / tempat
  const extraStopsFee = extraStops * 1000;

  // 4. Biaya Jastip
  let jastipPlacesFee = 0;
  let jastipItemsFee = 0;
  let jastipWaitFee = 0;

  if (jastip) {
    // Pindah tempat: jika dalam 1 area (foodcourt), gratis pindah tempat
    if (!jastip.isSameArea && jastip.extraPlaces && jastip.extraPlaces > 0) {
      jastipPlacesFee = jastip.extraPlaces * 2000;
    }

    // Item lebih dari 3: +Rp1.000 / item
    if (jastip.totalItems && jastip.totalItems > 3) {
      jastipItemsFee = (jastip.totalItems - 3) * 1000;
    }

    // Menunggu lebih dari 1 jam: +Rp2.000
    if (jastip.waitHoursOver1) {
      jastipWaitFee = 2000;
    }
  }

  const jastipExtraFee = jastipPlacesFee + jastipItemsFee + jastipWaitFee;

  // Susun rincian (breakdown)
  const breakdown: FareBreakdownItem[] = [
    {
      label:
        jastip && typeof jastip.closedAttempts === "number" && jastip.closedAttempts >= 2
          ? "Ongkir Toko Tutup (≥2x Percobaan)"
          : `Tarif Dasar (${matchedZone.name})`,
      amount: basePrice,
    },
  ];

  if (perKmExtra > 0) {
    const kmOver = Math.ceil(distanceKm - matchedZone.min_km);
    breakdown.push({
      label: `Biaya Jarak (${kmOver} km di atas batas ${matchedZone.min_km} km)`,
      amount: perKmExtra,
    });
  }

  if (serviceExtraFee > 0) {
    breakdown.push({
      label: "Biaya Layanan Khusus",
      amount: serviceExtraFee,
    });
  }

  if (rainFee > 0) {
    breakdown.push({
      label: "Opsi Cuaca Hujan",
      amount: rainFee,
    });
  }

  if (nightFee > 0) {
    breakdown.push({
      label: "Biaya Pesanan Larut Malam (> 22.30 WIB)",
      amount: nightFee,
    });
  }

  if (extraStopsFee > 0) {
    breakdown.push({
      label: `Mampir Tempat Tambahan (${extraStops}x)`,
      amount: extraStopsFee,
    });
  }

  if (jastipPlacesFee > 0) {
    breakdown.push({
      label: `Tambah Tempat Belanja (${jastip?.extraPlaces} tempat)`,
      amount: jastipPlacesFee,
    });
  }

  if (jastip && jastip.isSameArea && jastip.extraPlaces && jastip.extraPlaces > 0) {
    breakdown.push({
      label: "Beda Tempat 1 Area (Foodcourt) - Bebas Biaya Tempat",
      amount: 0,
    });
  }

  if (jastipItemsFee > 0) {
    const extraCount = (jastip?.totalItems || 0) - 3;
    breakdown.push({
      label: `Titipan > 3 Item (${extraCount} item tambahan)`,
      amount: jastipItemsFee,
    });
  }

  if (jastipWaitFee > 0) {
    breakdown.push({
      label: "Biaya Tunggu Belanja (> 1 Jam)",
      amount: jastipWaitFee,
    });
  }

  const total =
    basePrice +
    serviceExtraFee +
    perKmExtra +
    rainFee +
    nightFee +
    extraStopsFee +
    jastipExtraFee;

  return {
    zone: matchedZone,
    base_price: basePrice,
    extra_fee: serviceExtraFee,
    per_km_extra: perKmExtra,
    rain_fee: rainFee,
    night_fee: nightFee,
    extra_stops_fee: extraStopsFee,
    jastip_extra_fee: jastipExtraFee,
    breakdown,
    total,
    distance_km: distanceKm,
  };
}

/**
 * formatRupiah — format angka ke format mata uang Rupiah Indonesia
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
 * getZoneForDistance — mencari objek zona tarif yang cocok dengan jarak
 */
export function getZoneForDistance(
  distanceKm: number,
  zones: FareZone[] = DEFAULT_FARE_ZONES
): FareZone | null {
  const activeZones = (zones && zones.length > 0 ? zones : DEFAULT_FARE_ZONES)
    .filter((z) => z.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    activeZones.find((z) => {
      if (z.max_km === null) return true;
      return distanceKm <= z.max_km;
    }) ?? null
  );
}
