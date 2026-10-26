"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bike,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function GoogleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

interface AuthSliderCardProps {
  initialMode?: "masuk" | "daftar";
}

export default function AuthSliderCard({ initialMode = "masuk" }: AuthSliderCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || null;
  const errorParam = searchParams.get("error");

  // State mode slider (false = Masuk / Sign In, true = Daftar / Sign Up)
  const [isSignUp, setIsSignUp] = useState(initialMode === "daftar");

  // State Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // State Register
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPass, setShowRegPass] = useState(false);
  const [showRegConfirmPass, setShowRegConfirmPass] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");

  // State Google OAuth
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (errorParam) {
      setLoginError(decodeURIComponent(errorParam));
    }
  }, [errorParam]);

  // Handle Login Submit
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        setLoginError(error.message);
        setLoginLoading(false);
        return;
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, full_name")
          .eq("id", data.user.id)
          .maybeSingle();

        const role = profile?.role || data.user.user_metadata?.role || "customer";
        const fullName =
          profile?.full_name ||
          data.user.user_metadata?.full_name ||
          data.user.email?.split("@")[0] ||
          "User";

        if (typeof window !== "undefined") {
          localStorage.setItem("anjem_role", role);
          localStorage.setItem(
            "anjem_user",
            JSON.stringify({ id: data.user.id, name: fullName, role })
          );
        }

        if (role === "admin") {
          router.push("/admin");
        } else if (role === "driver") {
          router.push("/driver");
        } else {
          router.push(redirectTo || "/dashboard");
        }
      } else {
        router.push(redirectTo || "/dashboard");
      }
    } catch {
      setLoginError("Gagal menghubungi server autentikasi.");
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Register Submit
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");

    if (regPassword.length < 6) {
      setRegError("Kata sandi minimal 6 karakter.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setRegLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
        options: {
          data: {
            full_name: regName,
            phone: regPhone,
            role: "customer",
          },
        },
      });

      if (error) {
        setRegError(error.message);
        setRegLoading(false);
        return;
      }

      if (data.session) {
        setRegSuccess("Pendaftaran berhasil! Mengalihkan...");
        setTimeout(() => {
          router.push(redirectTo || "/dashboard");
        }, 1000);
      } else {
        setRegSuccess("Pendaftaran berhasil! Silakan cek email untuk verifikasi, lalu masuk.");
      }
    } catch {
      setRegError("Gagal melakukan pendaftaran. Silakan coba lagi.");
    } finally {
      setRegLoading(false);
    }
  };

  // Handle Google OAuth Login / Register
  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    setLoginError("");
    setRegError("");
    try {
      const supabase = createClient();
      const redirectUrl = `${window.location.origin}/auth/callback${
        redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ""
      }`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });

      if (error) {
        setLoginError(error.message);
        setGoogleLoading(false);
      }
    } catch {
      setLoginError("Gagal menghubungi layanan Google.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center py-8 px-4 sm:px-6">
      {/* Brand Header */}
      <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black group-hover:scale-105 transition-transform shadow-md shadow-blue-500/20">
          <Bike size={22} />
        </div>
        <span className="text-2xl font-black text-slate-900 tracking-tight">
          Anjem<span className="text-blue-600">UIN</span>
        </span>
      </Link>

      {/* Main Double Slider Card Container */}
      <div className="relative w-full max-w-4xl min-h-[640px] sm:min-h-[680px] sm:h-[680px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80">
        
        {/* Toggle Pills untuk Mobile (tampil hanya di layar kecil) */}
        <div className="sm:hidden p-3 bg-slate-50 border-b border-slate-100">
          <div className="grid grid-cols-2 p-1 bg-slate-200/70 rounded-2xl">
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                !isSignUp
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                isSignUp
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Daftar Baru
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 1. FORM MASUK / SIGN IN (Sisi Kiri di Desktop) */}
        {/* ============================================================ */}
        <div
          className={`w-full sm:w-1/2 sm:absolute sm:top-0 sm:left-0 sm:h-full flex flex-col justify-center px-6 sm:px-12 py-8 sm:py-10 transition-all duration-700 ease-in-out ${
            isSignUp
              ? "sm:opacity-0 sm:pointer-events-none hidden sm:flex sm:translate-x-0"
              : "opacity-100 z-10 translate-x-0"
          }`}
        >
          <div className="max-w-sm mx-auto w-full">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight text-center sm:text-left">
              Masuk ke Akun
            </h2>
            <p className="mt-1 text-xs text-slate-500 text-center sm:text-left">
              Pilih metode masuk untuk melanjutkan
            </p>

            {loginError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={googleLoading || loginLoading}
              className="w-full mt-5 py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer disabled:opacity-60"
            >
              <GoogleIcon className="w-4 h-4 flex-shrink-0" />
              <span>{googleLoading ? "Menghubungkan Google..." : "Masuk dengan Google"}</span>
            </button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[11px]">
                <span className="bg-white px-2.5 text-slate-400 font-medium">
                  atau masuk dengan email
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-normal text-slate-500 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-normal text-slate-500">
                    Kata Sandi
                  </label>
                  <Link
                    href="/lupa-password"
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-500"
                  >
                    Lupa sandi?
                  </Link>
                </div>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading || googleLoading}
                className="w-full mt-2 py-3 px-4 bg-[#0066FF] hover:bg-blue-600 active:scale-[0.99] text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-60"
              >
                <span>{loginLoading ? "Memeriksa..." : "MASUK SEKARANG"}</span>
                <ArrowRight size={15} />
              </button>
            </form>

            {/* Mobile helper to switch */}
            <p className="sm:hidden mt-5 text-center text-xs text-slate-500">
              Belum punya akun?{" "}
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className="font-bold text-blue-600 hover:underline"
              >
                Daftar sekarang
              </button>
            </p>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. FORM DAFTAR / SIGN UP (Sisi Kanan di Desktop) */}
        {/* ============================================================ */}
        <div
          className={`w-full sm:w-1/2 sm:absolute sm:top-0 sm:right-0 h-full flex flex-col justify-center px-6 sm:px-12 py-8 sm:py-8 transition-all duration-700 ease-in-out ${
            isSignUp
              ? "opacity-100 z-10 translate-x-0"
              : "sm:opacity-0 sm:pointer-events-none hidden sm:flex sm:translate-x-0"
          }`}
        >
          <div className="max-w-sm mx-auto w-full">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight text-center sm:text-left">
              Buat Akun Baru
            </h2>
            <p className="mt-1 text-xs text-slate-500 text-center sm:text-left">
              Daftar akun gratis untuk layanan antar-jemput & jastip
            </p>

            {regError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                <span>{regError}</span>
              </div>
            )}

            {regSuccess && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl flex items-start gap-2 text-xs text-green-700">
                <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5" />
                <span>{regSuccess}</span>
              </div>
            )}

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={googleLoading || regLoading}
              className="w-full mt-3.5 py-2 px-4 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer disabled:opacity-60"
            >
              <GoogleIcon className="w-4 h-4 flex-shrink-0" />
              <span>{googleLoading ? "Menghubungkan..." : "Daftar Cepat dengan Google"}</span>
            </button>

            {/* Divider */}
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[11px]">
                <span className="bg-white px-2.5 text-slate-400 font-medium">
                  atau isi data manual
                </span>
              </div>
            </div>

            {/* Register Form — Tatanan Clean Sesuai Desain Referensi */}
            <form onSubmit={handleRegister} className="space-y-2.5">
              {/* Row 1: Nama Lengkap */}
              <div>
                <label className="block text-xs font-normal text-slate-500 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Alex Parkinson"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Row 2: Email */}
              <div>
                <label className="block text-xs font-normal text-slate-500 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Row 3: Nomor WhatsApp */}
              <div>
                <label className="block text-xs font-normal text-slate-500 mb-1">
                  Nomor WhatsApp
                </label>
                <input
                  type="tel"
                  required
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Row 4: Kata Sandi & Konfirmasi Sandi berdampingan */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-normal text-slate-500 mb-1">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPass ? "text" : "password"}
                      required
                      minLength={6}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-3.5 pr-7 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPass(!showRegPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={showRegPass ? "Sembunyikan" : "Lihat"}
                    >
                      {showRegPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-normal text-slate-500 mb-1">
                    Konfirmasi Sandi
                  </label>
                  <div className="relative">
                    <input
                      type={showRegConfirmPass ? "text" : "password"}
                      required
                      minLength={6}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-3.5 pr-7 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPass(!showRegConfirmPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={showRegConfirmPass ? "Sembunyikan" : "Lihat"}
                    >
                      {showRegConfirmPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Button: Gaya GET STARTED -> */}
              <button
                type="submit"
                disabled={regLoading || googleLoading}
                className="w-full mt-3 py-2.5 px-4 bg-[#0066FF] hover:bg-blue-600 active:scale-[0.99] text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-60"
              >
                <span>{regLoading ? "Mendaftarkan..." : "DAFTAR SEKARANG"}</span>
                <ArrowRight size={15} />
              </button>
            </form>

            <p className="mt-2.5 text-[10px] text-slate-400 text-center leading-relaxed">
              Dengan mendaftar, Anda menyetujui Ketentuan Layanan & Kebijakan Privasi Anjem UIN.
            </p>

            {/* Mobile helper to switch */}
            <p className="sm:hidden mt-4 text-center text-xs text-slate-500">
              Sudah punya akun?{" "}
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className="font-bold text-blue-600 hover:underline"
              >
                Masuk di sini
              </button>
            </p>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 3. SLIDING OVERLAY CONTAINER (DESKTOP ANIMATION) */}
        {/* ============================================================ */}
        <div
          className={`hidden sm:block absolute top-0 left-0 w-1/2 h-full overflow-hidden transition-transform duration-700 ease-in-out z-20 ${
            isSignUp ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Inner 200% width sliding background */}
          <div
            className={`relative -left-full h-full w-[200%] transition-transform duration-700 ease-in-out bg-gradient-to-b from-[#1b3280] via-[#2d52cf] to-[#4363eb] text-white ${
              isSignUp ? "translate-x-1/2" : "translate-x-0"
            }`}
          >
            {/* Subtle background glow */}
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-400/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />

            {/* PANEL KIRI OVERLAY: Tampil saat isSignUp = true (Mengajak Masuk) */}
            <div
              className={`absolute top-0 left-0 w-1/2 h-full flex flex-col justify-between px-8 sm:px-10 py-10 transition-all duration-700 ${
                isSignUp
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-12 pointer-events-none"
              }`}
            >
              {/* Top Title */}
              <div className="w-full text-left">
                <h3 className="text-2xl sm:text-[28px] text-white tracking-tight leading-snug">
                  Sudah <span className="font-extrabold text-white">punya akun</span>?
                  <br />
                  Yuk, <span className="font-extrabold italic text-white">langsung masuk</span>.
                </h3>
              </div>

              {/* Center Animated Driver Illustration */}
              <div className="w-full flex items-center justify-center my-auto py-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/animasi-driver.svg"
                  alt="Animasi Driver Anjem UIN"
                  className="w-full max-w-[280px] sm:max-w-[320px] h-auto object-contain select-none pointer-events-none drop-shadow-md"
                />
              </div>

              {/* Bottom Copy & Button */}
              <div className="w-full text-left">
                <p className="text-xs sm:text-[13px] text-white/90 leading-relaxed font-normal mb-4">
                  Sudah terdaftar sebagai pelanggan? Masuk sekarang untuk melanjutkan perjalananmu.
                </p>
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className="w-full py-2.5 px-6 rounded-xl border border-white/60 bg-white/10 hover:bg-white/20 hover:border-white text-white font-semibold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 backdrop-blur-xs transition-all shadow-md cursor-pointer active:scale-95"
                >
                  <span>Masuk Sekarang</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>

            {/* PANEL KANAN OVERLAY: Tampil saat isSignUp = false (Mengajak Daftar — Persis Sesuai Gambar Referensi) */}
            <div
              className={`absolute top-0 right-0 w-1/2 h-full flex flex-col justify-between px-8 sm:px-10 py-10 transition-all duration-700 ${
                !isSignUp
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-12 pointer-events-none"
              }`}
            >
              {/* Top Title */}
              <div className="w-full text-left">
                <h3 className="text-2xl sm:text-[28px] text-white tracking-tight leading-snug">
                  Mau <span className="font-extrabold text-white">ke mana</span> hari ini?
                  <br />
                  Biar <span className="font-extrabold italic text-white">kami yang antar</span>.
                </h3>
              </div>

              {/* Center Animated Driver Illustration */}
              <div className="w-full flex items-center justify-center my-auto py-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/animasi-driver.svg"
                  alt="Animasi Driver Anjem UIN"
                  className="w-full max-w-[280px] sm:max-w-[320px] h-auto object-contain select-none pointer-events-none drop-shadow-md"
                />
              </div>

              {/* Bottom Copy & Button */}
              <div className="w-full text-left">
                <p className="text-xs sm:text-[13px] text-white/90 leading-relaxed font-normal mb-4">
                  Belum punya akun Anjem UIN? Bergabunglah sekarang untuk menikmati antar-jemput kampus yang aman, cepat, dan hemat.
                </p>
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className="w-full py-2.5 px-6 rounded-xl border border-white/60 bg-white/10 hover:bg-white/20 hover:border-white text-white font-semibold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 backdrop-blur-xs transition-all shadow-md cursor-pointer active:scale-95"
                >
                  <span>Daftar Sekarang</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Back to Home Link */}
      <div className="mt-6 text-center">
        <Link href="/" className="text-xs text-slate-500 hover:text-slate-800 transition-colors">
          ← Kembali ke Halaman Utama
        </Link>
      </div>
    </div>
  );
}
