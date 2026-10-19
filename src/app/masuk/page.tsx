"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Bike, Mail, Lock, ArrowRight, ShieldCheck, UserCheck, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";



function MasukForm() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      // Fetch role from profiles table
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
          // Customer: respect redirect param if present
          router.push(redirectTo || "/dashboard");
        }
      } else {
        router.push(redirectTo || "/dashboard");

      }
    } catch (err) {
      setErrorMsg("Gagal menghubungi server autentikasi.");
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
          Masuk ke Akun Anda
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Belum punya akun?{" "}
          <Link href={redirectTo ? `/daftar?redirect=${encodeURIComponent(redirectTo)}` : "/daftar"} className="font-semibold text-blue-600 hover:text-blue-500">
            Daftar sekarang
          </Link>
        </p>

      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/90 rounded-2xl sm:px-10">
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Kata Sandi
                </label>
                <Link href="/lupa-password" className="text-[11px] font-semibold text-blue-600 hover:text-blue-500">
                  Lupa sandi?
                </Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 btn btn-primary py-2.5 text-sm flex items-center justify-center gap-2"
            >
              {loading ? "Memeriksa..." : "Masuk"}
              <ArrowRight size={16} />
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-700">
            ← Kembali ke Halaman Utama
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function MasukPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-slate-400 text-sm">Memuat halaman...</div></div>}>
      <MasukForm />
    </Suspense>
  );
}
