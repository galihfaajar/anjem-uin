"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  MessageCircle,
  Copy,
  Check,
  Send,
  ExternalLink,
  Sparkles,
  Phone,
  User,
} from "lucide-react";
import type { Order } from "@/types";
import {
  buildDriverOrderMessage,
  type ChatTemplateType,
} from "@/lib/driverChat";
import { buildWALink } from "@/lib/utils";

interface DriverChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  driverName: string;
}

export default function DriverChatModal({
  isOpen,
  onClose,
  order,
  driverName,
}: DriverChatModalProps) {
  const [template, setTemplate] = useState<ChatTemplateType>("pickup");
  const [customMessage, setCustomMessage] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Sync initial template based on order status
  useEffect(() => {
    if (!order) return;
    const initialTpl: ChatTemplateType =
      order.status === "completed"
        ? "completed"
        : order.status === "on_the_way"
        ? "on_the_way"
        : "pickup";
    setTemplate(initialTpl);
    setCustomMessage(buildDriverOrderMessage(order, driverName, initialTpl));
    setCopied(false);
  }, [order, driverName, isOpen]);

  // Handle template switch
  const handleSelectTemplate = (tpl: ChatTemplateType) => {
    if (!order) return;
    setTemplate(tpl);
    setCustomMessage(buildDriverOrderMessage(order, driverName, tpl));
  };

  const handleCopy = async () => {
    if (!customMessage) return;
    try {
      await navigator.clipboard.writeText(customMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  if (!isOpen || !order) return null;

  const phone = order.customer_phone || "";
  const waUrl = phone ? buildWALink(phone, customMessage) : "#";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <MessageCircle size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                Kirim Chat WhatsApp Pemesan
              </h3>
              <p className="text-[11px] text-emerald-100">
                Pesan otomatis terisi lengkap sesuai orderan user
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Target Customer Info */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0">
                <User size={15} />
              </div>
              <div className="truncate">
                <span className="font-bold text-slate-800 block truncate">
                  {order.customer_name || "Pelanggan Anjem"}
                </span>
                <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                  <Phone size={11} /> {order.customer_phone || "Nomor telepon tidak tersedia"}
                </span>
              </div>
            </div>
            <span className="font-mono text-[11px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
              {order.id}
            </span>
          </div>

          {/* Template Selector Pills */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 mb-1.5 flex items-center gap-1">
              <Sparkles size={12} className="text-amber-500" />
              Pilih Template Status Pesan:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => handleSelectTemplate("pickup")}
                className={`text-[11px] py-1.5 px-2 rounded-xl font-semibold border transition-all text-center cursor-pointer ${
                  template === "pickup"
                    ? "bg-emerald-500 text-white border-emerald-600 shadow-xs"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                📍 Menuju Jemput
              </button>
              <button
                type="button"
                onClick={() => handleSelectTemplate("on_the_way")}
                className={`text-[11px] py-1.5 px-2 rounded-xl font-semibold border transition-all text-center cursor-pointer ${
                  template === "on_the_way"
                    ? "bg-emerald-500 text-white border-emerald-600 shadow-xs"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                🛵 Di Perjalanan
              </button>
              <button
                type="button"
                onClick={() => handleSelectTemplate("completed")}
                className={`text-[11px] py-1.5 px-2 rounded-xl font-semibold border transition-all text-center cursor-pointer ${
                  template === "completed"
                    ? "bg-emerald-500 text-white border-emerald-600 shadow-xs"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                ✅ Selesai Antar
              </button>
              <button
                type="button"
                onClick={() => handleSelectTemplate("inquiry")}
                className={`text-[11px] py-1.5 px-2 rounded-xl font-semibold border transition-all text-center cursor-pointer ${
                  template === "inquiry"
                    ? "bg-emerald-500 text-white border-emerald-600 shadow-xs"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                💬 Tanya Titik
              </button>
            </div>
          </div>

          {/* Editable Text Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-600">
                Isi Pesan WhatsApp (Bisa Di-edit):
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] text-slate-500 hover:text-emerald-600 flex items-center gap-1 font-semibold cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check size={12} className="text-emerald-600" />
                    <span className="text-emerald-600">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Salin Pesan</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={9}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full text-xs font-mono p-3 rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50 leading-relaxed text-slate-800 resize-none"
              placeholder="Tulis pesan untuk pemesan..."
            />
            <p className="text-[10px] text-slate-400 mt-1">
              *Pesan telah otomatis memuat kode order, rincian titik, dan catatan dari pemesan.
            </p>
          </div>
        </div>

        {/* Action Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
          >
            Batal
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopy}
              className="btn btn-secondary text-xs py-2 px-3.5 flex items-center justify-center gap-1.5 flex-1 sm:flex-initial"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              {copied ? "Tersalin" : "Salin"}
            </button>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                setTimeout(onClose, 500);
              }}
              className={`btn text-xs py-2 px-4.5 font-bold text-white border-0 flex items-center justify-center gap-1.5 flex-1 sm:flex-initial shadow-sm ${
                !phone
                  ? "bg-slate-300 pointer-events-none"
                  : "bg-emerald-600 hover:bg-emerald-700 active:scale-98 cursor-pointer"
              }`}
            >
              <Send size={14} />
              Buka WhatsApp
              <ExternalLink size={12} className="opacity-80" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
