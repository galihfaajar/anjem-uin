"use client";

import { useState, useMemo } from "react";
import { Calculator, MessageCircle, ExternalLink, MapPin, Info } from "lucide-react";
import { calculateFare, formatRupiah } from "@/lib/pricing/calculateFare";
import { buildWALink } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import type { PopularRoute, Service, FareZone } from "@/types";
import Link from "next/link";

const DEFAULT_SERVICES: Service[] = [
  { id: "svc-1", slug: "antar-jemput-motor", name: "Antar Jemput Motor", description: "Ojek motor kampus", icon: "Bike", extra_fee: 0, is_active: true, badge_text: "Paling Populer", sort_order: 1 },
  { id: "svc-2", slug: "jastip-kuliner", name: "Jastip Kuliner & Makanan", description: "Jastip makanan & minuman", icon: "UtensilsCrossed", extra_fee: 2000, is_active: true, badge_text: "Favorit Mahasiswa", sort_order: 2 },
  { id: "svc-3", slug: "jastip-belanja", name: "Jastip Belanja Harian", description: "Belanja harian & minimarket", icon: "ShoppingBasket", extra_fee: 2000, is_active: true, badge_text: "Praktis & Hemat", sort_order: 3 },
  { id: "svc-4", slug: "kirim-dokumen", name: "Kirim Dokumen & Paket Kilat", description: "Kirim berkas & barang", icon: "Package", extra_fee: 0, is_active: true, badge_text: "Instan Sampai", sort_order: 4 },
];

const DEFAULT_FARE_ZONES: FareZone[] = [
  { id: "zone-1", name: "Zona 1", min_km: 0, max_km: 3, base_price: 5000, per_km_price: 0, color: "#22c55e", sort_order: 1, is_active: true },
  { id: "zone-2", name: "Zona 2", min_km: 3, max_km: 6, base_price: 9500, per_km_price: 0, color: "#3b82f6", sort_order: 2, is_active: true },
  { id: "zone-3", name: "Zona 3", min_km: 6, max_km: 10, base_price: 14000, per_km_price: 0, color: "#f59e0b", sort_order: 3, is_active: true },
  { id: "zone-4", name: "Zona 4", min_km: 10, max_km: null, base_price: 14000, per_km_price: 2000, color: "#ef4444", sort_order: 4, is_active: true },
];

interface FareCalculatorSectionProps {
  services?: Service[];
  fareZones?: FareZone[];
  popularRoutes?: PopularRoute[];
}

export default function FareCalculatorSection({
  services: propServices,
  fareZones: propFareZones,
  popularRoutes: propRoutes = [],
}: FareCalculatorSectionProps) {
  const activeServices = (propServices && propServices.length > 0 ? propServices : DEFAULT_SERVICES).filter((s) => s.is_active);
  const activeFareZones = (propFareZones && propFareZones.length > 0 ? propFareZones : DEFAULT_FARE_ZONES).filter((z) => z.is_active);

  const serviceOptions = useMemo(() => {
    return activeServices.map((s) => ({
      id: s.id,
      slug: s.slug,
      label: s.name,
      extraFee: s.extra_fee,
    }));
  }, [activeServices]);

  const [selectedServiceId, setSelectedServiceId] = useState(serviceOptions[0]?.id || "svc-1");
  const [distanceKm, setDistanceKm] = useState(2);
  const [selectedRoute, setSelectedRoute] = useState<PopularRoute | null>(null);

  const currentService = useMemo(() => {
    return serviceOptions.find((s) => s.id === selectedServiceId) || serviceOptions[0];
  }, [serviceOptions, selectedServiceId]);

  const fareResult = useMemo(() => {
    try {
      return calculateFare(distanceKm, currentService?.extraFee || 0, activeFareZones);
    } catch {
      return null;
    }
  }, [distanceKm, currentService, activeFareZones]);

  const waMessage = fareResult
    ? `Halo ${siteConfig.name}! Saya ingin memesan:
Layanan: ${currentService?.label}
${selectedRoute ? `Rute: ${selectedRoute.origin_name} → ${selectedRoute.destination_name}` : `Jarak: ±${distanceKm} km`}
Estimasi tarif: ${formatRupiah(fareResult.total)}
Zona: ${fareResult.zone.name}

Mohon konfirmasi ketersediaan driver. Terima kasih!`
    : `Halo ${siteConfig.name}! Saya ingin memesan layanan antar-jemput.`;

  const waHref = buildWALink(siteConfig.whatsapp, waMessage);

  const handleRouteSelect = (route: PopularRoute) => {
    setSelectedRoute(route);
    setDistanceKm(route.distance_km);
  };

  return (
    <section
      id="kalkulator"
      className="py-20"
      style={{ background: "linear-gradient(180deg, #f8fafc 0%, #eff6ff 100%)" }}
    >
      <div className="container-main">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="section-eyebrow">TRANSPARANSI TARIF 100%</span>
          <h2 className="section-title mb-4">Hitung Ongkir Sebelum Pesan</h2>
          <p className="section-subtitle mx-auto">
            Pilih layanan, atur jarak, dan lihat estimasi tarif secara langsung.
            Tarif bersifat estimasi dan akan dikonfirmasi oleh driver.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 items-start">
          {/* Left — Calculator inputs */}
          <div className="lg:col-span-3 space-y-6">
            {/* Step 1: Service selection */}
            <div className="card">
              <div className="flex items-center gap-2 mb-5">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold">1</span>
                <h3 className="font-bold text-slate-900">Pilih Jenis Layanan</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {serviceOptions.map((opt) => {
                  const isSelected = currentService?.id === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedServiceId(opt.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs"
                          : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                      }`}
                    >
                      <div className="text-xs font-bold leading-tight mb-1">{opt.label}</div>
                      <div className="text-[11px] text-slate-400">
                        {opt.extraFee > 0 ? `+${formatRupiah(opt.extraFee)}` : "Tanpa biaya ekstra"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Distance slider */}
            <div className="card">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold">2</span>
                  <h3 className="font-bold text-slate-900">Tentukan Estimasi Jarak</h3>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-blue-600">{distanceKm}</span>
                  <span className="text-sm font-semibold text-slate-400 ml-1">km</span>
                </div>
              </div>

              <input
                type="range"
                min={0.5}
                max={20}
                step={0.5}
                value={distanceKm}
                onChange={(e) => {
                  setDistanceKm(parseFloat(e.target.value));
                  setSelectedRoute(null);
                }}
                className="w-full mb-5"
                aria-label="Slider jarak perjalanan"
                style={{
                  background: `linear-gradient(to right, #2563eb ${(distanceKm / 20) * 100}%, #e2e8f0 ${(distanceKm / 20) * 100}%)`,
                }}
              />

              {/* Zone chips */}
              <div className="flex flex-wrap gap-2">
                {activeFareZones.map((zone) => {
                  const isActive = fareResult?.zone.id === zone.id;
                  return (
                    <span
                      key={zone.id}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all"
                      style={{
                        background: isActive ? (zone.color || "#3b82f6") + "22" : "transparent",
                        borderColor: isActive ? (zone.color || "#3b82f6") : "#e2e8f0",
                        color: isActive ? (zone.color || "#3b82f6") : "#94a3b8",
                      }}
                    >
                      {zone.name}:{" "}
                      {zone.max_km === null
                        ? `>${zone.min_km} km`
                        : `${zone.min_km}–${zone.max_km} km`}{" "}
                      · {formatRupiah(zone.base_price)}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Popular routes */}
            {propRoutes.length > 0 && (
              <div className="card">
                <div className="flex items-center gap-2 mb-5">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold">3</span>
                  <h3 className="font-bold text-slate-900">Atau Pilih Rute Populer</h3>
                </div>
                <div className="flex items-start gap-2 mb-4">
                  <Info size={13} className="text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Jarak adalah estimasi dan belum diverifikasi lapangan. Konfirmasi
                    dengan driver saat pemesanan.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {propRoutes.filter((r) => r.is_active).map((route) => (
                    <button
                      key={route.id}
                      onClick={() => handleRouteSelect(route)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                        selectedRoute?.id === route.id
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      <MapPin size={11} />
                      {route.destination_name}
                      <span className="text-slate-400 font-normal">({route.distance_km} km)</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — Result Card */}
          <div className="lg:col-span-2">
            <div className="card sticky top-28 border-blue-200/60 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Calculator size={18} className="text-blue-600" />
                <h3 className="font-bold text-slate-900">Estimasi Ongkos</h3>
              </div>

              {fareResult ? (
                <>
                  <div className="py-4 border-y border-slate-100 my-4 space-y-2">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Layanan</span>
                      <span className="font-semibold text-slate-700">{currentService?.label}</span>
                    </div>
                    {selectedRoute && (
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Rute</span>
                        <span className="font-semibold text-slate-700 text-right max-w-[180px] truncate">
                          {selectedRoute.destination_name}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Jarak</span>
                      <span className="font-semibold text-slate-700">{distanceKm} km</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Zona</span>
                      <span className="font-semibold text-slate-700">{fareResult.zone.name}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Tarif Dasar</span>
                      <span className="font-semibold text-slate-700">{formatRupiah(fareResult.base_price)}</span>
                    </div>
                    {fareResult.extra_fee > 0 && (
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Biaya Layanan</span>
                        <span className="font-semibold text-amber-600">+{formatRupiah(fareResult.extra_fee)}</span>
                      </div>
                    )}
                    {fareResult.per_km_extra > 0 && (
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Tambahan per-km</span>
                        <span className="font-semibold text-slate-700">+{formatRupiah(fareResult.per_km_extra)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-baseline justify-between mb-6">
                    <span className="font-bold text-slate-700">Total Estimasi</span>
                    <span className="text-3xl font-black text-blue-600">
                      {formatRupiah(fareResult.total)}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <Link
                      href={`/pesan?service=${currentService?.id}&distance=${distanceKm}`}
                      className="btn btn-primary w-full text-center flex items-center justify-center gap-2"
                    >
                      Pesan Sekarang
                      <ExternalLink size={14} />
                    </Link>

                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary w-full text-center flex items-center justify-center gap-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                    >
                      <MessageCircle size={14} />
                      Pesan via WhatsApp
                    </a>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Masukkan jarak yang valid untuk menghitung tarif.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
