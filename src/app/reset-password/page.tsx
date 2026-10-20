"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bike,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const supabase = createClient();

    const verifySession = async () => {
      // 1. Cek jika ada code di URL (fallback PKCE exchange di client)
      const code = searchParams.get("code");
      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) {
            setSessionValid(true);
            setIsVerifying(false);
            return;
          }
        } catch {
          // Lanjutkan cek sesi normal
        }
      }

      // 2. Cek sesi aktif saat ini
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessionValid(true);
      } else {
        // Tunggu event PASSWORD_RECOVERY jika redirect lewat hash fragment
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, newSession) => {
            if (event === "PASSWORD_RECOVERY" || newSession) {
              setSessionValid(true);
            }
          }
        );
        setTimeout(() => {
          setIsVerifying(false);
        }, 1200);
        return () => subscription.unsubscribe();
      }
      setIsVerifying(false);
    };

    verifySession();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (password.length < 6) {
      setErrorMsg("Kata sandi baru minimal 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Konfirmasi kata sandi tidak cocok. Harap periksa kembali.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw error;
      }

      setSuccessMsg(
        "Kata sandi berhasil diperbarui! Anda dapat masuk sekarang dengan kata sandi baru Anda."
      );
      setTimeout(() => {
        router.push("/masuk");
      }, 3000);
    } catch (err) {
      setErrorMsg(
        (err as Error).message ||
          "Gagal memperbarui kata sandi. Tautan mungkin telah kedaluwarsa. Silakan ajukan ulang."
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
          Buat Kata Sandi Baru
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Masukkan kata sandi baru yang aman untuk akun Anda
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/90 rounded-2xl sm:px-10">
          {isVerifying ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Memverifikasi tautan pemulihan akun...</p>
            </div>
          ) : !sessionValid && !successMsg ? (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center border border-amber-200">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Tautan Kedaluwarsa atau Tidak Valid
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tautan reset kata sandi ini sudah kedaluwarsa atau telah digunakan. Silakan ajukan
                kembali permintaan lupa kata sandi.
              </p>
              <div className="pt-2 space-y-2">
                <Link
                  href="/lupa-password"
                  className="btn btn-primary w-full text-xs sm:text-sm justify-center flex items-center gap-2"
                >
                  Ajukan Ulang Reset Kata Sandi
                  <ArrowRight size={15} />
                </Link>
                <Link
                  href="/masuk"
                  className="btn btn-ghost w-full text-xs text-slate-600 hover:text-slate-900 justify-center"
                >
                  Kembali ke Halaman Masuk
                </Link>
              </div>
            </div>
          ) : successMsg ? (
            <div className="space-y-5 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-100">
                <CheckCircle2 size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">Kata Sandi Berhasil Diperbarui!</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{successMsg}</p>
                <p className="text-[11px] text-slate-400">Mengalihkan ke halaman masuk dalam 3 detik...</p>
              </div>
              <div className="pt-2">
                <Link
                  href="/masuk"
                  className="btn btn-primary w-full text-xs sm:text-sm justify-center flex items-center gap-2"
                >
                  Masuk Sekarang
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-xs text-blue-800">
                <ShieldCheck size={16} className="text-blue-600 flex-shrink-0" />
                <span>Sesi terverifikasi. Silakan masukkan kata sandi baru.</span>
              </div>

              {errorMsg && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <div>{errorMsg}</div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Kata Sandi Baru (Minimal 6 Karakter)
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Konfirmasi Kata Sandi Baru
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 btn btn-primary py-2.5 text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? "Menyimpan..." : "Simpan Kata Sandi Baru"}
                <ArrowRight size={16} />
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link href="/masuk" className="text-xs text-slate-500 hover:text-slate-700">
            ← Kembali ke Halaman Masuk
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-slate-400 text-sm">Memuat halaman reset kata sandi...</div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
