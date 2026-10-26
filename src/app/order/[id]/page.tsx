"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppFAB from "@/components/layout/WhatsAppFAB";
import {
  Bike,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  MessageCircle,
  RefreshCw,
  XCircle,
  Star,
  ShieldCheck,
} from "lucide-react";
import { formatRupiah } from "@/lib/pricing/calculateFare";
import type { Order, OrderEvent, OrderStatus } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { buildWALink } from "@/lib/utils";

const statusConfig: Record<
  OrderStatus,
  { label: string; bg: string; text: string; icon: any }
> = {
  pending: {
    label: "Menunggu Driver",
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    icon: Clock,
  },
  assigned: {
    label: "Driver Ditugaskan",
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-700",
    icon: Bike,
  },
  on_the_way: {
    label: "Sedang Dalam Perjalanan",
    bg: "bg-indigo-50 border-indigo-200",
    text: "text-indigo-700",
    icon: Bike,
  },
  completed: {
    label: "Pesanan Selesai",
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Pesanan Dibatalkan",
    bg: "bg-red-50 border-red-200",
    text: "text-red-700",
    icon: XCircle,
  },
};

export default function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);

  const fetchOrderFromAPI = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.order) {
          setOrder(data.order);
          setEvents(data.events || []);
          setIsLiveMode(true);
          return true;
        }
      }
    } catch (err) {
      console.error("Error fetching order:", err);
    }
    return false;
  }, [orderId]);

  const loadOrder = useCallback(async () => {
    const fromAPI = await fetchOrderFromAPI();
    if (!fromAPI) {
      setOrder(null);
    }
    setIsLoading(false);
  }, [fetchOrderFromAPI]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  // Real-time synchronization: Supabase realtime listener + fast poll
  useEffect(() => {
    if (!orderId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`order_tracking_realtime_${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        () => {
          fetchOrderFromAPI();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_events",
          filter: `order_id=eq.${orderId}`,
        },
        () => {
          fetchOrderFromAPI();
        }
      )
      .subscribe();

    // Backup fallback poll (tiap 6 detik) selama order aktif (Supabase Realtime handles instant updates)
    const interval = setInterval(() => {
      if (order?.status !== "completed" && order?.status !== "cancelled") {
        fetchOrderFromAPI();
      }
    }, 6000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [orderId, order?.status, fetchOrderFromAPI]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrderFromAPI();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleCancelOrder = async () => {
    if (!order) return;

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "cancelled",
          cancel_reason: cancelReason || "Dibatalkan oleh pelanggan",
        }),
      });
      if (res.ok) {
        await fetchOrderFromAPI();
        setCancelModalOpen(false);
        return;
      }
    } catch {}
    setCancelModalOpen(false);
  };

  const handleReviewSubmit = async () => {
    if (isLiveMode && order) {
      try {
        await fetch(`/api/reviews`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.id,
            driverId: order.driver_id,
            serviceId: order.service_id,
            rating,
            comment,
          }),
        });
      } catch {}
    }
    setReviewSubmitted(true);
    setTimeout(() => {
      setReviewModalOpen(false);
    }, 1200);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <RefreshCw className="animate-spin text-blue-600 mx-auto mb-3" size={28} />
            <p className="text-sm text-slate-600">Memuat status pesanan...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle className="text-red-400 mx-auto mb-3" size={32} />
            <p className="text-sm text-slate-700 font-semibold mb-1">Pesanan tidak ditemukan</p>
            <p className="text-xs text-slate-500 mb-4">
              ID pesanan <code className="bg-slate-100 px-1 rounded">{orderId}</code> tidak ditemukan.
            </p>
            <Link href="/pesan" className="btn btn-primary text-xs">
              Buat Pesanan Baru
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const currentStatus = statusConfig[order.status] ?? statusConfig.pending;
  const StatusIcon = currentStatus.icon;

  const waDriverHref = order.driver_phone
    ? buildWALink(
        order.driver_phone,
        `Halo kak ${order.driver_name}, saya pemesan ${order.id} (${order.pickup_name} ke ${order.dropoff_name}). Apakah sudah menuju lokasi?`
      )
    : "#";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 pt-6 pb-16">
        <div className="container-main max-w-3xl mx-auto">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">ID Pesanan:</span>
                <span className="font-mono text-sm font-extrabold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  {order.id}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                Lacak Status Pesanan
              </h1>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="btn btn-secondary text-xs self-start sm:self-auto flex items-center gap-2"
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
              {isRefreshing ? "Memperbarui..." : "Perbarui Status"}
            </button>
          </div>

          {/* Current Status Badge Card */}
          <div
            className={`rounded-2xl p-6 border ${currentStatus.bg} shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                <StatusIcon size={24} className={currentStatus.text} />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status Terkini
                </div>
                <div className={`text-xl font-extrabold ${currentStatus.text}`}>
                  {currentStatus.label}
                </div>
                {order.status === "pending" && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sistem sedang mencari mitra driver terdekat di sekitarmu...
                  </p>
                )}
                {order.status === "assigned" && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Driver telah menerima pesanan dan bersiap menuju titik jemput.
                  </p>
                )}
                {order.status === "on_the_way" && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Perjalanan sedang berlangsung menuju tujuan dengan aman.
                  </p>
                )}
                {order.status === "completed" && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pesanan telah selesai. Terima kasih telah menggunakan Anjem UIN!
                  </p>
                )}
              </div>
            </div>

            {/* CTA Driver WhatsApp */}
            {order.driver_phone && ["assigned", "on_the_way"].includes(order.status) && (
              <a
                href={waDriverHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 text-xs sm:text-sm flex items-center justify-center gap-2 flex-shrink-0 shadow-md shadow-emerald-600/20"
              >
                <MessageCircle size={16} />
                Hubungi Driver
              </a>
            )}
          </div>

          {/* Driver Card if Assigned */}
          {order.driver_name && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm mb-6">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Informasi Mitra Driver
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 font-extrabold text-base flex items-center justify-center">
                    {order.driver_name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      {order.driver_name}
                      <span className="badge badge-green text-[10px] py-0.5 px-2">Terverifikasi</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Kendaraan: <span className="font-semibold text-slate-700">{order.driver_plate || "Motor"}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center justify-end gap-1 text-amber-500 font-bold text-xs">
                    <Star size={13} fill="#f59e0b" />
                    <span>5.0</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Mitra Resmi Kampus</span>
                </div>
              </div>
            </div>
          )}

          {/* Order Details Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm mb-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Rincian Perjalanan & Tarif
            </h2>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-slate-400 text-xs block">Titik Jemput:</span>
                  <span className="font-bold text-slate-900">{order.pickup_name}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-slate-400 text-xs block">Titik Tujuan:</span>
                  <span className="font-bold text-slate-900">{order.dropoff_name}</span>
                </div>
              </div>

              {order.item_notes && (
                <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-600">
                  <span className="font-bold text-slate-700 block mb-0.5">Catatan Pesanan:</span>
                  &ldquo;{order.item_notes}&rdquo;
                </div>
              )}

              {/* Special Badges: Hujan / Malam */}
              {(order.is_rain || order.is_night) && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {order.is_rain && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      ☔ Cuaca Hujan (+Rp2.000)
                    </span>
                  )}
                  {order.is_night && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      🌙 Order Malam &gt;22.30 WIB (+Rp1.000)
                    </span>
                  )}
                </div>
              )}

              {/* Breakdown List jika ada */}
              {order.fare_snapshot?.breakdown && order.fare_snapshot.breakdown.length > 0 && (
                <div className="bg-slate-50 p-3 rounded-xl space-y-1 text-xs text-slate-600">
                  <span className="font-bold text-slate-700 block mb-1">Rincian Perhitungan Ongkir:</span>
                  {order.fare_snapshot.breakdown.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item.label}</span>
                      <span className="font-medium text-slate-800">{formatRupiah(item.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Jarak: <strong>{order.distance_km} km</strong> • Layanan:{" "}
                  <strong>{order.service_name || "Antar Jemput"}</strong>
                </span>
                <div className="text-right">
                  <span className="text-xs text-slate-400 mr-2">Ongkos:</span>
                  <span className="text-base font-extrabold text-blue-600">
                    {formatRupiah(order.fare)}
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    Metode: {order.payment_method === "cash" ? "Tunai" : "QRIS Driver"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline / Order Events */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm mb-6">
            <h2 className="text-sm font-bold text-slate-900 mb-4">
              Riwayat Perjalanan (Timeline)
            </h2>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {events.map((ev, idx) => (
                <div key={ev.id || idx} className="relative">
                  <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-blue-600 ring-4 ring-blue-50" />
                  <div className="text-xs font-bold text-slate-800">
                    {statusConfig[ev.status_to]?.label ?? ev.status_to}
                  </div>
                  {ev.notes && (
                    <p className="text-xs text-slate-600 mt-0.5">{ev.notes}</p>
                  )}
                  <span className="text-[10px] text-slate-400 block mt-1">
                    {new Date(ev.created_at).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    WIB
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/" className="text-xs text-slate-500 hover:text-slate-800">
              ← Kembali ke Beranda
            </Link>

            <div className="flex items-center gap-2">
              {["pending", "assigned"].includes(order.status) && (
                <button
                  onClick={() => setCancelModalOpen(true)}
                  className="px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors"
                >
                  Batalkan Pesanan
                </button>
              )}

              {order.status === "completed" && (
                <button
                  onClick={() => setReviewModalOpen(true)}
                  className="btn btn-primary text-xs flex items-center gap-1.5"
                >
                  <Star size={14} />
                  Beri Ulasan Layanan
                </button>
              )}
            </div>
          </div>

          {/* Modal Pembatalan */}
          {cancelModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Batalkan Pesanan?</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Beri tahu alasan pembatalan agar tim kami dapat meningkatkan kualitas layanan:
                </p>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Misal: Sudah dapat tumpangan teman, atau salah tentukan titik..."
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs text-slate-900 mb-4 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setCancelModalOpen(false)}
                    className="btn btn-secondary text-xs"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleCancelOrder}
                    className="btn bg-red-600 hover:bg-red-700 text-white text-xs border-0"
                  >
                    Ya, Batalkan Pesanan
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Ulasan */}
          {reviewModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
                <h3 className="text-lg font-bold text-slate-900 mb-1">Beri Ulasan Driver</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Bagaimana pengalaman perjalananmu bersama {order.driver_name || "driver"}?
                </p>

                {reviewSubmitted ? (
                  <div className="py-6 text-center text-emerald-600 font-bold text-sm">
                    <CheckCircle2 size={36} className="mx-auto mb-2" />
                    Terima kasih atas ulasanmu!
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-center gap-2 mb-4 text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            size={28}
                            fill={star <= rating ? "#f59e0b" : "transparent"}
                            className={star <= rating ? "text-amber-500" : "text-slate-300"}
                          />
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Tulis ulasan tentang ketepatan waktu, keramahan, dan kenyamanan perjalanan..."
                      className="w-full p-3 border border-slate-200 rounded-xl text-xs text-slate-900 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setReviewModalOpen(false)}
                        className="btn btn-secondary text-xs"
                      >
                        Tutup
                      </button>
                      <button
                        onClick={handleReviewSubmit}
                        className="btn btn-primary text-xs"
                      >
                        Kirim Ulasan
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <WhatsAppFAB />
    </div>
  );
}
