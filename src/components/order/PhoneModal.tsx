"use client";

import React, { useState } from "react";
import { Phone, AlertCircle, CheckCircle2, Loader2, X, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { normalizePhoneNumber, validatePhoneNumber } from "@/lib/phone";

interface PhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedPhone: string) => void;
  initialPhone?: string;
}

export default function PhoneModal({
  isOpen,
  onClose,
  onSuccess,
  initialPhone = "",
}: PhoneModalProps) {
  const [phoneInput, setPhoneInput] = useState(initialPhone);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const normalizedPreview = normalizePhoneNumber(phoneInput);
  const isValidPreview = normalizedPreview.length >= 11 && normalizedPreview.length <= 15 && /^62[0-9]+$/.test(normalizedPreview);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const validation = validatePhoneNumber(phoneInput);
    if (!validation.valid) {
      setErrorMsg(validation.error || "Format nomor WhatsApp tidak valid.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      
      // Panggil RPC set_my_phone (Security Definer)
      const { data, error } = await supabase.rpc("set_my_phone", {
        new_phone: validation.normalized,
      });

      if (error) {
        // Tangani pesan error dari RPC atau Postgres constraint
        let displayError = error.message;
        if (error.message.includes("sudah terdaftar pada akun lain") || error.code === "23505") {
          displayError = "Nomor WhatsApp ini sudah terdaftar pada akun lain. Silakan gunakan nomor WhatsApp Anda yang lain.";
        } else if (error.message.includes("Format nomor WhatsApp tidak valid")) {
          displayError = "Format nomor WhatsApp tidak valid. Gunakan format diawali 62 atau 08 (contoh: 081234567890).";
        }
        setErrorMsg(displayError);
        setLoading(false);
        return;
      }

      const savedPhone = (data && (data as any).phone) || validation.normalized;
      setLoading(false);
      onSuccess(savedPhone);
    } catch (err) {
      console.error("Error saving phone number via RPC:", err);
      setErrorMsg((err as Error).message || "Terjadi kesalahan saat menyimpan nomor WhatsApp.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between relative bg-gradient-to-r from-blue-50/50 to-emerald-50/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Phone size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 leading-tight">
                Lengkapi Nomor WhatsApp
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Wajib untuk koordinasi antar-jemput driver
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-2xl flex items-start gap-3 text-xs text-blue-900">
            <MessageSquare size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Akun Anda belum memiliki nomor WhatsApp aktif. Mitra driver kami akan menghubungi Anda melalui nomor ini untuk konfirmasi lokasi dan penjemputan.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in duration-150">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Nomor WhatsApp / HP Aktif:
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400 pointer-events-none">
                <Phone size={16} />
              </div>
              <input
                type="tel"
                autoFocus
                placeholder="cth: 081234567890 atau 6281234567890"
                value={phoneInput}
                onChange={(e) => {
                  setPhoneInput(e.target.value);
                  if (errorMsg) setErrorMsg("");
                }}
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* Preview normalisasi format */}
            {phoneInput.trim() ? (
              <div className="mt-2 flex items-center gap-1.5 text-[11px]">
                {isValidPreview ? (
                  <>
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span className="text-emerald-700 font-medium">
                      Disimpan sebagai: <strong className="font-bold">+{normalizedPreview}</strong>
                    </span>
                  </>
                ) : (
                  <span className="text-slate-500">
                    Otomatis diubah ke format internasional (diawali <strong className="text-slate-700">62</strong>)
                  </span>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1.5">
                Bisa diawali dengan 08... atau 62... (panjang 9–13 digit setelah 62).
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
            >
              Nanti Saja
            </button>
            <button
              type="submit"
              disabled={loading || !phoneInput.trim()}
              className="flex-1 btn btn-primary py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan & Lanjutkan</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
