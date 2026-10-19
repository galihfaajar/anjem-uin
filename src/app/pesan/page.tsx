"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppFAB from "@/components/layout/WhatsAppFAB";
import {
  Bike,
  UtensilsCrossed,
  ShoppingBasket,
  Package,
  MapPin,
  FileText,
  CreditCard,
  Banknote,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Calculator,
  Info,
  Loader2,
  User,
} from "lucide-react";
import { calculateFare, formatRupiah } from "@/lib/pricing/calculateFare";
import { createClient } from "@/lib/supabase/client";
import type { Service, FareZone, PopularRoute } from "@/types";

const iconMap = {
  Bike,
  UtensilsCrossed,
  ShoppingBasket,
  Package,
};

const DEFAULT_SERVICES: Service[] = [
  {
    id: "svc-1",
    name: "Antar Jemput Motor",
    slug: "antar-jemput-motor",
    description: "Layanan ojek motor cepat, ramah, dan aman khusus area kampus UIN dan sekitarnya.",
    icon: "Bike",
    extra_fee: 0,
    is_active: true,
    badge_text: "Paling Populer",
    sort_order: 1,
  },
  {
    id: "svc-2",
    name: "Jastip Makanan",
    slug: "jastip-kuliner",
    description: "Beli dan antar makanan dari warung, resto, atau kantin favoritmu.",
    icon: "UtensilsCrossed",
    extra_fee: 2000,
    is_active: true,
    badge_text: "Hemat Waktu",
    sort_order: 2,
  },
  {
    id: "svc-3",
    name: "Jastip Belanja & ATK",
    slug: "jastip-belanja",
    description: "Titip fotokopi, print tugas, perlengkapan kuliah, atau belanja minimarket.",
    icon: "ShoppingBasket",
    extra_fee: 2000,
    is_active: true,
    badge_text: null,
    sort_order: 3,
  },
  {
    id: "svc-4",
    name: "Kirim Paket Cepat",
    slug: "kirim-dokumen",
    description: "Kirim dokumen skripsi, barang ketinggalan, atau paket antar sesama mahasiswa.",
    icon: "Package",
    extra_fee: 1000,
    is_active: true,
    badge_text: null,
    sort_order: 4,
  },
];

const DEFAULT_FARE_ZONES: FareZone[] = [
  { id: "zone-1", name: "Zona Kampus UIN (0 - 3 km)", min_km: 0, max_km: 3, base_price: 5000, per_km_price: 0, color: "#22c55e", sort_order: 1, is_active: true },
  { id: "zone-2", name: "Zona Dekat (3.1 - 5 km)", min_km: 3.1, max_km: 5, base_price: 7000, per_km_price: 0, color: "#3b82f6", sort_order: 2, is_active: true },
  { id: "zone-3", name: "Zona Sedang (5.1 - 7 km)", min_km: 5.1, max_km: 7, base_price: 10000, per_km_price: 0, color: "#f59e0b", sort_order: 3, is_active: true },
  { id: "zone-4", name: "Zona Jauh (7.1 - 10 km)", min_km: 7.1, max_km: 10, base_price: 13000, per_km_price: 0, color: "#ef4444", sort_order: 4, is_active: true },
  { id: "zone-5", name: "Zona Luar (> 10 km)", min_km: 10.1, max_km: null, base_price: 13000, per_km_price: 2000, color: "#64748b", sort_order: 5, is_active: true },
];

export default function PesanPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Auth State
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);

  // Database State
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [fareZones, setFareZones] = useState<FareZone[]>(DEFAULT_FARE_ZONES);
  const [popularRoutes, setPopularRoutes] = useState<PopularRoute[]>([]);

  // Form State
  const [selectedServiceId, setSelectedServiceId] = useState<string>("svc-1");
  const [pickupName, setPickupName] = useState<string>("");
  const [dropoffName, setDropoffName] = useState<string>("");
  const [distanceKm, setDistanceKm] = useState<number>(3.0);
  const [itemNotes, setItemNotes] = useState<string>("");
  const [itemsEstimate, setItemsEstimate] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris_driver">("cash");

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Step 1: Auth check + load user data + load DB data
  useEffect(() => {
    const supabase = createClient();

    async function initPage() {
      try {
        // Check auth session first
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          // Redirect to register/login if not authenticated
          router.replace("/daftar?redirect=/pesan");
          return;
        }

        setUserId(user.id);

        // Parallel: fetch profile + services + fare_zones + popular_routes
        const [
          { data: profile },
          { data: sData },
          { data: zData },
          { data: rData },
        ] = await Promise.all([
          supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle(),
          supabase.from("services").select("*").eq("is_active", true).order("sort_order"),
          supabase.from("fare_zones").select("*").eq("is_active", true).order("sort_order"),
          supabase.from("popular_routes").select("*").eq("is_active", true).order("name"),
        ]);

        // Set user data from profile
        if (profile?.full_name) {
          setCustomerName(profile.full_name);
        } else if (user.user_metadata?.full_name) {
          setCustomerName(user.user_metadata.full_name as string);
        }
        if (profile?.phone) {
          setCustomerPhone(profile.phone);
        } else if (user.user_metadata?.phone) {
          setCustomerPhone(user.user_metadata.phone as string);
        }

        if (sData && sData.length > 0) setServices(sData);
        if (zData && zData.length > 0) setFareZones(zData);
        if (rData && rData.length > 0) setPopularRoutes(rData);
      } catch (err) {
        console.error("Error initializing order page:", err);
      } finally {
        setAuthLoading(false);
      }
    }

    initPage();
  }, [router]);

  // Handle URL params (e.g. from landing page calculator)
  useEffect(() => {
    if (authLoading) return;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const svcParam = params.get("service");
      const distParam = params.get("distance");
      const pickupParam = params.get("pickup");
      const dropoffParam = params.get("dropoff");

      let hasService = false;
      if (svcParam) {
        const found = services.find((s) => s.id === svcParam || s.slug === svcParam);
        if (found) {
          setSelectedServiceId(found.id);
          hasService = true;
        }
      }
      if (distParam) {
        const d = parseFloat(distParam);
        if (!isNaN(d) && d > 0) setDistanceKm(d);
      }
      if (pickupParam) setPickupName(pickupParam);
      if (dropoffParam) setDropoffName(dropoffParam);

      if (hasService) setCurrentStep(2);
    }
  }, [authLoading, services]);

  const selectedService = useMemo(
    () => services.find((s) => s.id === selectedServiceId) ?? services[0] ?? DEFAULT_SERVICES[0],
    [selectedServiceId, services]
  );

  const fareResult = useMemo(
    () => calculateFare(distanceKm, selectedService.extra_fee, fareZones),
    [distanceKm, selectedService, fareZones]
  );

  const handleSelectRoute = (route: PopularRoute) => {
    setPickupName(route.origin_name);
    setDropoffName(route.destination_name);
    setDistanceKm(route.distance_km);
  };

  // Steps: 1=Layanan, 2=Rute+Jarak+Pembayaran, 3=Konfirmasi
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
    }
    setCurrentStep((prev) => Math.min(3, prev + 1));
  };

  const handleBack = () => {
    setErrorMsg("");
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmitOrder = async () => {
    if (!userId) {
      router.replace("/daftar?redirect=/pesan");
      return;
    }

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

      router.push(data.redirectUrl || `/order/${data.order.id}`);
    } catch (err) {
      setErrorMsg((err as Error).message || "Terjadi kesalahan saat membuat order.");
      setLoading(false);
    }
  };

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 size={40} className="animate-spin text-blue-600 mx-auto" />
            <p className="text-slate-500 text-sm font-medium">Memeriksa sesi login...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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

          {/* User Info Banner */}
          {customerName && (
            <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-800">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                <User size={16} />
              </div>
              <div>
                <span className="font-bold">Memesan sebagai: {customerName}</span>
                {customerPhone && <span className="text-emerald-600 ml-2">({customerPhone})</span>}
              </div>
            </div>
          )}

          {/* Stepper Progress — 3 steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between max-w-sm mx-auto relative">
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 -z-0" />
              {[
                { step: 1, label: "Layanan" },
                { step: 2, label: "Rute & Jarak" },
                { step: 3, label: "Konfirmasi" },
              ].map((s) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => {
                    if (s.step < currentStep) setCurrentStep(s.step);
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
                    className={`text-[11px] font-semibold mt-1.5 transition-colors ${
                      currentStep >= s.step ? "text-blue-600 font-bold" : "text-slate-400"
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

          {/* Step 1: Pilih Layanan */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 mb-2">1. Pilih Jenis Layanan:</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {services.map((svc) => {
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

          {/* Step 2: Rute & Jarak + Metode Pembayaran */}
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
              {popularRoutes.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    ⚡ Pilihan Cepat Rute Populer Kampus:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {popularRoutes.slice(0, 6).map((route) => (
                      <button
                        key={route.id}
                        type="button"
                        onClick={() => handleSelectRoute(route)}
                        className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:border-blue-500 hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        {route.destination_name} ({route.distance_km} km)
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    📍 Titik Jemput (Asal)
                  </label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="cth: Gerbang Utama UIN RM Said"
                      value={pickupName}
                      onChange={(e) => setPickupName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    🎯 Titik Pengantaran (Tujuan)
                  </label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="cth: Kos Melati Jl. Pandawa / Stasiun Delanggu"
                      value={dropoffName}
                      onChange={(e) => setDropoffName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Jarak Slider */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs font-bold text-slate-700">
                    Estimasi Jarak Tempuh:
                  </label>
                  <span className="font-extrabold text-blue-600 text-sm">
                    {distanceKm.toFixed(1)} km
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="15"
                  step="0.5"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-2">
                  <span>0.5 km (Kampus)</span>
                  <span>5 km (Kartasura)</span>
                  <span>10 km (Solo Kota)</span>
                  <span>15 km (Luar Kota)</span>
                </div>
              </div>

              {/* Ongkos Realtime Preview */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                    <Calculator size={20} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
                      Estimasi Ongkos:
                    </span>
                    <span className="text-xs text-slate-600">
                      {fareResult.zone.name}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-slate-900">
                    {formatRupiah(fareResult.total)}
                  </div>
                  {fareResult.extra_fee > 0 && (
                    <span className="text-[10px] text-slate-500">
                      Termasuk biaya layanan +{formatRupiah(fareResult.extra_fee)}
                    </span>
                  )}
                </div>
              </div>

              {/* Khusus Jastip atau Paket: Catatan Barang */}
              {selectedServiceId !== "svc-1" && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-700 pt-2">📦 Detail Barang / Titipan:</h3>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Rincian Barang yang Dititip / Dikirim:
                    </label>
                    <div className="relative">
                      <FileText size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                      <textarea
                        rows={3}
                        placeholder="cth: Beli Nasi Goreng Mas Ali pedas level 2 (1 porsi), es teh manis (1 plastik)"
                        value={itemNotes}
                        onChange={(e) => setItemNotes(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Estimasi Biaya Talangan Barang (Rp):
                    </label>
                    <input
                      type="number"
                      placeholder="cth: 25000 (biaya makanan/belanja yang ditalangi driver)"
                      value={itemsEstimate}
                      onChange={(e) => setItemsEstimate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <span className="text-[11px] text-slate-400 block mt-1">
                      *Driver akan menunjukkan nota asli saat pengantaran. Biaya talangan diganti bersama ongkir.
                    </span>
                  </div>
                </div>
              )}

              {/* Metode Pembayaran — Di Step 2 */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-2 pt-2">
                  💳 Metode Pembayaran Ongkos:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setPaymentMethod("cash")}
                    className={`cursor-pointer rounded-xl p-3.5 border flex items-center gap-3 transition-all ${
                      paymentMethod === "cash"
                        ? "bg-blue-50 border-blue-600 ring-2 ring-blue-500/20"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <Banknote
                      size={20}
                      className={paymentMethod === "cash" ? "text-blue-600" : "text-slate-400"}
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900">Tunai (Cash)</div>
                      <div className="text-[11px] text-slate-500">Bayar ke driver saat sampai</div>
                    </div>
                  </div>

                  <div
                    onClick={() => setPaymentMethod("qris_driver")}
                    className={`cursor-pointer rounded-xl p-3.5 border flex items-center gap-3 transition-all ${
                      paymentMethod === "qris_driver"
                        ? "bg-blue-50 border-blue-600 ring-2 ring-blue-500/20"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <CreditCard
                      size={20}
                      className={paymentMethod === "qris_driver" ? "text-blue-600" : "text-slate-400"}
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900">QRIS Driver</div>
                      <div className="text-[11px] text-slate-500">Scan QRIS pribadi driver</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Konfirmasi Ringkasan */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 mb-2">3. Ringkasan Pesanan:</h2>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-xs text-slate-400 block">Layanan:</span>
                    <span className="font-extrabold text-slate-900 text-base">{selectedService.name}</span>
                  </div>
                  <span className="badge badge-blue">{paymentMethod === "cash" ? "Tunai" : "QRIS Driver"}</span>
                </div>

                {/* Pemesan Info (dari database) */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3 text-xs text-emerald-800">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                    <User size={14} />
                  </div>
                  <div>
                    <div className="font-bold">{customerName}</div>
                    <div className="text-emerald-600">{customerPhone}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Titik Penjemputan:</span>
                    <span className="font-bold text-slate-800">{pickupName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Titik Pengantaran:</span>
                    <span className="font-bold text-slate-800">{dropoffName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Jarak Estimasi:</span>
                    <span className="font-bold text-slate-800">{distanceKm.toFixed(1)} km</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Metode Bayar:</span>
                    <span className="font-bold text-slate-800">{paymentMethod === "cash" ? "Tunai (Cash)" : "QRIS Driver"}</span>
                  </div>
                </div>

                {itemNotes && (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs">
                    <span className="font-bold text-amber-900 block mb-1">Catatan Titip / Belanja:</span>
                    <p className="text-amber-800">{itemNotes}</p>
                    {itemsEstimate && (
                      <span className="block mt-1 font-semibold text-amber-900">
                        Estimasi Talangan: {formatRupiah(parseInt(itemsEstimate, 10))}
                      </span>
                    )}
                  </div>
                )}

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

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2.5 text-blue-900">
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

            {currentStep < 3 ? (
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
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Memproses Order...
                  </>
                ) : (
                  <>
                    Konfirmasi & Buat Pesanan
                    <CheckCircle2 size={16} />
                  </>
                )}
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
