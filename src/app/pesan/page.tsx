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
  Phone,
  Moon,
  Plus,
  Minus,
} from "lucide-react";
import {
  calculateFare,
  formatRupiah,
  isNightTime,
  DEFAULT_FARE_ZONES,
} from "@/lib/pricing/calculateFare";
import { createClient } from "@/lib/supabase/client";
import PhoneModal from "@/components/order/PhoneModal";
import { validatePhoneNumber } from "@/lib/phone";
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
    name: "Antar Jemput Motor (Ride)",
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

// Label & placeholder untuk titik 1 dan titik 2 per layanan
const SERVICE_POINT_LABELS: Record<
  string,
  {
    pickup: { label: string; placeholder: string };
    dropoff: { label: string; placeholder: string };
  }
> = {
  "svc-1": {
    pickup: {
      label: "📍 Titik Jemput (Asal)",
      placeholder: "cth: Gerbang Utama UIN RM Said",
    },
    dropoff: {
      label: "🎯 Tujuan Pengantaran",
      placeholder: "cth: Kos Melati Jl. Pandawa / Stasiun Delanggu",
    },
  },
  "svc-2": {
    pickup: {
      label: "🍽️ Tempat Beli (Warung, Kantin, Kafe)",
      placeholder: "cth: Warung Pak Suto, Kantin Gedung A, Kafe Kampus",
    },
    dropoff: {
      label: "📦 Alamat Antar (Tujuan Pengiriman)",
      placeholder: "cth: Kos Putri Barokah Jl. Pandawa No. 12",
    },
  },
  "svc-3": {
    pickup: {
      label: "🛒 Tempat Belanja (Toko, Minimarket, Fotokopi)",
      placeholder: "cth: Indomaret Kartasura, Fotokopi Maju Jaya, Toko ATK",
    },
    dropoff: {
      label: "📦 Alamat Antar (Tujuan Pengiriman)",
      placeholder: "cth: Kos Putra Makmur Gang 3 No. 8",
    },
  },
  "svc-4": {
    pickup: {
      label: "📮 Alamat Pengirim / Lokasi Paket",
      placeholder: "cth: Kos Melati Jl. Pandawa No. 5 (lokasi paket diambil)",
    },
    dropoff: {
      label: "🏠 Alamat Penerima",
      placeholder: "cth: Gedung A UIN RM Said lt. 2 / Kos Putri Mawar",
    },
  },
};



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
  const [distanceKm, setDistanceKm] = useState<number>(1.3);
  const [itemNotes, setItemNotes] = useState<string>("");
  const [itemsEstimate, setItemsEstimate] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris_driver">("cash");

  // Opsi Tambahan Anjem & Jastip Sesuai Pricelist Resmi
  const [extraStops, setExtraStops] = useState<number>(0);
  const [jastipExtraPlaces, setJastipExtraPlaces] = useState<number>(0);
  const [jastipSameArea, setJastipSameArea] = useState<boolean>(false);
  const [jastipItemsCount, setJastipItemsCount] = useState<number>(1);
  const [jastipOutsideUin, setJastipOutsideUin] = useState<boolean>(false);
  const [isNight, setIsNight] = useState<boolean>(false);

  useEffect(() => {
    setIsNight(isNightTime());
  }, []);

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Phone Modal & Inline Phone States
  const [showPhoneModal, setShowPhoneModal] = useState<boolean>(false);
  const [inlinePhone, setInlinePhone] = useState<string>("");
  const [inlinePhoneLoading, setInlinePhoneLoading] = useState<boolean>(false);
  const [inlinePhoneError, setInlinePhoneError] = useState<string>("");

  const handleSaveInlinePhone = async () => {
    setInlinePhoneError("");
    const validation = validatePhoneNumber(inlinePhone);
    if (!validation.valid) {
      setInlinePhoneError(validation.error || "Format nomor WhatsApp tidak valid.");
      return;
    }

    setInlinePhoneLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("set_my_phone", {
        new_phone: validation.normalized,
      });

      if (error) {
        let msg = error.message;
        if (error.message.includes("sudah terdaftar pada akun lain") || error.code === "23505") {
          msg = "Nomor WhatsApp ini sudah terdaftar pada akun lain.";
        }
        setInlinePhoneError(msg);
        setInlinePhoneLoading(false);
        return;
      }

      const saved = (data && (data as any).phone) || validation.normalized;
      setCustomerPhone(saved);
      setInlinePhone("");
      setInlinePhoneLoading(false);
      setErrorMsg("");
    } catch (err) {
      setInlinePhoneError((err as Error).message || "Gagal menyimpan nomor");
      setInlinePhoneLoading(false);
    }
  };

  // Step 1: Auth check + load user data + load DB data
  useEffect(() => {
    const supabase = createClient();

    async function initPage() {
      try {
        // Use getSession() first - reads from local cache (instant, no network)
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;

        if (!user) {
          // No cached session - redirect immediately
          router.replace("/daftar?redirect=/pesan");
          return;
        }

        setUserId(user.id);

        let initialPhone = "";

        // Pre-fill from user_metadata immediately (zero network cost)
        if (user.user_metadata?.full_name) {
          setCustomerName(user.user_metadata.full_name as string);
        }
        if (user.user_metadata?.phone) {
          initialPhone = user.user_metadata.phone as string;
          setCustomerPhone(initialPhone);
        }

        // Mark auth as done immediately so UI renders without waiting for DB
        setAuthLoading(false);

        // Parallel: fetch profile + services + fare_zones + popular_routes in background
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

        // Update with DB profile data if available
        if (profile?.full_name) setCustomerName(profile.full_name);
        if (profile?.phone) {
          setCustomerPhone(profile.phone);
          initialPhone = profile.phone;
        }

        if (sData && sData.length > 0) setServices(sData);
        if (zData && zData.length > 0) setFareZones(zData);
        if (rData && rData.length > 0) setPopularRoutes(rData);

        // Jika akun belum memiliki nomor WhatsApp, langsung tampilkan modal lengkapi nomor
        if (!initialPhone) {
          setShowPhoneModal(true);
        }
      } catch (err) {
        console.error("Error initializing order page:", err);
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
    () =>
      calculateFare(
        distanceKm,
        {
          serviceExtraFee: selectedService.extra_fee,
          isNight,
          extraStops: selectedService.slug === "antar-jemput-motor" ? extraStops : 0,
          jastipOptions: {
            extraPlaces: selectedService.slug.startsWith("jastip") ? jastipExtraPlaces : 0,
            isSameArea: selectedService.slug.startsWith("jastip") ? jastipSameArea : false,
            totalItems: selectedService.slug.startsWith("jastip") ? jastipItemsCount : 1,
            isOutsideUin: selectedService.slug.startsWith("jastip") ? jastipOutsideUin : false,
          },
        },
        fareZones
      ),
    [
      distanceKm,
      selectedService,
      fareZones,
      isNight,
      extraStops,
      jastipExtraPlaces,
      jastipSameArea,
      jastipItemsCount,
      jastipOutsideUin,
    ]
  );

  const handleSelectRoute = (route: PopularRoute) => {
    setPickupName(route.origin_name);
    setDropoffName(route.destination_name);
    setDistanceKm(route.distance_km);
  };

  // Otomatis scroll ke atas setiap kali berpindah step
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentStep]);

  // Helper untuk menampilkan pesan error dan langsung scroll otomatis ke field yang belum terisi
  const setAndScrollError = (msg: string, targetId?: string) => {
    setErrorMsg(msg);
    if (typeof window !== "undefined") {
      setTimeout(() => {
        if (targetId) {
          const el = document.getElementById(targetId);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
              el.focus({ preventScroll: true });
            }
            return;
          }
        }
        const alertEl = document.getElementById("alert-error");
        if (alertEl) {
          alertEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 60);
    }
  };

  // Steps: 1=Layanan, 2=Rute+Jarak+Pembayaran, 3=Konfirmasi
  const handleNext = () => {
    setErrorMsg("");
    if (currentStep === 1) {
      if (!selectedServiceId) {
        setAndScrollError("Silakan pilih jenis layanan terlebih dahulu.", "section-services");
        return;
      }
      if (!customerPhone) {
        setShowPhoneModal(true);
        setAndScrollError("Harap lengkapi nomor WhatsApp terlebih dahulu.", "section-user-info");
        return;
      }
    } else if (currentStep === 2) {
      if (!customerPhone) {
        setShowPhoneModal(true);
        setAndScrollError("Nomor WhatsApp pemesan wajib diisi.", "input-inline-phone");
        return;
      }
      if (!pickupName.trim() || pickupName.trim().length < 3) {
        setAndScrollError("Titik penjemputan harus diisi minimal 3 karakter.", "input-pickup");
        return;
      }
      if (!dropoffName.trim() || dropoffName.trim().length < 3) {
        setAndScrollError("Titik pengantaran harus diisi minimal 3 karakter.", "input-dropoff");
        return;
      }
      if (distanceKm <= 0) {
        setAndScrollError("Jarak harus lebih besar dari 0 km.", "section-distance");
        return;
      }
      // Validasi catatan titip jika memilih layanan jastip / paket
      if (selectedServiceId !== "svc-1" && !itemNotes.trim()) {
        setAndScrollError("Mohon tuliskan rincian barang/titipan yang diinginkan.", "input-item-notes");
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

    if (!customerPhone) {
      setShowPhoneModal(true);
      setAndScrollError("Nomor WhatsApp belum diisi. Harap lengkapi nomor WhatsApp.", "input-inline-phone");
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
          extraStops: selectedService.slug === "antar-jemput-motor" ? extraStops : 0,
          jastipExtraPlaces: selectedService.slug.startsWith("jastip") ? jastipExtraPlaces : 0,
          jastipSameArea: selectedService.slug.startsWith("jastip") ? jastipSameArea : false,
          jastipItemsCount: selectedService.slug.startsWith("jastip") ? jastipItemsCount : 1,
          jastipOutsideUin: selectedService.slug.startsWith("jastip") ? jastipOutsideUin : false,
          itemNotes: itemNotes.trim() ? itemNotes : null,
          itemsEstimate: itemsEstimate ? parseInt(itemsEstimate, 10) : null,
          paymentMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorDetail =
          data.error ||
          (data.details?.fieldErrors
            ? Object.values(data.details.fieldErrors).flat().join(", ")
            : "Gagal membuat pesanan.");
        throw new Error(errorDetail);
      }

      router.push(data.redirectUrl || `/order/${data.order.id}`);
    } catch (err) {
      const errMessage = (err as Error).message || "Terjadi kesalahan saat membuat order.";
      setAndScrollError(errMessage);
      setLoading(false);
    }
  };

  // Auth check done instantly via session cache - no blocking screen needed

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
            <div id="section-user-info" className="mb-6 p-3.5 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-xs">
                  <User size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-xs sm:text-sm">{customerName}</span>
                    <span className="badge badge-blue text-[10px]">Pemesan</span>
                  </div>
                  {customerPhone ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium mt-0.5">
                      <CheckCircle2 size={13} />
                      <span>WA: +{customerPhone}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-amber-600 font-bold mt-0.5">
                      <AlertCircle size={13} />
                      <span>Nomor WhatsApp belum terdaftar</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                {customerPhone ? (
                  <button
                    type="button"
                    onClick={() => setShowPhoneModal(true)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/70 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors cursor-pointer"
                  >
                    Ubah Nomor
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowPhoneModal(true)}
                    className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Phone size={13} />
                    Lengkapi WhatsApp
                  </button>
                )}
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
            <div id="alert-error" className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-red-700">
              <AlertCircle size={18} className="flex-shrink-0" />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* Step 1: Pilih Layanan */}
          {currentStep === 1 && (
            <div id="section-services" className="space-y-4">
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

              {/* Heading & point inputs — dynamic per service */}
              {(() => {
                const ptLabels =
                  SERVICE_POINT_LABELS[selectedServiceId as keyof typeof SERVICE_POINT_LABELS] ??
                  SERVICE_POINT_LABELS["svc-1"];
                const headingMap: Record<string, string> = {
                  "svc-1": "2. Titik Jemput & Tujuan:",
                  "svc-2": "2. Tempat Beli & Alamat Antar:",
                  "svc-3": "2. Tempat Belanja & Alamat Antar:",
                  "svc-4": "2. Alamat Pengirim & Penerima:",
                };
                return (
                  <>
                    <h2 className="text-lg font-bold text-slate-900">
                      {headingMap[selectedServiceId] ?? "2. Titik Jemput & Tujuan:"}
                    </h2>

                    {/* Rute Populer Quick Select — hanya untuk layanan Ride */}
                    {selectedServiceId === "svc-1" && popularRoutes.length > 0 && (
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
                          {ptLabels.pickup.label}
                        </label>
                        <div className="relative">
                          <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            id="input-pickup"
                            type="text"
                            required
                            placeholder={ptLabels.pickup.placeholder}
                            value={pickupName}
                            onChange={(e) => setPickupName(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          {ptLabels.dropoff.label}
                        </label>
                        <div className="relative">
                          <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            id="input-dropoff"
                            type="text"
                            required
                            placeholder={ptLabels.dropoff.placeholder}
                            value={dropoffName}
                            onChange={(e) => setDropoffName(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Notifikasi Jam Malam Otomatis */}
              {isNight && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-center gap-3 text-indigo-900">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Moon size={20} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">
                      Tarif Malam Aktif (+Rp1.000)
                    </span>
                    <p className="text-xs text-indigo-800">
                      Pemesanan saat ini berada di atas pukul 22.30 WIB. Sistem secara realtime menambahkan biaya Rp 1.000 sesuai regulasi operasional malam.
                    </p>
                  </div>
                </div>
              )}

              {/* Jarak Slider */}
              <div id="section-distance" className="bg-white rounded-2xl p-5 border border-slate-200">
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
                  step="0.1"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-2">
                  <span>1.3 km (Sekitar UIN)</span>
                  <span>3 km</span>
                  <span>5 km (Kartasura)</span>
                  <span>15 km</span>
                </div>
              </div>

              {/* Opsi Tambahan Anjem Motor: Mampir Tempat Tambahan */}
              {selectedService.slug === "antar-jemput-motor" && (
                <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Mampir ke Tempat Tambahan (+Rp1.000/tempat)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Pilih jika driver diminta singgah/mampir di titik lain sebelum tujuan
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setExtraStops((p) => Math.max(0, p - 1))}
                        disabled={extraStops === 0}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 flex items-center justify-center font-bold text-slate-700 cursor-pointer"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-7 text-center font-extrabold text-slate-900 text-sm">
                        {extraStops}
                      </span>
                      <button
                        type="button"
                        onClick={() => setExtraStops((p) => Math.min(5, p + 1))}
                        className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center font-bold cursor-pointer"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Opsi Lengkap Jastip (Kuliner / Belanja) */}
              {selectedService.slug.startsWith("jastip") && (
                <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    🛍️ Ketentuan &amp; Opsi Layanan Jastip
                  </h3>

                  {/* 1. Jumlah Tempat Belanja */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Tambah Tempat Belanja (+Rp2.000/tempat)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        1 tempat gratis. Tambah tempat dikenakan biaya Rp2.000
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setJastipExtraPlaces((p) => Math.max(0, p - 1))}
                        disabled={jastipExtraPlaces === 0}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 flex items-center justify-center font-bold text-slate-700 cursor-pointer"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-7 text-center font-extrabold text-slate-900 text-sm">
                        {jastipExtraPlaces}
                      </span>
                      <button
                        type="button"
                        onClick={() => setJastipExtraPlaces((p) => Math.min(5, p + 1))}
                        className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center font-bold cursor-pointer"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* 2. Checkbox Foodcourt / 1 Area */}
                  {jastipExtraPlaces > 0 && (
                    <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={jastipSameArea}
                        onChange={(e) => setJastipSameArea(e.target.checked)}
                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <div>
                        <strong className="text-slate-800 block font-semibold">
                          Beda tempat tapi masih 1 area (contoh: Foodcourt / Kantin)
                        </strong>
                        <span className="text-slate-500 text-[11px]">
                          Bebas biaya pindah tempat. Dihitung Rp1.000/item jika melebihi 3 item.
                        </span>
                      </div>
                    </label>
                  )}

                  {/* 3. Jumlah Item Titipan */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Perkiraan Jumlah Item Barang
                      </span>
                      <span className="text-[11px] text-slate-500">
                        1–3 item gratis. Lebih dari 3 item dikenakan +Rp1.000 per item
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setJastipItemsCount((p) => Math.max(1, p - 1))}
                        disabled={jastipItemsCount <= 1}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 flex items-center justify-center font-bold text-slate-700 cursor-pointer"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-7 text-center font-extrabold text-slate-900 text-sm">
                        {jastipItemsCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => setJastipItemsCount((p) => p + 1)}
                        className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center font-bold cursor-pointer"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* 4. Jastip Luar UIN */}
                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={jastipOutsideUin}
                      onChange={(e) => setJastipOutsideUin(e.target.checked)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <div>
                      <strong className="text-slate-800 block font-semibold">
                        Jastip di luar area UIN (estimasi 2 km)
                      </strong>
                      <span className="text-slate-500 text-[11px]">
                        Dikenakan tarif ongkir dasar Rp5.000
                      </span>
                    </div>
                  </label>
                </div>
              )}

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
                        id="input-item-notes"
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
                      id="input-items-estimate"
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

              {/* Inputan Nomor WhatsApp Khusus jika belum terisi atau tombol ubah */}
              <div id="section-phone" className="pt-2 border-t border-slate-100">
                {!customerPhone ? (
                  <div className="p-4 bg-amber-50/90 border border-amber-300/80 rounded-2xl space-y-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                        <Phone size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-amber-950">
                          Nomor WhatsApp Pemesan (Wajib)
                        </h4>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          Driver kami membutuhkan nomor WhatsApp Anda untuk konfirmasi lokasi dan menghubungimu saat pesanan tiba.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <input
                          id="input-inline-phone"
                          type="tel"
                          placeholder="cth: 081234567890 atau 6281234567890"
                          value={inlinePhone}
                          onChange={(e) => {
                            setInlinePhone(e.target.value);
                            setInlinePhoneError("");
                          }}
                          className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={inlinePhoneLoading || !inlinePhone.trim()}
                        onClick={handleSaveInlinePhone}
                        className="btn btn-primary py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-50"
                      >
                        {inlinePhoneLoading ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Menyimpan...</span>
                          </>
                        ) : (
                          <span>Simpan Nomor</span>
                        )}
                      </button>
                    </div>

                    {inlinePhoneError && (
                      <p className="text-[11px] text-red-600 font-medium flex items-center gap-1">
                        <AlertCircle size={12} />
                        {inlinePhoneError}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                      <div>
                        <span className="text-emerald-900 font-bold block">Nomor WhatsApp Koordinasi Driver:</span>
                        <span className="text-emerald-700 font-semibold">+{customerPhone}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPhoneModal(true)}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200 cursor-pointer shadow-2xs"
                    >
                      Ubah
                    </button>
                  </div>
                )}
              </div>

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
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                      <User size={14} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{customerName}</div>
                      {customerPhone ? (
                        <div className="text-emerald-700 font-semibold">+{customerPhone}</div>
                      ) : (
                        <div className="text-red-600 font-bold flex items-center gap-1">
                          <AlertCircle size={12} />
                          Nomor WhatsApp belum diisi
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPhoneModal(true)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200 cursor-pointer shadow-2xs"
                  >
                    {customerPhone ? "Ubah" : "Lengkapi"}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">
                      {(SERVICE_POINT_LABELS[selectedServiceId as keyof typeof SERVICE_POINT_LABELS] ?? SERVICE_POINT_LABELS["svc-1"]).pickup.label.replace(/^[\p{Emoji}\s]+/u, "").trim()}:
                    </span>
                    <span className="font-bold text-slate-800">{pickupName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">
                      {(SERVICE_POINT_LABELS[selectedServiceId as keyof typeof SERVICE_POINT_LABELS] ?? SERVICE_POINT_LABELS["svc-1"]).dropoff.label.replace(/^[\p{Emoji}\s]+/u, "").trim()}:
                    </span>
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
                <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-xs">
                  {fareResult.breakdown && fareResult.breakdown.length > 0 ? (
                    fareResult.breakdown.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-slate-600">
                        <span>{item.label}:</span>
                        <span className="font-medium text-slate-800">{formatRupiah(item.amount)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between text-slate-600">
                      <span>Tarif Dasar ({fareResult.zone.name}):</span>
                      <span>{formatRupiah(fareResult.base_price)}</span>
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

      {/* Modal Lengkapi Nomor WhatsApp */}
      <PhoneModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onSuccess={(savedPhone) => {
          setCustomerPhone(savedPhone);
          setShowPhoneModal(false);
          setErrorMsg("");
        }}
        initialPhone={customerPhone}
      />
    </div>
  );
}
