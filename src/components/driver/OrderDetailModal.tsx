"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  FileDown,
  MessageCircle,
  MapPin,
  Clock,
  User,
  Phone,
  CreditCard,
  CheckCircle2,
  Navigation,
  FileText,
  Copy,
  Check,
  Bike,
  AlertCircle,
  Loader2,
  Calendar,
  Sparkles,
  CloudRain,
  Moon,
} from "lucide-react";
import type { Order } from "@/types";
import { formatRupiah } from "@/lib/pricing/calculateFare";
import { generateInvoicePdf } from "@/lib/exportInvoicePdf";
import { getOrderServiceLabel } from "@/lib/driverChat";

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  driverName: string;
  driverInfo?: {
    name: string;
    plate: string;
    vehicle: string;
  };
  onTakeOrder?: (orderId: string) => void;
  onUpdateStatus?: (orderId: string, status: "on_the_way" | "completed") => void;
  onOrderUpdated?: (order: Order) => void;
  onOpenChat?: (order: Order) => void;
  isTaking?: boolean;
  isUpdating?: boolean;
  hasActiveOrder?: boolean;
}

export default function OrderDetailModal({
  isOpen,
  onClose,
  order,
  driverName,
  driverInfo,
  onTakeOrder,
  onUpdateStatus,
  onOrderUpdated,
  onOpenChat,
  isTaking = false,
  isUpdating = false,
  hasActiveOrder = false,
}: OrderDetailModalProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [localOrder, setLocalOrder] = useState<Order | null>(order);
  const [isTogglingRain, setIsTogglingRain] = useState(false);
  const [rainMessage, setRainMessage] = useState<string | null>(null);

  useEffect(() => {
    setLocalOrder(order);
  }, [order]);

  if (!isOpen || !localOrder) return null;

  const currentOrder = localOrder;

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(currentOrder.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {}
  };

  const handleExportPdf = () => {
    setIsExporting(true);
    try {
      generateInvoicePdf(currentOrder, driverInfo || {
        name: driverName,
        plate: currentOrder.driver_plate || "—",
        vehicle: "Sepeda Motor",
      });
    } catch (err) {
      console.error("Gagal export PDF:", err);
    } finally {
      setTimeout(() => setIsExporting(false), 800);
    }
  };

  const handleToggleRain = async () => {
    if (!currentOrder || isTogglingRain) return;
    const targetState = !Boolean(currentOrder.is_rain);
    setIsTogglingRain(true);
    setRainMessage(null);

    try {
      const res = await fetch(`/api/driver/orders/${currentOrder.id}/rain`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_rain: targetState }),
      });
      const data = await res.json();
      if (res.ok && data.order) {
        setLocalOrder(data.order);
        onOrderUpdated?.(data.order);
        setRainMessage(
          targetState
            ? "Opsi hujan AKTIF: +Rp2.000 ditambahkan ke tarif"
            : "Opsi hujan NONAKTIF: tarif kembali normal"
        );
      } else {
        alert(data.error || "Gagal mengubah opsi kondisi hujan.");
      }
    } catch (err) {
      console.error("Error toggling rain:", err);
      alert("Gagal menghubungi server.");
    } finally {
      setIsTogglingRain(false);
      setTimeout(() => setRainMessage(null), 3000);
    }
  };

  const serviceLabel = getOrderServiceLabel(currentOrder);

  const statusBadge = () => {
    switch (currentOrder.status) {
      case "pending":
        return {
          text: "ORDER MASUK (MENUNGGU DRIVER)",
          bg: "bg-blue-100 text-blue-700 border-blue-200",
        };
      case "assigned":
        return {
          text: "MENUJU LOKASI JEMPUT",
          bg: "bg-amber-100 text-amber-700 border-amber-200",
        };
      case "on_the_way":
        return {
          text: "SEDANG DI PERJALANAN",
          bg: "bg-purple-100 text-purple-700 border-purple-200",
        };
      case "completed":
        return {
          text: "PESANAN SELESAI",
          bg: "bg-emerald-100 text-emerald-700 border-emerald-200",
        };
      case "cancelled":
        return {
          text: "DIBATALKAN",
          bg: "bg-rose-100 text-rose-700 border-rose-200",
        };
      default:
        return {
          text: String(currentOrder.status || "ORDER").toUpperCase(),
          bg: "bg-slate-100 text-slate-700 border-slate-200",
        };
    }
  };

  const badge = statusBadge();

  const formattedCreated = currentOrder.created_at
    ? new Date(currentOrder.created_at).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

  const formattedCompleted = currentOrder.completed_at
    ? new Date(currentOrder.completed_at).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const isRainActive = Boolean(currentOrder.is_rain);
  const isNightActive = Boolean(currentOrder.is_night || currentOrder.fare_snapshot?.is_night);
  const canToggleRain = currentOrder.status === "assigned" || currentOrder.status === "on_the_way";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <FileText size={18} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-200">
                  {currentOrder.id}
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Salin Kode Order"
                >
                  {copiedId ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                </button>
              </div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight mt-0.5">
                Rincian Lengkap Orderan
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-4.5 overflow-y-auto flex-1 text-slate-800 text-xs">
          {/* Status & Service Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Status Pesanan
              </span>
              <span
                className={`inline-block mt-1 font-bold text-[11px] px-2.5 py-0.5 rounded-full border ${badge.bg}`}
              >
                {badge.text}
              </span>
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Layanan
              </span>
              <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                {serviceLabel}
              </span>
            </div>
          </div>

          {/* Special Badges: Malam / Hujan */}
          <div className="flex flex-wrap gap-2">
            {isNightActive && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold text-[11px]">
                <Moon size={12} className="text-indigo-600" />
                <span>Order Larut Malam (&gt; 22.30 WIB): +Rp1.000</span>
              </div>
            )}
            {isRainActive && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-[11px]">
                <CloudRain size={12} className="text-blue-600" />
                <span>Kondisi Hujan Aktif: +Rp2.000</span>
              </div>
            )}
          </div>

          {/* Driver Rain Toggle Control (Khusus pesanan aktif milik driver) */}
          {canToggleRain && (
            <div className="p-4 rounded-2xl border-2 border-blue-200 bg-gradient-to-r from-blue-50/80 to-sky-50/80 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isRainActive ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "bg-blue-100 text-blue-600"
                  }`}>
                    <CloudRain size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                        Opsi Kondisi Hujan
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isRainActive ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
                      }`}>
                        {isRainActive ? "HUJAN (+Rp2.000)" : "TIDAK HUJAN"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Nyalakan jika kondisi di lapangan sedang hujan. Otomatis menambah 2rb dan masuk ke invoice.
                    </p>
                  </div>
                </div>

                {/* Toggle Button */}
                <button
                  type="button"
                  onClick={handleToggleRain}
                  disabled={isTogglingRain}
                  aria-pressed={isRainActive}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 ${
                    isRainActive ? "bg-blue-600" : "bg-slate-300"
                  }`}
                  title={isRainActive ? "Matikan opsi hujan" : "Nyalakan opsi hujan (+2rb)"}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                      isRainActive ? "translate-x-5" : "translate-x-0"
                    }`}
                  >
                    {isTogglingRain ? (
                      <Loader2 size={11} className="animate-spin text-blue-600" />
                    ) : isRainActive ? (
                      <Check size={12} className="text-blue-600 font-bold" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    )}
                  </span>
                </button>
              </div>

              {rainMessage && (
                <div className="text-[11px] font-bold text-blue-800 bg-blue-100/80 px-2.5 py-1 rounded-lg animate-in fade-in">
                  ✓ {rainMessage}
                </div>
              )}
            </div>
          )}

          {/* Customer & Time Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Box Pemesan */}
            <div className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <User size={12} /> Pemesan (User)
              </span>
              <div className="font-bold text-slate-900 text-sm">
                {currentOrder.customer_name || "Pelanggan Anjem"}
              </div>
              <div className="text-slate-600 font-mono text-[11px] flex items-center gap-1">
                <Phone size={11} className="text-slate-400" />
                {currentOrder.customer_phone || "Nomor telepon tidak tersedia"}
              </div>
              {currentOrder.customer_phone && onOpenChat && (
                <button
                  type="button"
                  onClick={() => onOpenChat(currentOrder)}
                  className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer pt-1"
                >
                  <MessageCircle size={13} /> Chat Pemesan via WA
                </button>
              )}
            </div>

            {/* Box Waktu */}
            <div className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar size={12} /> Waktu Transaksi
              </span>
              <div>
                <span className="text-[11px] text-slate-400 block">Waktu Pemesanan:</span>
                <span className="font-bold text-slate-800 text-[11px]">
                  {formattedCreated} WIB
                </span>
              </div>
              {formattedCompleted && (
                <div className="pt-1">
                  <span className="text-[11px] text-slate-400 block">Waktu Selesai:</span>
                  <span className="font-bold text-emerald-700 text-[11px]">
                    {formattedCompleted} WIB
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Route & Destination Points */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Rute & Lokasi Pengantaran
            </span>

            {/* Titik Jemput */}
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin size={13} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">
                  Titik Jemput / Tempat Beli
                </span>
                <p className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5">
                  {currentOrder.pickup_name}
                </p>
              </div>
            </div>

            <div className="border-l-2 border-dashed border-slate-200 ml-3 h-3 my-0.5" />

            {/* Titik Antar */}
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <Navigation size={13} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">
                  Titik Antar / Lokasi Tujuan
                </span>
                <p className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5">
                  {currentOrder.dropoff_name}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Jarak Tempuh:</span>
              <strong className="text-slate-800">{currentOrder.distance_km} km</strong>
            </div>
          </div>

          {/* Catatan / Rincian Orderan dari User */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
            <span className="text-[11px] font-extrabold text-amber-800 flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-600" />
              Catatan & Rincian Pesanan (Diinput oleh User):
            </span>
            {currentOrder.item_notes && currentOrder.item_notes.trim() ? (
              <p className="text-xs text-amber-950 font-medium whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-xl border border-amber-200/60 mt-1">
                &ldquo;{currentOrder.item_notes.trim()}&rdquo;
              </p>
            ) : (
              <p className="text-xs text-amber-700/80 italic">
                (Tidak ada catatan khusus yang dituliskan pemesan)
              </p>
            )}
          </div>

          {/* Rincian Komponen Biaya & Breakdown */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Rincian Perhitungan Biaya
            </span>

            <div className="space-y-1.5 text-[11px]">
              {/* Jika ada breakdown items dari snapshot */}
              {currentOrder.fare_snapshot?.breakdown && currentOrder.fare_snapshot.breakdown.length > 0 ? (
                currentOrder.fare_snapshot.breakdown.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-slate-600">
                    <span>{item.label}</span>
                    <span className="font-medium text-slate-900">{formatRupiah(item.amount)}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Tarif Dasar ({currentOrder.fare_snapshot?.zone_name || "Zona"})</span>
                    <span className="font-medium text-slate-900">
                      {formatRupiah(currentOrder.fare_snapshot?.base_price || currentOrder.fare)}
                    </span>
                  </div>
                  {Boolean(currentOrder.fare_snapshot?.per_km_extra) && (
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Biaya Tambahan Jarak</span>
                      <span className="font-medium text-slate-900">
                        {formatRupiah(currentOrder.fare_snapshot.per_km_extra)}
                      </span>
                    </div>
                  )}
                  {Boolean(currentOrder.is_rain || currentOrder.fare_snapshot?.is_rain) && (
                    <div className="flex items-center justify-between text-blue-600 font-semibold">
                      <span>Opsi Cuaca Hujan</span>
                      <span>+Rp2.000</span>
                    </div>
                  )}
                  {Boolean(currentOrder.is_night || currentOrder.fare_snapshot?.is_night) && (
                    <div className="flex items-center justify-between text-indigo-600 font-semibold">
                      <span>Order Larut Malam (&gt; 22.30 WIB)</span>
                      <span>+Rp1.000</span>
                    </div>
                  )}
                </>
              )}

              {/* Tampilkan indikator hujan jika baru saja ditoggle dan belum masuk snapshot */}
              {isRainActive && !currentOrder.fare_snapshot?.breakdown?.some(b => b.label.toLowerCase().includes("hujan")) && (
                <div className="flex items-center justify-between text-blue-600 font-semibold">
                  <span>Opsi Cuaca Hujan</span>
                  <span>+Rp2.000</span>
                </div>
              )}
            </div>

            <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Total Biaya Ongkos
                </span>
                <strong className="text-lg font-extrabold text-emerald-600 block mt-0.5">
                  {formatRupiah(currentOrder.fare)}
                </strong>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Metode Pembayaran
                </span>
                <span className="font-bold text-slate-800 text-xs mt-0.5 flex items-center gap-1 justify-end">
                  <CreditCard size={13} />
                  {currentOrder.payment_method === "cash" ? "Tunai (Cash)" : "QRIS Driver"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
          {/* Tombol Export PDF untuk pesanan selesai */}
          {currentOrder.status === "completed" && (
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExporting}
              className="btn bg-slate-900 hover:bg-slate-800 text-white text-xs py-2 px-3.5 border-0 flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Menyiapkan PDF...
                </>
              ) : (
                <>
                  <FileDown size={14} className="text-emerald-400" />
                  Export Invoice PDF
                </>
              )}
            </button>
          )}

          {/* Close button if other primary actions exist */}
          <div className="flex items-center gap-2 ml-auto w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary text-xs py-2 px-3.5 cursor-pointer"
            >
              Tutup
            </button>

            {/* Chat WA button */}
            {onOpenChat && (
              <button
                type="button"
                onClick={() => {
                  onOpenChat(currentOrder);
                }}
                className="btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 px-3.5 border-0 flex items-center gap-1.5 cursor-pointer"
              >
                <MessageCircle size={14} />
                Chat WA
              </button>
            )}

            {/* Context Action Button: Ambil / Mulai / Selesai */}
            {currentOrder.status === "pending" && onTakeOrder && (
              <button
                type="button"
                disabled={hasActiveOrder || isTaking}
                onClick={() => onTakeOrder(currentOrder.id)}
                className="btn btn-primary text-xs py-2 px-4 cursor-pointer disabled:opacity-50"
              >
                {isTaking ? "Mengambil..." : "Ambil Order Ini"}
              </button>
            )}

            {currentOrder.status === "assigned" && onUpdateStatus && (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => onUpdateStatus(currentOrder.id, "on_the_way")}
                className="btn btn-primary text-xs py-2 px-4 cursor-pointer disabled:opacity-50"
              >
                {isUpdating ? "Memproses..." : "Mulai Perjalanan →"}
              </button>
            )}

            {currentOrder.status === "on_the_way" && onUpdateStatus && (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => onUpdateStatus(currentOrder.id, "completed")}
                className="btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 px-4 border-0 cursor-pointer disabled:opacity-50"
              >
                {isUpdating ? "Memproses..." : "Selesaikan Order"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
