// ============================================================
// KONFIGURASI PUSAT — Anjem UIN
// Ubah nilai di sini untuk menyesuaikan brand, kontak, tarif, dll.
// Jangan sebarkan nilai sensitif di komponen UI.
// ============================================================

export interface SiteConfig {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  campus: string;
  url: string;
  whatsapp: string;
  email: string;
  instagram: string;
  twitter: string;
  operatingHours: {
    label: string;
    value: string;
    note: string;
  };
  serviceArea: {
    primary: string;
    description: string;
    regions: readonly string[];
  };
  isDemoMode: boolean;
  mapCenter: {
    lat: number;
    lng: number;
    zoom: number;
  };
  maxDistanceKm: number;
  statsOverride: {
    enabled: boolean;
    ordersCompleted: number;
    driversOnline: number;
    ratingAvg: number;
    reviewCount: number;
  };
}

export const siteConfig: SiteConfig = {
  // --- Brand ---
  name: "Anjem UIN",
  shortName: "AnjemUIN",
  tagline: "Antar Jemput Mudah, Kampus Jadi Lebih Dekat",
  description:
    "Layanan antar-jemput, jasa titip, dan pengiriman ringan untuk mahasiswa UIN Raden Mas Said Surakarta, Kartasura, Sukoharjo, dan Solo Raya.",
  campus: "UIN Raden Mas Said Surakarta",
  url: "https://anjemuin.vercel.app", // TODO: ganti dengan domain resmi

  // --- Kontak (isi setelah konfirmasi) ---
  whatsapp: "628XXXXXXXXXX", // TODO: ganti nomor WhatsApp admin resmi
  email: "bantuan@anjemuin.id", // TODO: opsional
  instagram: "#", // TODO: isi link Instagram
  twitter: "#", // TODO: isi link Twitter/X

  // --- Jam Operasional ---
  operatingHours: {
    label: "Siap Melayani",
    value: "06.00 – 22.00 WIB", // TODO: konfirmasi jam resmi
    note: "Jam layanan dapat berubah; hubungi admin untuk konfirmasi.",
  },

  // --- Area Layanan ---
  serviceArea: {
    primary: "UIN Raden Mas Said Surakarta, Kartasura",
    description:
      "Melayani kawasan kampus UIN Raden Mas Said, Kartasura, Sukoharjo, dan lokasi Solo Raya yang disetujui admin.",
    regions: [
      "Kampus UIN Raden Mas Said Surakarta",
      "Kartasura",
      "Sukoharjo",
      "Solo Kota",
      "Manahan",
      "Purwosari",
    ],
  },

  // --- Mode Demo ---
  isDemoMode: true, // set false ketika sudah operasional dengan data nyata

  // --- Default koordinat tengah peta ---
  mapCenter: {
    lat: -7.5576, // Kartasura / UIN Raden Mas Said
    lng: 110.7706,
    zoom: 13,
  },

  // --- Batas jarak layanan (km) ---
  maxDistanceKm: 20,

  // --- Statistik (override jika belum ada data live) ---
  statsOverride: {
    enabled: true, // true = pakai nilai di bawah; false = ambil dari DB
    ordersCompleted: 0,
    driversOnline: 0,
    ratingAvg: 0,
    reviewCount: 0,
  },
};
