"use client";

import React, { useState } from "react";
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
  onOpenChat,
  isTaking = false,
  isUpdating = false,
  hasActiveOrder = false,
}: OrderDetailModalProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !order) return null;

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(order.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {}
  };

  const handleExportPdf = () => {
    setIsExporting(true);
    try {
      generateInvoicePdf(order, driverInfo || {
        name: driverName,
        plate: order.driver_plate || "—",
        vehicle: "Sepeda Motor",
      });
    } catch (err) {
      console.error("Gagal export PDF:", err);
    } finally {
      setTimeout(() => setIsExporting(false), 800);
    }
  };

  const serviceLabel = getOrderServiceLabel(order);

  const statusBadge = () => {
    switch (order.status) {
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
          text: String(order.status || "ORDER").toUpperCase(),
          bg: "bg-slate-100 text-slate-700 border-slate-200",
        };
    }
  };

  const badge = statusBadge();

  const formattedCreated = order.created_at
    ? new Date(order.created_at).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

  const formattedCompleted = order.completed_at
    ? new Date(order.completed_at).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

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
                  {order.id}
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

          {/* Customer & Time Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Box Pemesan */}
            <div className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <User size={12} /> Pemesan (User)
              </span>
              <div className="font-bold text-slate-900 text-sm">
                {order.customer_name || "Pelanggan Anjem"}
              </div>
              <div className="text-slate-600 font-mono text-[11px] flex items-center gap-1">
                <Phone size={11} className="text-slate-400" />
                {order.customer_phone || "Nomor telepon tidak tersedia"}
              </div>
              {order.customer_phone && onOpenChat && (
                <button
                  type="button"
                  onClick={() => onOpenChat(order)}
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
                  {order.pickup_name}
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
                  {order.dropoff_name}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Jarak Tempuh:</span>
              <strong className="text-slate-800">{order.distance_km} km</strong>
            </div>
          </div>

          {/* Catatan / Rincian Orderan dari User */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
            <span className="text-[11px] font-extrabold text-amber-800 flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-600" />
              Catatan & Rincian Pesanan (Diinput oleh User):
            </span>
            {order.item_notes && order.item_notes.trim() ? (
              <p className="text-xs text-amber-950 font-medium whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-xl border border-amber-200/60 mt-1">
                &ldquo;{order.item_notes.trim()}&rdquo;
              </p>
            ) : (
              <p className="text-xs text-amber-700/80 italic">
                (Tidak ada catatan khusus yang dituliskan pemesan)
              </p>
            )}
          </div>

          {/* Rincian Pembayaran */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Total Biaya Ongkos
              </span>
              <strong className="text-lg font-extrabold text-emerald-600 block mt-0.5">
                {formatRupiah(order.fare)}
              </strong>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Metode Pembayaran
              </span>
              <span className="font-bold text-slate-800 text-xs mt-0.5 flex items-center gap-1 justify-end">
                <CreditCard size={13} />
                {order.payment_method === "cash" ? "Tunai (Cash)" : "QRIS Driver"}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
          {/* Tombol Export PDF untuk pesanan selesai */}
          {order.status === "completed" && (
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
                  onOpenChat(order);
                }}
                className="btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 px-3.5 border-0 flex items-center gap-1.5 cursor-pointer"
              >
                <MessageCircle size={14} />
                Chat WA
              </button>
            )}

            {/* Context Action Button: Ambil / Mulai / Selesai */}
            {order.status === "pending" && onTakeOrder && (
              <button
                type="button"
                disabled={hasActiveOrder || isTaking}
                onClick={() => onTakeOrder(order.id)}
                className="btn btn-primary text-xs py-2 px-4 cursor-pointer disabled:opacity-50"
              >
                {isTaking ? "Mengambil..." : "Ambil Order Ini"}
              </button>
            )}

            {order.status === "assigned" && onUpdateStatus && (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => onUpdateStatus(order.id, "on_the_way")}
                className="btn btn-primary text-xs py-2 px-4 cursor-pointer disabled:opacity-50"
              >
                {isUpdating ? "Memproses..." : "Mulai Perjalanan →"}
              </button>
            )}

            {order.status === "on_the_way" && onUpdateStatus && (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => onUpdateStatus(order.id, "completed")}
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
