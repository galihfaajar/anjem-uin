"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import {
  Bike,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function DaftarForm() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const [accountType, setAccountType] = useState<"customer" | "driver">("customer");


  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [plateNumber, setPlateNumber] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const supabase = createClient();

      // Daftar ke Supabase auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            role: accountType,
            vehicle_type: vehicleType || undefined,
            plate_number: plateNumber || undefined,
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      // Jika driver, buat record drivers juga (trigger mungkin belum selesai)
      if (accountType === "driver" && data.user) {
        // Tunggu sebentar agar trigger profile selesai
        await new Promise((r) => setTimeout(r, 1500));
        
        // Coba insert driver record (jika trigger belum membuatnya)
        try {
          await supabase.from("drivers").insert({
            profile_id: data.user.id,
            plate_number: plateNumber || "-",
            vehicle_type: vehicleType || "Motor",
            status: "pending",
          });
        } catch { /* Ignore if already exists */ }
      }

      if (data.session) {
        // Langsung login — redirect ke halaman yang diminta
        setSuccessMsg("Pendaftaran berhasil! Mengalihkan...");
        setTimeout(() => {
          router.push(accountType === "driver" ? "/driver" : redirectTo);
        }, 1000);

      } else {
        // Email verification required
        setSuccessMsg(
          accountType === "driver"
            ? "Pendaftaran berhasil! Cek email untuk verifikasi akun. Setelah itu, tunggu persetujuan admin."
            : "Pendaftaran berhasil! Cek email untuk verifikasi akun, lalu masuk ke dashboard."
        );
      }
    } catch (err) {
      setErrorMsg("Gagal melakukan pendaftaran. Coba lagi.");
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
          Buat Akun Baru
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Sudah punya akun?{" "}
          <Link href={`/masuk?redirect=${encodeURIComponent(redirectTo)}`} className="font-semibold text-blue-600 hover:text-blue-500">
            Masuk di sini
          </Link>
        </p>

      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/90 rounded-2xl sm:px-10">
          {/* Account Type Toggle */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => setAccountType("customer")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                accountType === "customer"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              👤 Pelanggan / Mahasiswa
            </button>
            <button
              type="button"
              onClick={() => setAccountType("driver")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                accountType === "driver"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🛵 Daftar Jadi Driver
            </button>
          </div>

          {accountType === "driver" && (
            <div className="mb-5 p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
              <div className="font-bold mb-1 flex items-center gap-1.5">
                <ShieldCheck size={15} />
                Pemberitahuan Pendaftaran Driver:
              </div>
              <p className="text-[11px] leading-relaxed">
                Akun driver akan berstatus <code>pending</code> hingga diverifikasi oleh tim admin
                Anjem UIN. Driver tidak dapat menerima order sebelum disetujui.
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 bg-green-50 border border-green-200 rounded-xl flex items-start gap-2 text-xs text-green-700">
              <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
              <div>{successMsg}</div>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Lengkap
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama lengkap Anda"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nomor WhatsApp / HP Aktif
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

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
                  placeholder="email@kampus.ac.id"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {accountType === "driver" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Jenis Motor & Tahun
                  </label>
                  <input
                    type="text"
                    required
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    placeholder="Contoh: Honda Vario 125 (2022)"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nomor Plat Kendaraan
                  </label>
                  <input
                    type="text"
                    required
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    placeholder="Contoh: AD 1234 XY"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kata Sandi (Minimal 6 Karakter)
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
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
              className="w-full mt-4 btn btn-primary py-2.5 text-sm flex items-center justify-center gap-2"
            >
              {loading
                ? "Mendaftarkan..."
                : accountType === "driver"
                ? "Kirim Permohonan Mitra Driver"
                : "Daftar Akun Pelanggan"}
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="mt-4 text-[11px] text-slate-400 text-center">
            Dengan mendaftar, Anda menyetujui{" "}
            <Link href="/syarat" className="text-blue-600 hover:underline">
              Ketentuan Layanan
            </Link>{" "}
            dan{" "}
            <Link href="/privasi" className="text-blue-600 hover:underline">
              Kebijakan Privasi
            </Link>{" "}
            Anjem UIN.
          </p>
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

export default function DaftarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-slate-400 text-sm">Memuat halaman...</div></div>}>
      <DaftarForm />
    </Suspense>
  );
}
