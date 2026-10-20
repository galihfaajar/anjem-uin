"use client";

import { useState } from "react";
import Link from "next/link";
import { Bike, Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LupaPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const supabase = createClient();
      if (supabase && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        });
        if (error) throw error;
      }

      setSuccessMsg(
        `Tautan instruksi reset kata sandi telah dikirim ke ${email}. Silakan periksa kotak masuk atau spam email Anda.`
      );
    } catch (err) {
      setErrorMsg(
        (err as Error).message ||
          "Gagal mengirim email reset kata sandi. Pastikan email terdaftar."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black group-hover:scale-105 transition-transform shadow-md shadow-blue-500/20">
            <Bike size={22} />
          </div>
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            Anjem<span className="text-blue-600">UIN</span>
          </span>
        </Link>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Lupa Kata Sandi
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          Masukkan alamat email yang terdaftar untuk menerima petunjuk pemulihan akun.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/90 rounded-2xl sm:px-10">
          {successMsg ? (
            <div className="space-y-5 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-100">
                <CheckCircle2 size={24} />
              </div>
              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {successMsg}
              </div>
              <div className="pt-2">
                <Link
                  href="/masuk"
                  className="btn btn-primary w-full text-xs sm:text-sm justify-center flex items-center gap-2"
                >
                  <ArrowLeft size={16} />
                  Kembali ke Halaman Masuk
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <div>{errorMsg}</div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Alamat Email Terdaftar
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="mahasiswa@uin.ac.id"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 btn btn-primary py-2.5 text-sm flex items-center justify-center gap-2"
              >
                {loading ? "Mengirim..." : "Kirim Tautan Reset"}
                <ArrowRight size={16} />
              </button>

              <div className="pt-4 text-center">
                <Link
                  href="/masuk"
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  Batal dan kembali ke halaman masuk
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
