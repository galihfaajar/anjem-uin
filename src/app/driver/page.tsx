"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppFAB from "@/components/layout/WhatsAppFAB";
import {
  Bike,
  Power,
  Star,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  LogOut,
  RefreshCw,
  Loader2,
  Eye,
  FileDown,
  FileText,
  CloudRain,
} from "lucide-react";
import { formatRupiah } from "@/lib/pricing/calculateFare";
import { buildWALink } from "@/lib/utils";
import { generateInvoicePdf } from "@/lib/exportInvoicePdf";
import { buildDriverDirectWALink } from "@/lib/driverChat";
import OrderDetailModal from "@/components/driver/OrderDetailModal";
import DriverChatModal from "@/components/driver/DriverChatModal";
import type { Order } from "@/types";
import { createClient } from "@/lib/supabase/client";

export default function DriverDashboardPage() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<"available" | "active" | "history">("available");
  const [toastMsg, setToastMsg] = useState<string>("");
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [driverName, setDriverName] = useState("Mitra Driver");
  const [driverPlate, setDriverPlate] = useState("—");
  const [driverVehicle, setDriverVehicle] = useState("Motor");
  const [driverRating, setDriverRating] = useState(5.0);
  const [driverTrips, setDriverTrips] = useState(0);
  const [driverStatus, setDriverStatus] = useState<"pending" | "approved" | "blocked">("approved");
  // Prevent double-click / race on "Ambil Order"
  const [takingOrderId, setTakingOrderId] = useState<string | null>(null);
  // Track status update loading per order
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  // Modals state
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);
  const [selectedOrderForChat, setSelectedOrderForChat] = useState<Order | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  // Debounce concurrent fetch calls
  const isFetchingRef = { current: false };

  // Fetch driver profile (called on mount and manual refresh)
  const fetchProfile = useCallback(async () => {
    try {
      const profileRes = await fetch("/api/profile");
      if (profileRes.ok) {
        const pData = await profileRes.json();
        if (pData.profile) setDriverName(pData.profile.full_name || "Mitra Driver");
        if (pData.driver) {
          setDriverPlate(pData.driver.plate_number || "—");
          setDriverVehicle(pData.driver.vehicle_type || "Motor");
          setDriverRating(pData.driver.rating_avg || 5.0);
          setDriverTrips(pData.driver.total_trips || 0);
          setDriverStatus(pData.driver.status || "approved");
          if (pData.driver.is_online !== undefined) {
            setIsOnline(pData.driver.is_online);
          }
        }
        return true;
      }
    } catch {}
    return false;
  }, []);

  // Fetch orders only (efficient for polling and realtime)
  const fetchOrders = useCallback(async () => {
    if (isFetchingRef.current) return false;
    isFetchingRef.current = true;
    try {
      const ordersRes = await fetch("/api/driver/orders");
      if (ordersRes.ok) {
        const oData = await ordersRes.json();
        setPendingOrders(oData.pending || []);
        setMyOrders(oData.mine || []);
        setIsLive(true);
        isFetchingRef.current = false;
        return true;
      }
    } catch {}
    isFetchingRef.current = false;
    return false;
  }, []);

  useEffect(() => {
    const init = async () => {
      const [profileOk, ordersOk] = await Promise.all([
        fetchProfile(),
        fetchOrders(),
      ]);

      if (!profileOk && !ordersOk) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/masuk");
          return;
        }
      }
      setIsLoading(false);
    };
    init();
  }, [fetchProfile, fetchOrders, router]);

  // Real-time synchronization: Supabase realtime channel with debounce + 8s light fallback
  useEffect(() => {
    if (!isLive) return;

    const supabase = createClient();
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const channel = supabase
      .channel("driver_orders_realtime_pool")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          // Debounce: wait 350ms so rapid database events fire only 1 fetch
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            fetchOrders();
          }, 350);
        }
      )
      .subscribe();

    // Fallback poll: only fetch orders every 8s (no profile re-fetching)
    const interval = setInterval(() => {
      fetchOrders();
    }, 8000);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [isLive, fetchOrders]);

  // Derived
  const availableOrders = isLive ? pendingOrders : pendingOrders;
  const myActiveOrders = myOrders.filter((o) => ["assigned", "on_the_way"].includes(o.status));
  const hasActiveOrder = myActiveOrders.length > 0;
  const completedOrders = myOrders.filter((o) => o.status === "completed");
  const totalEarnings = completedOrders.reduce((sum, o) => sum + o.fare, 0);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleToggleOnline = async () => {
    const nextVal = !isOnline;
    setIsOnline(nextVal);
    if (isLive) {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("drivers").update({ is_online: nextVal }).eq("profile_id", user.id);
        }
      } catch {}
    }
    showToast(nextVal ? "Status: ONLINE (Siap mengambil orderan baru)" : "Status: OFFLINE (Sedang istirahat)");
  };

  const handleExportInvoice = (ord: Order) => {
    setExportingId(ord.id);
    try {
      generateInvoicePdf(ord, {
        name: driverName,
        plate: driverPlate,
        vehicle: driverVehicle,
      });
      showToast(`Invoice PDF ${ord.id} berhasil diunduh!`);
    } catch (err) {
      console.error(err);
      showToast("Gagal mengunduh invoice PDF.");
    } finally {
      setTimeout(() => setExportingId(null), 800);
    }
  };

  const handleTakeOrder = async (orderId: string) => {
    // Prevent double-click / re-entrant calls
    if (takingOrderId !== null) return;

    if (!isOnline) {
      showToast("Aktifkan status Online terlebih dahulu.");
      return;
    }

    if (hasActiveOrder) {
      showToast("Anda sedang menjalankan 1 pesanan aktif! Selesaikan pesanan tersebut terlebih dahulu.");
      setActiveTab("active");
      return;
    }

    setTakingOrderId(orderId); // Lock the button immediately
    try {
      const res = await fetch(`/api/driver/orders/${orderId}/take`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        // INSTANT OPTIMISTIC UI: Remove from pending and immediately insert into active orders!
        setPendingOrders((prev) => prev.filter((o) => o.id !== orderId));
        if (data.order) {
          setMyOrders((prev) => [data.order, ...prev.filter((o) => o.id !== orderId)]);
        }
        setActiveTab("active");
        showToast("Order berhasil diambil!");
      } else {
        showToast(data.error || "Gagal mengambil order.");
        await fetchOrders();
      }
    } catch {
      showToast("Gagal terhubung ke server.");
    } finally {
      setTakingOrderId(null); // Always unlock
    }
  };

  const handleToggleRain = async (orderId: string, currentState: boolean) => {
    try {
      const res = await fetch(`/api/driver/orders/${orderId}/rain`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_rain: !currentState }),
      });
      const data = await res.json();
      if (res.ok && data.order) {
        setMyOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
        if (selectedOrderForDetail?.id === orderId) {
          setSelectedOrderForDetail(data.order);
        }
        showToast(
          !currentState
            ? "Opsi kondisi hujan AKTIF (+Rp2.000)"
            : "Opsi kondisi hujan NONAKTIF"
        );
      } else {
        showToast(data.error || "Gagal mengubah opsi kondisi hujan.");
      }
    } catch {
      showToast("Gagal terhubung ke server.");
    }
  };

  const handleUpdateStatus = async (orderId: string, nextStatus: "on_the_way" | "completed") => {
    if (updatingOrderId) return;
    setUpdatingOrderId(orderId);

    // Snapshot for rollback in case of error
    const previousOrders = [...myOrders];

    // INSTANT OPTIMISTIC UI: Update status in UI immediately for snappy response
    setMyOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );

    if (nextStatus === "completed") {
      showToast("Order selesai! Masuk ke riwayat.");
    } else {
      showToast("Status diperbarui: Sedang dalam perjalanan.");
    }

    try {
      const res = await fetch(`/api/driver/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.order) {
          setMyOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, ...data.order } : o))
          );
        }
        if (nextStatus === "completed") {
          setActiveTab("history");
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setMyOrders(previousOrders); // Rollback on error
        showToast(errData.error || "Gagal memperbarui status order.");
      }
    } catch {
      setMyOrders(previousOrders); // Rollback on network failure
      showToast("Gagal menghubungi server.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error(err);
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("anjem_role");
      localStorage.removeItem("anjem_user");
    }
    router.push("/masuk");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 pt-6 pb-16">
        <div className="container-main max-w-4xl mx-auto px-4">
          {/* Toast Notification */}
          {toastMsg && (
            <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>{toastMsg}</span>
            </div>
          )}

          {/* Driver Profile Header Card */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-emerald-500/20">
                {driverName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    {driverName}
                  </h1>
                  <span className="badge badge-green text-[10px] py-0.5 px-2 font-bold">
                    {driverStatus === "approved" ? "Terverifikasi" : driverStatus === "pending" ? "Pending" : "Diblokir"}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {driverVehicle} • Plat: <strong>{driverPlate}</strong>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs">
                  <span className="flex items-center gap-1 font-bold text-amber-500">
                    <Star size={13} fill="#f59e0b" />
                    {driverRating.toFixed(1)}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500">{driverTrips} Trip Selesai</span>
                </div>
              </div>
            </div>

            {/* Online / Offline Toggle Button */}
            <div className="flex items-center gap-3 self-start sm:self-center">
              <button
                onClick={handleToggleOnline}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                  isOnline
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-sm"
                    : "bg-slate-100 text-slate-500 border border-slate-300"
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isOnline ? "bg-emerald-500 animate-pulse-dot" : "bg-slate-400"
                  }`}
                />
                {isOnline ? "STATUS ONLINE" : "STATUS OFFLINE"}
              </button>

              <button
                onClick={handleLogout}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-red-600 transition-colors"
                title="Keluar"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>

          {!isOnline && (
            <div className="p-3.5 rounded-xl border mb-6 bg-amber-50 border-amber-200 text-amber-800 flex items-center gap-2.5">
              <AlertCircle size={18} className="flex-shrink-0" />
              <span className="text-xs">
                <strong>Status Anda sedang Offline.</strong> Anda tidak dapat melihat order
                masuk atau menerima pesanan baru sampai mengaktifkan status online di atas.
              </span>
            </div>
          )}

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center sm:text-left">
              <span className="text-[11px] font-semibold text-slate-400 block">Order Tersedia</span>
              <span className="text-xl sm:text-2xl font-extrabold text-blue-600">
                {isOnline ? availableOrders.length : 0}
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center sm:text-left">
              <span className="text-[11px] font-semibold text-slate-400 block">Sedang Dikerjakan</span>
              <span className="text-xl sm:text-2xl font-extrabold text-amber-600">
                {myActiveOrders.length}
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center sm:text-left">
              <span className="text-[11px] font-semibold text-slate-400 block">Estimasi Pendapatan</span>
              <span className="text-sm sm:text-base font-extrabold text-emerald-600">
                {formatRupiah(totalEarnings)}
              </span>
            </div>
          </div>

          {/* Dashboard Tabs */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden mb-8">
            <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-2">
              <button
                onClick={() => setActiveTab("available")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === "available"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Order Masuk ({isOnline ? availableOrders.length : 0})
              </button>
              <button
                onClick={() => setActiveTab("active")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === "active"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Order Aktif ({myActiveOrders.length})
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === "history"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Riwayat Selesai ({completedOrders.length})
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {/* TAB 1: ORDER MASUK (AVAILABLE POOL) */}
              {activeTab === "available" && (
                <div className="space-y-4">
                  {/* Warning jika driver sedang memiliki pesanan aktif */}
                  {hasActiveOrder && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-3 shadow-xs">
                      <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold text-sm block mb-0.5">
                          Anda sedang menjalankan 1 pesanan aktif ({myActiveOrders[0]?.id})
                        </strong>
                        Selesaikan pesanan aktif Anda di tab <strong>&ldquo;Order Aktif&rdquo;</strong> terlebih dahulu sebelum dapat mengambil pesanan baru.
                      </div>
                    </div>
                  )}

                  {!isOnline ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      Aktifkan status online untuk memuat pesanan masuk.
                    </div>
                  ) : availableOrders.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs sm:text-sm">
                      Belum ada order masuk di area sekitar kampus saat ini. Memantau secara live...
                    </div>
                  ) : (
                    availableOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-4 rounded-xl border border-blue-200 bg-blue-50/20 hover:border-blue-400 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {ord.id}
                            </span>
                            <span className="badge badge-blue text-[10px]">
                              {ord.service_name || "Layanan"}
                            </span>
                            <span className="text-[11px] font-semibold text-emerald-600">
                              Ongkos: {formatRupiah(ord.fare)}
                            </span>
                          </div>

                          <div className="text-xs font-bold text-slate-900">
                            📍 Jemput: {ord.pickup_name}
                          </div>
                          <div className="text-xs font-bold text-slate-700">
                            🏁 Tujuan: {ord.dropoff_name}
                          </div>

                          {ord.item_notes && (
                            <p className="text-[11px] text-slate-500 italic">
                              Catatan: &ldquo;{ord.item_notes}&rdquo;
                            </p>
                          )}

                          <div className="text-[10px] text-slate-400">
                            Jarak: {ord.distance_km} km • Pemesan: {ord.customer_name} • Bayar:{" "}
                            {ord.payment_method === "cash" ? "Tunai" : "QRIS"}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForDetail(ord)}
                            className="btn btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye size={13} />
                            Detail
                          </button>

                          <button
                            onClick={() => handleTakeOrder(ord.id)}
                            disabled={hasActiveOrder || !isOnline || takingOrderId !== null}
                            className={`text-xs py-2 px-4 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                              hasActiveOrder
                                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                : takingOrderId === ord.id
                                ? "bg-blue-300 text-white border-0 cursor-wait"
                                : "btn btn-primary shadow-sm hover:scale-102 cursor-pointer"
                            }`}
                          >
                            {hasActiveOrder
                              ? "Selesaikan Order Aktif Dahulu"
                              : takingOrderId === ord.id
                              ? "Mengambil..."
                              : "Ambil Order Ini"}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 2: ORDER AKTIF (BEING SERVED) */}
              {activeTab === "active" && (
                <div className="space-y-4">
                  {myActiveOrders.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs sm:text-sm">
                      Tidak ada pesanan yang sedang aktif. Silakan ambil dari tab &ldquo;Order Masuk&rdquo;.
                    </div>
                  ) : (
                    myActiveOrders.map((ord) => {
                      return (
                        <div
                          key={ord.id}
                          className="p-5 rounded-2xl border-2 border-amber-300 bg-amber-50/20 space-y-4"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-extrabold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                              {ord.id}
                            </span>
                            <span className="text-xs font-extrabold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                              {ord.status === "assigned"
                                ? "MENUJU TITIK JEMPUT"
                                : "SEDANG DI PERJALANAN"}
                            </span>
                          </div>

                          <div className="space-y-1 text-xs">
                            <div>
                              <span className="text-slate-400 text-[11px] block">Titik Jemput:</span>
                              <strong className="text-slate-900 text-sm">{ord.pickup_name}</strong>
                            </div>
                            <div className="pt-1">
                              <span className="text-slate-400 text-[11px] block">Titik Antar:</span>
                              <strong className="text-slate-900 text-sm">{ord.dropoff_name}</strong>
                            </div>
                            {ord.item_notes && (
                              <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-600 italic text-[11px] mt-2">
                                Catatan pemesan: &ldquo;{ord.item_notes}&rdquo;
                              </div>
                            )}
                          </div>

                          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-800 break-words">
                                {ord.customer_name} ({ord.customer_phone})
                              </div>
                              <span className="text-xs text-slate-500 block">
                                Total Ongkos:{" "}
                                <strong className="text-blue-600">{formatRupiah(ord.fare)}</strong>{" "}
                                ({ord.payment_method === "cash" ? "Tunai" : "QRIS"})
                              </span>
                              <div className="mt-1.5 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleRain(ord.id, Boolean(ord.is_rain))}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                    ord.is_rain
                                      ? "bg-blue-600 text-white shadow-xs"
                                      : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                                  }`}
                                  title="Toggle opsi kondisi cuaca hujan (+Rp2.000)"
                                >
                                  <CloudRain size={12} className={ord.is_rain ? "text-white" : "text-blue-600"} />
                                  <span>{ord.is_rain ? "Hujan (+Rp2.000)" : "Toggle Hujan"}</span>
                                </button>
                                {ord.is_night && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    🌙 Order Malam
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
                              <button
                                type="button"
                                onClick={() => setSelectedOrderForDetail(ord)}
                                className="btn btn-secondary text-xs py-2 px-3 flex items-center justify-center gap-1.5 flex-1 sm:flex-initial cursor-pointer"
                              >
                                <Eye size={13} />
                                Detail
                              </button>

                              {ord.customer_phone && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderForChat(ord)}
                                  className="btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 px-3 border-0 flex items-center justify-center gap-1.5 flex-1 sm:flex-initial cursor-pointer"
                                >
                                  <MessageCircle size={14} />
                                  Chat WA
                                </button>
                              )}

                              {ord.status === "assigned" ? (
                                <button
                                  onClick={() => handleUpdateStatus(ord.id, "on_the_way")}
                                  disabled={updatingOrderId === ord.id}
                                  className="btn btn-primary text-xs py-2 px-3 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 flex-1 sm:flex-initial whitespace-nowrap text-center"
                                >
                                  {updatingOrderId === ord.id ? (
                                    <>
                                      <Loader2 size={13} className="animate-spin" /> Memproses...
                                    </>
                                  ) : (
                                    "Mulai Perjalanan →"
                                  )}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdateStatus(ord.id, "completed")}
                                  disabled={updatingOrderId === ord.id}
                                  className="btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 px-3 border-0 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 flex-1 sm:flex-initial whitespace-nowrap text-center"
                                >
                                  {updatingOrderId === ord.id ? (
                                    <>
                                      <Loader2 size={13} className="animate-spin" /> Menyelesaikan...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 size={14} />
                                      Selesaikan Order
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* TAB 3: RIWAYAT SELESAI */}
              {activeTab === "history" && (
                <div className="divide-y divide-slate-100">
                  {completedOrders.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      Belum ada order yang diselesaikan hari ini.
                    </div>
                  ) : (
                    completedOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/60 p-2.5 rounded-xl transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {ord.id}
                            </span>
                            <span className="badge badge-emerald text-[10px]">Selesai</span>
                            <span className="text-[11px] font-semibold text-slate-600">
                              {ord.service_name || (ord as any).service?.name || "Layanan"}
                            </span>
                          </div>
                          <div className="font-bold text-slate-800 text-xs sm:text-sm">
                            {ord.pickup_name} → {ord.dropoff_name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {ord.distance_km} km • Pemesan: {ord.customer_name || "Pelanggan"}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <div className="sm:text-right">
                            <span className="font-extrabold text-emerald-600 block text-sm">
                              +{formatRupiah(ord.fare)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {ord.payment_method === "cash" ? "Tunai" : "QRIS"}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedOrderForDetail(ord)}
                              className="btn btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1 cursor-pointer"
                              title="Lihat Detail Pesanan"
                            >
                              <Eye size={13} />
                              <span className="hidden sm:inline">Detail</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleExportInvoice(ord)}
                              disabled={exportingId === ord.id}
                              className="btn bg-slate-900 hover:bg-slate-800 text-white text-xs py-1.5 px-2.5 border-0 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Unduh Invoice PDF"
                            >
                              {exportingId === ord.id ? (
                                <Loader2 size={13} className="animate-spin text-emerald-400" />
                              ) : (
                                <FileDown size={13} className="text-emerald-400" />
                              )}
                              <span>PDF</span>
                            </button>

                            {ord.customer_phone && (
                              <button
                                type="button"
                                onClick={() => setSelectedOrderForChat(ord)}
                                className="btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1.5 px-2.5 border-0 flex items-center gap-1 cursor-pointer"
                                title="Chat WhatsApp Pemesan"
                              >
                                <MessageCircle size={13} />
                                <span className="hidden sm:inline">WA</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Detail Order */}
        <OrderDetailModal
          isOpen={selectedOrderForDetail !== null}
          onClose={() => setSelectedOrderForDetail(null)}
          order={selectedOrderForDetail}
          driverName={driverName}
          driverInfo={{
            name: driverName,
            plate: driverPlate,
            vehicle: driverVehicle,
          }}
          hasActiveOrder={hasActiveOrder}
          isTaking={takingOrderId === selectedOrderForDetail?.id}
          isUpdating={updatingOrderId === selectedOrderForDetail?.id}
          onOrderUpdated={(updated) => {
            setMyOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
            setSelectedOrderForDetail(updated);
          }}
          onTakeOrder={(id) => {
            setSelectedOrderForDetail(null);
            handleTakeOrder(id);
          }}
          onUpdateStatus={(id, status) => {
            handleUpdateStatus(id, status);
            setSelectedOrderForDetail(null);
          }}
          onOpenChat={(ord) => {
            setSelectedOrderForChat(ord);
          }}
        />

        {/* Modal Chat WhatsApp Driver */}
        <DriverChatModal
          isOpen={selectedOrderForChat !== null}
          onClose={() => setSelectedOrderForChat(null)}
          order={selectedOrderForChat}
          driverName={driverName}
        />
      </main>

      <Footer />
      <WhatsAppFAB />
    </div>
  );
}
