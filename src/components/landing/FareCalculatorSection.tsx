"use client";

import { useState, useMemo } from "react";
import { Calculator, MessageCircle, ExternalLink, MapPin, Info } from "lucide-react";
import { calculateFare, formatRupiah } from "@/lib/pricing/calculateFare";
import { buildWALink } from "@/lib/utils";
import { DEMO_FARE_ZONES, DEMO_POPULAR_ROUTES, DEMO_SERVICES } from "@/lib/data/demo";
import { siteConfig } from "@/config/site";
import type { PopularRoute } from "@/types";
import Link from "next/link";

const SERVICE_OPTIONS = DEMO_SERVICES.filter((s) => s.is_active).map((s) => ({
  id: s.id,
  slug: s.slug,
  label: s.name,
  extraFee: s.extra_fee,
}));

export default function FareCalculatorSection() {
  const [selectedService, setSelectedService] = useState(SERVICE_OPTIONS[0]);
  const [distanceKm, setDistanceKm] = useState(2);
  const [selectedRoute, setSelectedRoute] = useState<PopularRoute | null>(null);

  const fareResult = useMemo(() => {
    try {
      return calculateFare(distanceKm, selectedService.extraFee, DEMO_FARE_ZONES);
    } catch {
      return null;
    }
  }, [distanceKm, selectedService]);

  const waMessage = fareResult
    ? `Halo ${siteConfig.name}! Saya ingin memesan:
Layanan: ${selectedService.label}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SERVICE_OPTIONS.map((svc) => (
                  <button
                    key={svc.id}
                    onClick={() => setSelectedService(svc)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      selectedService.id === svc.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-slate-200 hover:border-blue-200 hover:bg-blue-50/50"
                    }`}
                  >
                    <div className="font-semibold text-sm text-slate-900">
                      {svc.label}
                    </div>
                    {svc.extraFee > 0 && (
                      <div className="text-xs text-slate-500 mt-1">
                        +{formatRupiah(svc.extraFee)} biaya layanan
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Distance slider */}
            <div className="card">
              <div className="flex items-center gap-2 mb-5">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold">2</span>
                <h3 className="font-bold text-slate-900">Atur Jarak Perjalanan</h3>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-500 text-sm">Estimasi Jarak</span>
                <span className="text-4xl font-extrabold text-blue-600 leading-none">
                  {distanceKm.toFixed(1)}{" "}
                  <span className="text-lg font-semibold text-slate-500">km</span>
                </span>
              </div>

              <input
                type="range"
                min={0}
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
                {DEMO_FARE_ZONES.filter((z) => z.is_active).map((zone) => {
                  const isActive = fareResult?.zone.id === zone.id;
                  return (
                    <span
                      key={zone.id}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all"
                      style={{
                        background: isActive ? zone.color + "22" : "transparent",
                        borderColor: isActive ? zone.color : "#e2e8f0",
                        color: isActive ? zone.color : "#94a3b8",
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
                {DEMO_POPULAR_ROUTES.filter((r) => r.is_active).map((route) => (
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
                    <span className="text-slate-400">·</span>
                    <span>{route.distance_km} km</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Summary sticky */}
          <div className="lg:col-span-2">
            <div className="card fare-summary-sticky">
              <div className="flex items-center gap-2 mb-5">
                <Calculator size={18} className="text-blue-600" />
                <h3 className="font-bold text-slate-900">Rincian Estimasi</h3>
              </div>

              {fareResult ? (
                <>
                  {/* Service + zone */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-500">Layanan</span>
                    <span className="text-sm font-semibold text-slate-700">
                      {selectedService.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-slate-500">Zona Tarif</span>
                    <span
                      className="text-sm font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: fareResult.zone.color + "22",
                        color: fareResult.zone.color,
                      }}
                    >
                      {fareResult.zone.name}
                    </span>
                  </div>

                  {/* Price breakdown */}
                  <div className="border-t border-slate-100 pt-4 mb-4 space-y-2.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Tarif dasar</span>
                      <span className="font-semibold">
                        {formatRupiah(fareResult.base_price)}
                      </span>
                    </div>
                    {fareResult.extra_fee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Biaya layanan</span>
                        <span className="font-semibold">
                          {formatRupiah(fareResult.extra_fee)}
                        </span>
                      </div>
                    )}
                    {fareResult.per_km_extra > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Biaya per km lebih</span>
                        <span className="font-semibold">
                          {formatRupiah(fareResult.per_km_extra)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Metode bayar</span>
                      <span className="font-semibold">QRIS Driver / Tunai</span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="bg-blue-50 rounded-2xl p-4 mb-5 text-center">
                    <div className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">
                      Estimasi Total
                    </div>
                    <div className="text-4xl font-extrabold text-blue-700 leading-none">
                      {formatRupiah(fareResult.total)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1.5">
                      Jarak ±{distanceKm.toFixed(1)} km
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="space-y-3">
                    <a
                      href={waHref === "#" ? undefined : waHref}
                      target={waHref !== "#" ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="btn btn-wa w-full justify-center"
                      style={{
                        pointerEvents: waHref === "#" ? "none" : "auto",
                        opacity: waHref === "#" ? 0.6 : 1,
                      }}
                    >
                      <MessageCircle size={16} />
                      Pesan Sekarang via WhatsApp
                    </a>
                    <Link
                      href={`/pesan?service=${selectedService.id}&distance=${distanceKm.toFixed(1)}${
                        selectedRoute
                          ? `&pickup=${encodeURIComponent(selectedRoute.origin_name)}&dropoff=${encodeURIComponent(
                              selectedRoute.destination_name
                            )}`
                          : ""
                      }`}
                      className="btn btn-outline w-full justify-center"
                    >
                      <ExternalLink size={16} />
                      Pesan via Aplikasi Web
                    </Link>
                  </div>

                  <p className="text-xs text-slate-400 text-center mt-3 leading-relaxed">
                    * Harga estimasi. Tarif final dikonfirmasi driver sesuai
                    kondisi aktual.
                  </p>
                </>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Calculator size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Atur jarak untuk melihat estimasi</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
