"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppFAB from "@/components/layout/WhatsAppFAB";
import {
  Plus,
  Clock,
  CheckCircle2,
  MapPin,
  ArrowRight,
  LogOut,
  Star,
  User,
  ShoppingBag,
  AlertCircle,
  RefreshCw,
  Phone,
} from "lucide-react";
import { formatRupiah } from "@/lib/pricing/calculateFare";
import type { Order } from "@/types";
import { createClient } from "@/lib/supabase/client";

const statusLabel: Record<string, string> = {
  pending: "Menunggu Driver",
  assigned: "Driver Ditemukan",
  on_the_way: "Dalam Perjalanan",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

const statusBadge: Record<string, string> = {
  pending: "badge badge-yellow",
  assigned: "badge badge-blue",
  on_the_way: "badge badge-blue",
  completed: "badge badge-green",
  cancelled: "bg-red-100 text-red-700 text-[11px] font-bold px-2 py-0.5 rounded-full",
};

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [userName, setUserName] = useState("Pengguna");
  const [userPhone, setUserPhone] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const fetchLiveData = useCallback(async () => {
    try {
      // Fetch profile
      const profileRes = await fetch("/api/profile");
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        if (profileData.profile) {
          setUserName(profileData.profile.full_name || "Pengguna");
          setUserPhone(profileData.profile.phone || "");
          setUserEmail(profileData.email || "");
          setIsLive(true);
        }
      }

      // Fetch orders
      const ordersRes = await fetch("/api/customer/orders");
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData.orders || []);
        return true;
      }
    } catch {}
    return false;
  }, []);

  useEffect(() => {
    const init = async () => {
      const ok = await fetchLiveData();
      if (!ok) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/masuk");
          return;
        }
      }
      setIsLoading(false);
    };
    init();
  }, [fetchLiveData, router]);

  const activeOrders = orders.filter((o) =>
    ["pending", "assigned", "on_the_way"].includes(o.status)
  );

  const historyOrders = orders.filter((o) =>
    ["completed", "cancelled"].includes(o.status)
  );

  const displayedOrders = activeTab === "active" ? activeOrders : historyOrders;

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error(err);
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("anjem_role");
      localStorage.removeItem("anjem_user");
    }
    router.push("/masuk");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 pt-6 pb-16">
        <div className="container-main max-w-4xl mx-auto">
          {/* Greeting Header */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-blue-500/20">
                {userName
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="badge badge-blue text-[11px]">Akun Pelanggan Kampus</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Halo, {userName}!
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {userPhone ? `📱 ${userPhone}` : ""}{userEmail ? (userPhone ? " · " : "") + `✉️ ${userEmail}` : ""}
                  {!userPhone && !userEmail ? "Selamat datang di Anjem UIN." : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/pesan" className="btn btn-primary text-xs flex items-center gap-1.5">
                <Plus size={14} />
                Pesan Sekarang
              </Link>
              <button
                onClick={handleLogout}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                title="Keluar"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm text-center">
              <div className="text-2xl font-extrabold text-blue-600">
                {isLoading ? "—" : orders.length}
              </div>
              <div className="text-xs text-slate-500 font-semibold mt-1">Total Pesanan</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm text-center">
              <div className="text-2xl font-extrabold text-emerald-600">
                {isLoading ? "—" : historyOrders.filter((o) => o.status === "completed").length}
              </div>
              <div className="text-xs text-slate-500 font-semibold mt-1">Pesanan Selesai</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm text-center">
              <div className="text-2xl font-extrabold text-amber-500">
                {isLoading ? "—" : activeOrders.length}
              </div>
              <div className="text-xs text-slate-500 font-semibold mt-1">Pesanan Aktif</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6 max-w-xs">
            <button
              onClick={() => setActiveTab("active")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "active"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Aktif ({activeOrders.length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "history"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Riwayat ({historyOrders.length})
            </button>
          </div>

          {/* Order List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="animate-spin text-blue-600 mr-3" size={22} />
              <span className="text-sm text-slate-500">Memuat pesanan...</span>
            </div>
          ) : displayedOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-200/90 shadow-sm text-center">
              <ShoppingBag size={40} className="text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-semibold mb-1">
                {activeTab === "active" ? "Tidak ada pesanan aktif" : "Belum ada riwayat"}
              </p>
              <p className="text-xs text-slate-400 mb-6">
                {activeTab === "active"
                  ? "Buat pesanan baru sekarang dan nikmati layanan Anjem UIN!"
                  : "Riwayat perjalananmu akan tampil di sini setelah pesanan selesai."}
              </p>
              <Link href="/pesan" className="btn btn-primary text-xs inline-flex items-center gap-1.5">
                <Plus size={14} />
                Buat Pesanan Pertama
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-slate-400">
                          {order.id}
                        </span>
                        <span className={statusBadge[order.status] || "badge badge-blue"}>
                          {statusLabel[order.status] || order.status}
                        </span>
                      </div>
                      <p className="text-sm font-extrabold text-slate-900">
                        {order.service_name || "Antar Jemput Motor"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-extrabold text-blue-600">
                        {formatRupiah(order.fare)}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {order.payment_method === "cash" ? "Tunai" : "QRIS"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-start gap-2 text-xs text-slate-600">
                      <MapPin size={13} className="text-blue-500 flex-shrink-0 mt-0.5" />
                      <span className="truncate">{order.pickup_name}</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-slate-600">
                      <MapPin size={13} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="truncate">{order.dropoff_name}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400">
                      {new Date(order.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <Link
                      href={`/order/${order.id}`}
                      className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      Lihat Detail
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
      <WhatsAppFAB />
    </div>
  );
}
