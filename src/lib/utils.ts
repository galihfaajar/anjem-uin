import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Bangun link WhatsApp click-to-chat yang aman
 */
export function buildWALink(phone: string, message: string): string {
  if (!phone || phone === "628XXXXXXXXXX") {
    return "#"; // nomor belum diatur
  }
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encoded}`;
}

/**
 * Samarkan nama pelanggan untuk privasi: "Rizwan" → "R***n"
 */
export function maskName(name: string): string {
  if (!name || name.length <= 2) return name;
  return name[0] + "***" + name[name.length - 1];
}

/**
 * Hitung jarak Haversine antara dua koordinat (km)
 * Digunakan sebagai fallback jika routing API tidak tersedia.
 * PENTING: Ini adalah jarak garis lurus, BUKAN jarak jalan.
 */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Format tanggal ke Bahasa Indonesia
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Truncate teks dengan elipsis
 */
export function truncate(str: string, max: number): string {
  return str.length <= max ? str : str.slice(0, max - 3) + "...";
}
