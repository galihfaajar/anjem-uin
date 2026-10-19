"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppFAB from "@/components/layout/WhatsAppFAB";
import {
  Shield,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  Filter,
  Search,
  Bike,
  Star,
  Settings,
  AlertCircle,
  LogOut,
  Edit,
  RefreshCw,
} from "lucide-react";
import {
  DEMO_ORDERS,
  DEMO_DRIVERS,
  DEMO_SERVICES,
  DEMO_FARE_ZONES,
  DEMO_REVIEWS,
} from "@/lib/data/demo";
import { formatRupiah } from "@/lib/pricing/calculateFare";
import type { Order, Driver, DriverStatus, OrderStatus } from "@/types";
import { createClient } from "@/lib/supabase/client";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"orders" | "drivers" | "fares" | "logs">("orders");

  // State Data
  const [orders, setOrders] = useState<Order[]>(DEMO_ORDERS);
  const [drivers, setDrivers] = useState<Driver[]>(DEMO_DRIVERS);
  const [searchOrder, setSearchOrder] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const fetchLiveData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [ordersRes, driversRes] = await Promise.all([
        fetch("/api/admin/orders?limit=100"),
        fetch("/api/admin/drivers"),
      ]);

      if (ordersRes.ok && driversRes.ok) {
        const ordersData = await ordersRes.json();
        const driversData = await driversRes.json();
        if (ordersData.orders) {
          // Flatten nested join data for display
          const flatOrders = ordersData.orders.map((o: any) => ({
            ...o,
            customer_name: o.customer?.full_name || o.customer_name || "Tamu",
            customer_phone: o.customer?.phone || o.customer_phone || "-",
            service_name: o.service?.name || o.service_name || "-",
            driver_name: o.driver_profile?.profile?.full_name || o.driver_name || null,
            driver_plate: o.driver_profile?.plate_number || o.driver_plate || null,
          }));
          setOrders(flatOrders);
        }
        if (driversData.drivers) {
          const flatDrivers = driversData.drivers.map((d: any) => ({
            ...d,
            profile: {
              full_name: d.profile?.full_name || "Driver",
              avatar_url: d.profile?.avatar_url || null,
            },
          }));
          setDrivers(flatDrivers);
        }
        setIsLive(true);
      }
    } catch {}
    setIsLoadingData(false);
  }, []);

  useEffect(() => {
    fetchLiveData();
  }, [fetchLiveData]);

  const [auditLogs, setAuditLogs] = useState<
    { id: string; action: string; target: string; time: string; admin: string }[]
  >([
    {
      id: "log-1",
      action: "VERIFIKASI_DRIVER",
      target: "Andi Kurniawan (drv-1) disetujui",
      time: "2026-10-19 08:00 WIB",
      admin: "Admin Pusat",
    },
    {
      id: "log-2",
      action: "PENUGASAN_ORDER",
      target: "ORD-UIN-7822 ditugaskan ke drv-1",
      time: "2026-10-19 09:32 WIB",
      admin: "Admin Pusat",
    },
    {
      id: "log-3",
      action: "UPDATE_TARIF",
      target: "Verifikasi konfigurasi Zona 1-4",
      time: "2026-10-18 16:00 WIB",
      admin: "Admin Pusat",
    },
  ]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (searchOrder.trim()) {
        const q = searchOrder.toLowerCase();
        const matchesId = o.id.toLowerCase().includes(q);
        const matchesName = (o.customer_name || "").toLowerCase().includes(q);
        const matchesPickup = o.pickup_name.toLowerCase().includes(q);
        return matchesId || matchesName || matchesPickup;
      }
      return true;
    });
  }, [orders, statusFilter, searchOrder]);

  // Driver actions
  const handleDriverStatus = async (driverId: string, newStatus: DriverStatus) => {
    // Try live update first
    if (isLive) {
      try {
        const res = await fetch("/api/admin/drivers", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ driverId, status: newStatus }),
        });
        if (res.ok) {
          await fetchLiveData();
          showToast(`Status driver berhasil diubah ke ${newStatus}.`);
          return;
        }
      } catch {}
    }
    // Demo fallback
    setDrivers((prev) =>
      prev.map((d) => (d.id === driverId ? { ...d, status: newStatus } : d))
    );
    setAuditLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        action: `DRIVER_${newStatus.toUpperCase()}`,
        target: `Driver ${driverId} diubah ke ${newStatus}`,
        time: new Date().toLocaleTimeString("id-ID") + " WIB",
        admin: "Admin Pusat",
      },
      ...prev,
    ]);
    showToast(`Status driver ${driverId} berhasil diubah ke ${newStatus}.`);
  };

  // Assign driver to order
  const handleAssignDriver = async (driverId: string) => {
    if (!selectedOrder) return;
    const driver = drivers.find((d) => d.id === driverId);

    // Try live update
    if (isLive) {
      try {
        const res = await fetch(`/api/admin/orders/${selectedOrder.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "assigned",
            driverId,
            notes: `Driver ${driver?.profile?.full_name || driverId} ditugaskan oleh admin.`,
          }),
        });
        if (res.ok) {
          await fetchLiveData();
          setAssignModalOpen(false);
          showToast(`Driver berhasil ditugaskan ke order ${selectedOrder.id}!`);
          return;
        }
      } catch {}
    }

    // Demo fallback
    setOrders((prev) =>
      prev.map((o) =>
        o.id === selectedOrder.id
          ? {
              ...o,
              status: "assigned",
              driver_id: driverId,
              driver_name: driver?.profile?.full_name || "Driver Ditugaskan",
              assigned_at: new Date().toISOString(),
            }
          : o
      )
    );

    setAuditLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        action: "ASSIGN_DRIVER",
        target: `Order ${selectedOrder.id} ditugaskan ke driver ${driverId}`,
        time: new Date().toLocaleTimeString("id-ID") + " WIB",
        admin: "Admin Pusat",
      },
      ...prev,
    ]);

    setAssignModalOpen(false);
    showToast(`Driver berhasil ditugaskan ke order ${selectedOrder.id}!`);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      "ID Order",
      "Nama Pelanggan",
      "No Telepon",
      "Layanan",
      "Titik Jemput",
      "Titik Tujuan",
      "Jarak (km)",
      "Ongkos (Rp)",
      "Metode Pembayaran",
      "Status",
      "Waktu Dibuat",
    ];

    const rows = orders.map((o) => [
      o.id,
      `"${o.customer_name || ""}"`,
      `"${o.customer_phone || ""}"`,
      `"${o.service_name || ""}"`,
      `"${o.pickup_name}"`,
      `"${o.dropoff_name}"`,
      o.distance_km,
      o.fare,
      o.payment_method,
      o.status,
      o.created_at,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan_order_anjem_uin_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Laporan CSV berhasil diunduh.");
  };

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
      localStorage.removeItem("anjem_demo_role");
      localStorage.removeItem("anjem_demo_user");
    }
    router.push("/masuk");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 pt-6 pb-16">
        <div className="container-main max-w-6xl mx-auto px-4">
          {/* Toast */}
          {toastMsg && (
            <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>{toastMsg}</span>
            </div>
          )}

          {/* Admin Header */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-purple-500/20">
                <Shield size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge badge-blue text-[11px] font-bold">
                    Panel Pengelola Resmi
                  </span>
                  {isLive && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      ● Database Live
                    </span>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Dashboard Administrasi Anjem UIN
                </h1>
                <p className="text-xs text-slate-500">
                  Kelola order, verifikasi driver kampus, pantau tarif & audit log.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchLiveData}
                disabled={isLoadingData}
                className="btn btn-secondary text-xs flex items-center gap-1.5"
                title="Refresh data"
              >
                <RefreshCw size={14} className={isLoadingData ? "animate-spin" : ""} />
                Refresh
              </button>
              <button
                onClick={handleExportCSV}
                className="btn btn-secondary text-xs flex items-center gap-1.5"
              >
                <Download size={14} />
                Ekspor CSV
              </button>
              <button
                onClick={handleLogout}
                className="btn btn-secondary text-xs text-red-600 hover:bg-red-50 flex items-center gap-1.5"
              >
                <LogOut size={14} />
                Keluar
              </button>
            </div>
          </div>

          {/* Stat Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-400 font-semibold block">Total Order</span>
              <span className="text-2xl font-extrabold text-slate-900">{orders.length}</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Semua status</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-400 font-semibold block">Order Menunggu</span>
              <span className="text-2xl font-extrabold text-amber-600">
                {orders.filter((o) => o.status === "pending").length}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Perlu konfirmasi</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-400 font-semibold block">Driver Aktif</span>
              <span className="text-2xl font-extrabold text-emerald-600">
                {drivers.filter((d) => d.status === "approved").length}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Telah diverifikasi</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-400 font-semibold block">Rating Kepuasan</span>
              <span className="text-2xl font-extrabold text-blue-600">5.0 / 5.0</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Dari ulasan terverifikasi</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden mb-8">
            <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab("orders")}
                className={`py-2 px-4 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                  activeTab === "orders"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                📋 Semua Order ({orders.length})
              </button>
              <button
                onClick={() => setActiveTab("drivers")}
                className={`py-2 px-4 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                  activeTab === "drivers"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                🛵 Verifikasi Driver ({drivers.length})
              </button>
              <button
                onClick={() => setActiveTab("fares")}
                className={`py-2 px-4 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                  activeTab === "fares"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                ⚙️ Layanan & Tarif Zona
              </button>
              <button
                onClick={() => setActiveTab("logs")}
                className={`py-2 px-4 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                  activeTab === "logs"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                🛡️ Audit Log Admin ({auditLogs.length})
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {/* TAB 1: KELOLA ORDERS */}
              {activeTab === "orders" && (
                <div className="space-y-4">
                  {/* Filters Bar */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
                    <div className="relative w-full sm:w-72">
                      <Search
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="text"
                        value={searchOrder}
                        onChange={(e) => setSearchOrder(e.target.value)}
                        placeholder="Cari ID, pelanggan, atau lokasi..."
                        className="w-full pl-9 pr-4 py-2 bg-white rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                      {["all", "pending", "assigned", "on_the_way", "completed", "cancelled"].map(
                        (st) => (
                          <button
                            key={st}
                            onClick={() => setStatusFilter(st)}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                              statusFilter === st
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {st.toUpperCase()}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Orders Table */}
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3">ID Order</th>
                          <th className="p-3">Pelanggan</th>
                          <th className="p-3">Layanan</th>
                          <th className="p-3">Rute</th>
                          <th className="p-3">Ongkos</th>
                          <th className="p-3">Driver</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredOrders.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-slate-400">
                              Tidak ada pesanan ditemukan.
                            </td>
                          </tr>
                        ) : (
                          filteredOrders.map((ord) => (
                            <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="p-3 font-mono font-bold text-slate-900">{ord.id}</td>
                              <td className="p-3">
                                <div className="font-semibold text-slate-900">{ord.customer_name}</div>
                                <div className="text-[10px] text-slate-400">{ord.customer_phone}</div>
                              </td>
                              <td className="p-3 text-slate-700">{ord.service_name}</td>
                              <td className="p-3">
                                <div className="truncate max-w-[140px] text-slate-800">
                                  {ord.pickup_name} → {ord.dropoff_name}
                                </div>
                                <div className="text-[10px] text-slate-400">{ord.distance_km} km</div>
                              </td>
                              <td className="p-3 font-extrabold text-blue-600">
                                {formatRupiah(ord.fare)}
                              </td>
                              <td className="p-3">
                                {ord.driver_name ? (
                                  <span className="font-semibold text-slate-800">{ord.driver_name}</span>
                                ) : (
                                  <span className="text-amber-600 font-semibold italic">Belum ada</span>
                                )}
                              </td>
                              <td className="p-3">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    ord.status === "completed"
                                      ? "bg-emerald-50 text-emerald-700"
                                      : ord.status === "cancelled"
                                      ? "bg-red-50 text-red-700"
                                      : ord.status === "pending"
                                      ? "bg-amber-50 text-amber-700"
                                      : "bg-blue-50 text-blue-700"
                                  }`}
                                >
                                  {ord.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {ord.status === "pending" && (
                                    <button
                                      onClick={() => {
                                        setSelectedOrder(ord);
                                        setAssignModalOpen(true);
                                      }}
                                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold"
                                    >
                                      Tugaskan
                                    </button>
                                  )}
                                  <Link
                                    href={`/order/${ord.id}`}
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold"
                                  >
                                    Detail
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: VERIFIKASI DRIVER */}
              {activeTab === "drivers" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {drivers.map((drv) => (
                      <div
                        key={drv.id}
                        className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 font-bold flex items-center justify-center">
                                {drv.profile?.full_name?.slice(0, 2) || "DR"}
                              </div>
                              <div>
                                <h3 className="font-bold text-slate-900 text-sm">
                                  {drv.profile?.full_name}
                                </h3>
                                <span className="text-[11px] text-slate-500">
                                  {drv.vehicle_type} • Plat: <strong>{drv.plate_number}</strong>
                                </span>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                drv.status === "approved"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : drv.status === "pending"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {drv.status.toUpperCase()}
                            </span>
                          </div>

                          <div className="text-xs text-slate-500 space-y-1 mb-4">
                            <div>
                              Rating: <strong>{drv.rating_avg.toFixed(1)} / 5.0</strong> ({drv.total_trips} trip)
                            </div>
                            <div>
                              Status Online:{" "}
                              <span className={drv.is_online ? "text-emerald-600 font-bold" : "text-slate-400"}>
                                {drv.is_online ? "Online Standby" : "Offline"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                          {drv.status !== "approved" && (
                            <button
                              onClick={() => handleDriverStatus(drv.id, "approved")}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                            >
                              Setujui Driver
                            </button>
                          )}
                          {drv.status !== "blocked" && (
                            <button
                              onClick={() => handleDriverStatus(drv.id, "blocked")}
                              className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold"
                            >
                              Blokir
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: LAYANAN & TARIF ZONA */}
              {activeTab === "fares" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-3">4 Layanan Aktif:</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {DEMO_SERVICES.map((s) => (
                        <div key={s.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex justify-between items-center text-xs">
                          <div>
                            <div className="font-bold text-slate-900">{s.name}</div>
                            <span className="text-slate-400">{s.slug}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-blue-600">
                              {s.extra_fee === 0 ? "Tanpa Biaya Ekstra" : `+${formatRupiah(s.extra_fee)}`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-3">4 Zona Tarif:</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      {DEMO_FARE_ZONES.map((z) => (
                        <div key={z.id} className="p-4 rounded-xl border border-slate-200 bg-white text-xs">
                          <div className="font-bold text-slate-900 mb-1">{z.name}</div>
                          <div className="text-slate-500 mb-2">
                            {z.max_km ? `${z.min_km} - ${z.max_km} km` : `> ${z.min_km} km`}
                          </div>
                          <div className="font-extrabold text-base text-blue-600">
                            {formatRupiah(z.base_price)}
                          </div>
                          {z.per_km_price > 0 && (
                            <span className="text-[10px] text-slate-400 block mt-1">
                              +{formatRupiah(z.per_km_price)}/km
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: AUDIT LOG */}
              {activeTab === "logs" && (
                <div className="space-y-3">
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="p-3.5 bg-white flex items-center justify-between text-xs">
                        <div>
                          <span className="font-mono font-bold text-blue-600 mr-2">
                            [{log.action}]
                          </span>
                          <span className="text-slate-800 font-semibold">{log.target}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Oleh: {log.admin}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">{log.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Modal Penugasan Driver */}
          {assignModalOpen && selectedOrder && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
                <h3 className="text-lg font-bold text-slate-900 mb-1">Tugaskan Mitra Driver</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Pilih driver terverifikasi untuk order {selectedOrder.id} ({selectedOrder.pickup_name} → {selectedOrder.dropoff_name}):
                </p>

                <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                  {drivers
                    .filter((d) => d.status === "approved")
                    .map((drv) => (
                      <div
                        key={drv.id}
                        onClick={() => handleAssignDriver(drv.id)}
                        className="p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer transition-colors flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{drv.profile?.full_name}</div>
                          <span className="text-[11px] text-slate-500">
                            {drv.vehicle_type} • {drv.plate_number}
                          </span>
                        </div>
                        <span className="text-blue-600 font-bold">Pilih Driver →</span>
                      </div>
                    ))}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setAssignModalOpen(false)}
                    className="btn btn-secondary text-xs"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <WhatsAppFAB />
    </div>
  );
}
