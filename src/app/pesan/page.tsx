"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppFAB from "@/components/layout/WhatsAppFAB";
import {
  Bike,
  UtensilsCrossed,
  ShoppingBasket,
  Package,
  MapPin,
  User,
  Phone,
  FileText,
  CreditCard,
  Banknote,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Calculator,
  Info,
} from "lucide-react";
import { DEMO_SERVICES, DEMO_FARE_ZONES, DEMO_POPULAR_ROUTES } from "@/lib/data/demo";
import { calculateFare, formatRupiah } from "@/lib/pricing/calculateFare";

const iconMap = {
  Bike,
  UtensilsCrossed,
  ShoppingBasket,
  Package,
};

export default function PesanPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [selectedServiceId, setSelectedServiceId] = useState<string>("svc-1");
  const [pickupName, setPickupName] = useState<string>("");
  const [dropoffName, setDropoffName] = useState<string>("");
  const [distanceKm, setDistanceKm] = useState<number>(3.0);
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [itemNotes, setItemNotes] = useState<string>("");
  const [itemsEstimate, setItemsEstimate] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris_driver">("cash");

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const svcParam = params.get("service");
      const distParam = params.get("distance");
      const pickupParam = params.get("pickup");
      const dropoffParam = params.get("dropoff");

      let hasService = false;
      if (svcParam) {
        const found = DEMO_SERVICES.find((s) => s.id === svcParam || s.slug === svcParam);
        if (found) {
          setSelectedServiceId(found.id);
          hasService = true;
        }
      }
      if (distParam) {
        const d = parseFloat(distParam);
        if (!isNaN(d) && d > 0) setDistanceKm(d);
      }
      if (pickupParam) {
        setPickupName(pickupParam);
      }
      if (dropoffParam) {
        setDropoffName(dropoffParam);
      }

      // Jika user sudah memilih layanan sebelumnya (dari kalkulator/landing page), langsung lompat ke Langkah 2
      if (hasService) {
        setCurrentStep(2);
      }
    }
  }, []);

  const selectedService = useMemo(
    () => DEMO_SERVICES.find((s) => s.id === selectedServiceId) ?? DEMO_SERVICES[0],
    [selectedServiceId]
  );

  const fareResult = useMemo(
    () => calculateFare(distanceKm, selectedService.extra_fee, DEMO_FARE_ZONES),
    [distanceKm, selectedService]
  );

  const handleSelectRoute = (route: typeof DEMO_POPULAR_ROUTES[0]) => {
    setPickupName(route.origin_name);
    setDropoffName(route.destination_name);
    setDistanceKm(route.distance_km);
  };

  const handleNext = () => {
    setErrorMsg("");
    if (currentStep === 1) {
      if (!selectedServiceId) {
        setErrorMsg("Silakan pilih jenis layanan.");
        return;
      }
    } else if (currentStep === 2) {
      if (!pickupName.trim() || !dropoffName.trim()) {
        setErrorMsg("Titik jemput dan tujuan harus diisi.");
        return;
      }
      if (distanceKm <= 0) {
        setErrorMsg("Jarak harus lebih besar dari 0 km.");
        return;
      }
    } else if (currentStep === 3) {
      if (!customerName.trim() || customerName.trim().length < 2) {
        setErrorMsg("Nama pemesan minimal 2 karakter.");
        return;
      }
      if (!customerPhone.trim() || customerPhone.trim().length < 8) {
        setErrorMsg("Nomor WhatsApp/HP minimal 8 digit.");
        return;
      }
    }
    setCurrentStep((prev) => Math.min(4, prev + 1));
  };

  const handleBack = () => {
    setErrorMsg("");
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmitOrder = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          serviceId: selectedServiceId,
          pickupName,
          pickupLat: -7.5576,
          pickupLng: 110.7706,
          dropoffName,
          dropoffLat: -7.5576,
          dropoffLng: 110.7706,
          distanceKm,
          itemNotes: itemNotes.trim() ? itemNotes : null,
          itemsEstimate: itemsEstimate ? parseInt(itemsEstimate, 10) : null,
          paymentMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat pesanan.");
      }

      // Simpan ke local storage agar tracking page bisa membaca langsung jika demo mode
      if (typeof window !== "undefined" && data.order) {
        localStorage.setItem(`order_${data.order.id}`, JSON.stringify(data.order));
      }

      router.push(data.redirectUrl || `/order/${data.order.id}`);
    } catch (err) {
      setErrorMsg((err as Error).message || "Terjadi kesalahan saat membuat order.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 pt-6 pb-16">
        <div className="container-main max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="badge badge-blue mb-2">Formulir Pemesanan</span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Pesan Layanan Anjem UIN
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Isi data perjalanan atau kebutuhan titip barangmu dengan mudah dan cepat.
            </p>
          </div>

          {/* Stepper Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between max-w-xl mx-auto relative">
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 -z-0" />
              {[
                { step: 1, label: "Layanan" },
                { step: 2, label: "Rute & Jarak" },
                { step: 3, label: "Kontak & Catatan" },
                { step: 4, label: "Konfirmasi" },
              ].map((s) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => {
                    if (s.step < currentStep) {
                      setCurrentStep(s.step);
                    }
                  }}
                  className={`flex flex-col items-center z-10 bg-slate-50 px-2 transition-all ${
                    s.step < currentStep ? "cursor-pointer hover:opacity-80" : "cursor-default"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      currentStep >= s.step
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                        : "bg-white text-slate-400 border border-slate-300"
                    }`}
                  >
                    {s.step}
                  </div>
                  <span
                    className={`text-[11px] font-semibold mt-1.5 ${
                      currentStep >= s.step ? "text-blue-600" : "text-slate-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-red-700">
              <AlertCircle size={18} className="flex-shrink-0" />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* Step 1: Layanan */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 mb-2">1. Pilih Jenis Layanan:</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {DEMO_SERVICES.map((svc) => {
                  const Icon = iconMap[svc.icon as keyof typeof iconMap] ?? Bike;
                  const isSelected = selectedServiceId === svc.id;

                  return (
                    <div
                      key={svc.id}
                      onClick={() => setSelectedServiceId(svc.id)}
                      className={`cursor-pointer rounded-2xl p-5 border transition-all ${
                        isSelected
                          ? "bg-blue-50/60 border-blue-600 shadow-sm ring-2 ring-blue-500/20"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                            isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          <Icon size={22} />
                        </div>
                        {svc.badge_text && (
                          <span className="badge badge-blue text-[10px]">{svc.badge_text}</span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm mb-1">{svc.name}</h3>
                      <p className="text-xs text-slate-500 mb-3">{svc.description}</p>
                      <div className="text-xs font-semibold text-slate-700 pt-3 border-t border-slate-100 flex justify-between">
                        <span>Biaya layanan:</span>
                        <span className="text-blue-600 font-bold">
                          {svc.extra_fee === 0 ? "Gratis" : `+${formatRupiah(svc.extra_fee)}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Rute & Jarak */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Info Layanan Terpilih */}
              {(() => {
                const SelectedIcon = iconMap[selectedService.icon as keyof typeof iconMap] ?? Bike;
                return (
                  <div className="bg-blue-50/80 border border-blue-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
                        <SelectedIcon size={20} />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                          Layanan Terpilih:
                        </div>
                        <div className="text-sm font-extrabold text-slate-900 flex items-center gap-2 flex-wrap">
                          <span>{selectedService.name}</span>
                          {selectedService.extra_fee > 0 ? (
                            <span className="text-xs font-semibold text-slate-500">
                              (+{formatRupiah(selectedService.extra_fee)} biaya layanan)
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-emerald-600">
                              (Bebas Biaya Layanan)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-3.5 py-1.5 rounded-xl bg-white border border-blue-300 text-blue-600 hover:bg-blue-100/60 text-xs font-bold transition-all self-start sm:self-auto cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      Ubah Layanan ↻
                    </button>
                  </div>
                );
              })()}

              <h2 className="text-lg font-bold text-slate-900">2. Titik Jemput & Tujuan:</h2>

              {/* Rute Populer Quick Select */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  ⚡ Pilihan Cepat Rute Populer Kampus:
                </label>
                <div className="flex flex-wrap gap-2">
                  {DEMO_POPULAR_ROUTES.slice(0, 4).map((route) => (
                    <button
                      key={route.id}
                      type="button"
                      onClick={() => handleSelectRoute(route)}
                      className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:border-blue-500 hover:text-blue-600 transition-colors"
                    >
                      {route.destination_name} ({route.distance_km} km)
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    📍 Titik Jemput (Asal)
                  </label>
                  <input
                    type="text"
                    required
                    value={pickupName}
                    onChange={(e) => setPickupName(e.target.value)}
                    placeholder="Contoh: Kos Melati, Jl. Pandawa Pabelan"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    🏁 Titik Tujuan (Pengantaran)
                  </label>
                  <input
                    type="text"
                    required
                    value={dropoffName}
                    onChange={(e) => setDropoffName(e.target.value)}
                    placeholder="Contoh: Gedung FITK Kampus UIN"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Distance Slider */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-slate-700">
                    Estimasi Jarak Perjalanan:
                  </label>
                  <span className="text-sm font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                    {distanceKm.toFixed(1)} km ({fareResult.zone.name})
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="20"
                  step="0.1"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-2">
                  <span>0.5 km (Dekat)</span>
                  <span>10 km</span>
                  <span>20 km (Maksimal)</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Kontak & Catatan */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 mb-2">3. Kontak Pemesan & Instruksi:</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama Pemesan
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nama lengkap atau panggilan"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nomor WhatsApp / HP Aktif
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="081234567890"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {["svc-2", "svc-3"].includes(selectedServiceId) && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Estimasi Uang Belanja/Makanan (Rp)
                  </label>
                  <input
                    type="number"
                    value={itemsEstimate}
                    onChange={(e) => setItemsEstimate(e.target.value)}
                    placeholder="Contoh: 25000 (uang tunai disiapkan saat driver tiba)"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <span className="text-[11px] text-slate-400 block mt-1">
                    *Uang makanan/belanja dibayar langsung kepada driver sesuai struk asli.
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Catatan untuk Driver
                </label>
                <textarea
                  rows={3}
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  placeholder="Contoh: Helm bersih ya kak, atau pesanan geprek level 3 nasi pisah."
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Payment Method */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Metode Pembayaran Ongkos:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setPaymentMethod("cash")}
                    className={`cursor-pointer p-4 rounded-xl border flex items-center gap-3 transition-all ${
                      paymentMethod === "cash"
                        ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <Banknote size={20} className="text-slate-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">Tunai (Cash)</div>
                      <span className="text-[10px] text-slate-500">Bayar ke driver</span>
                    </div>
                  </div>

                  <div
                    onClick={() => setPaymentMethod("qris_driver")}
                    className={`cursor-pointer p-4 rounded-xl border flex items-center gap-3 transition-all ${
                      paymentMethod === "qris_driver"
                        ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <CreditCard size={20} className="text-slate-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">QRIS Driver</div>
                      <span className="text-[10px] text-slate-500">Scan QR saat sampai</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Konfirmasi & Submit */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900">4. Periksa Ringkasan Pesanan:</h2>

              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <span className="text-xs text-slate-500">Layanan:</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedService.name}</span>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <span className="text-xs text-slate-500">Titik Jemput:</span>
                  <span className="font-semibold text-slate-900 text-xs sm:text-sm text-right max-w-xs">
                    {pickupName}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <span className="text-xs text-slate-500">Titik Tujuan:</span>
                  <span className="font-semibold text-slate-900 text-xs sm:text-sm text-right max-w-xs">
                    {dropoffName}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <span className="text-xs text-slate-500">Jarak & Zona:</span>
                  <span className="font-semibold text-slate-900 text-xs">
                    {distanceKm} km ({fareResult.zone.name})
                  </span>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <span className="text-xs text-slate-500">Pemesan:</span>
                  <span className="font-semibold text-slate-900 text-xs">
                    {customerName} ({customerPhone})
                  </span>
                </div>

                {itemNotes && (
                  <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                    <span className="text-xs text-slate-500">Catatan:</span>
                    <span className="text-xs text-slate-700 text-right max-w-xs italic">
                      &ldquo;{itemNotes}&rdquo;
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <span className="text-xs text-slate-500">Metode Bayar:</span>
                  <span className="font-bold text-slate-900 text-xs">
                    {paymentMethod === "cash" ? "Tunai (Cash)" : "QRIS Driver"}
                  </span>
                </div>

                {/* Fare Summary Breakdown */}
                <div className="bg-slate-50 rounded-xl p-4 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Tarif Dasar ({fareResult.zone.name}):</span>
                    <span>{formatRupiah(fareResult.base_price)}</span>
                  </div>
                  {fareResult.extra_fee > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Biaya Layanan Jastip:</span>
                      <span>+{formatRupiah(fareResult.extra_fee)}</span>
                    </div>
                  )}
                  {fareResult.per_km_extra > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Tambahan Jarak di atas 10 km:</span>
                      <span>+{formatRupiah(fareResult.per_km_extra)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-slate-900 text-sm">
                    <span>Total Estimasi Ongkir:</span>
                    <span className="text-blue-600 text-base">{formatRupiah(fareResult.total)}</span>
                  </div>
                </div>

                <div className="demo-banner">
                  <Info size={16} className="text-blue-600 flex-shrink-0" />
                  <span className="text-[11px]">
                    Estimasi tarif dihitung transparan. Pembayaran ongkos diselesaikan langsung
                    ke driver saat pesanan tiba.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="btn btn-secondary text-xs sm:text-sm flex items-center gap-1.5"
              >
                <ArrowLeft size={16} />
                Kembali
              </button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn btn-primary text-xs sm:text-sm flex items-center gap-1.5"
              >
                Lanjutkan
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={loading}
                className="btn btn-primary text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-blue-500/20"
              >
                {loading ? "Memproses Order..." : "Konfirmasi & Buat Pesanan"}
                <CheckCircle2 size={16} />
              </button>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <WhatsAppFAB />
    </div>
  );
}
