"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
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
  FileSpreadsheet,
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
  Wallet,
  Calendar,
  Save,
  RotateCcw,
  Check,
  UtensilsCrossed,
  ShoppingBasket,
  Package,
  Trash2,
  MessageSquare,
  UserPlus,
  Eye,
  EyeOff,
  Phone,
  Mail,
  Lock,
} from "lucide-react";
import { formatRupiah } from "@/lib/pricing/calculateFare";
import { formatDate, buildWALink } from "@/lib/utils";
import type { Order, Driver, DriverStatus, OrderStatus, Service, FareZone } from "@/types";
import { createClient } from "@/lib/supabase/client";
import * as XLSX from "xlsx";

interface AdminReview {
  id: string;
  order_id: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
  service_name: string;
  customer_name: string;
  customer_phone: string;
  driver_name: string;
  driver_plate: string;
  route_summary?: string | null;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"orders" | "drivers" | "fares" | "logs" | "reviews">("orders");

  // Sinkronisasi activeTab dengan query param (?tab=fares dsb) & event navbar
  useEffect(() => {
    const handleUrlTab = () => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      const t = params.get("tab");
      if (t === "fares" || t === "drivers" || t === "orders" || t === "logs" || t === "reviews") {
        setActiveTab(t);
      } else if (!t) {
        setActiveTab("orders");
      }
    };

    handleUrlTab();
    window.addEventListener("popstate", handleUrlTab);
    window.addEventListener("admin_tab_change", handleUrlTab);
    return () => {
      window.removeEventListener("popstate", handleUrlTab);
      window.removeEventListener("admin_tab_change", handleUrlTab);
    };
  }, []);

  const handleTabChange = (tab: "orders" | "drivers" | "fares" | "logs" | "reviews") => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (tab === "orders") {
        url.searchParams.delete("tab");
      } else {
        url.searchParams.set("tab", tab);
      }
      window.history.pushState({}, "", url.toString());
      window.dispatchEvent(new Event("admin_tab_change"));
    }
  };

  // State Data
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [fareZones, setFareZones] = useState<FareZone[]>([]);
  const [searchOrder, setSearchOrder] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  }, []);

  // State Ulasan Pelanggan
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviewSearch, setReviewSearch] = useState("");
  const [reviewRatingFilter, setReviewRatingFilter] = useState<number | "all">("all");
  const [reviewToDelete, setReviewToDelete] = useState<AdminReview | null>(null);
  const [isDeletingReview, setIsDeletingReview] = useState(false);

  // State Pendaftaran & Kelola Mitra Driver oleh Admin
  const [driverSearch, setDriverSearch] = useState("");
  const [driverStatusFilter, setDriverStatusFilter] = useState<string>("all");
  const [addDriverModalOpen, setAddDriverModalOpen] = useState(false);
  const [newDriverName, setNewDriverName] = useState("");
  const [newDriverPhone, setNewDriverPhone] = useState("");
  const [newDriverEmail, setNewDriverEmail] = useState("");
  const [newDriverPassword, setNewDriverPassword] = useState("");
  const [newDriverVehicle, setNewDriverVehicle] = useState("");
  const [newDriverPlate, setNewDriverPlate] = useState("");
  const [newDriverStatus, setNewDriverStatus] = useState<"approved" | "pending">("approved");
  const [showDriverPassword, setShowDriverPassword] = useState(false);
  const [isSubmittingDriver, setIsSubmittingDriver] = useState(false);
  const [addDriverError, setAddDriverError] = useState("");

  const filteredDrivers = useMemo(() => {
    return drivers.filter((d) => {
      const q = driverSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        (d.profile?.full_name?.toLowerCase().includes(q)) ||
        (d.plate_number?.toLowerCase().includes(q)) ||
        (d.vehicle_type?.toLowerCase().includes(q)) ||
        (d.profile?.phone?.toLowerCase().includes(q));
      const matchStatus =
        driverStatusFilter === "all" || d.status === driverStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [drivers, driverSearch, driverStatusFilter]);

  const fetchReviews = useCallback(async () => {
    setIsLoadingReviews(true);
    try {
      const res = await fetch("/api/admin/reviews");
      if (res.ok) {
        const data = await res.json();
        if (data.reviews) {
          setReviews(data.reviews);
        }
      }
    } catch {}
    setIsLoadingReviews(false);
  }, []);

  const fetchLiveData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [ordersRes, driversRes, reviewsRes] = await Promise.all([
        fetch("/api/admin/orders?limit=100"),
        fetch("/api/admin/drivers"),
        fetch("/api/admin/reviews"),
      ]);

      if (ordersRes.status === 401 || driversRes.status === 401 || ordersRes.status === 403 || driversRes.status === 403) {
        router.push("/masuk");
        return;
      }

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
              phone: d.profile?.phone || null,
              avatar_url: d.profile?.avatar_url || null,
            },
          }));
          setDrivers(flatDrivers);
        }

        if (reviewsRes.ok) {
          const revData = await reviewsRes.json();
          if (revData.reviews) {
            setReviews(revData.reviews);
          }
        }

        // Fetch services & fare zones from Supabase
        const supabase = createClient();
        const [{ data: sData }, { data: zData }] = await Promise.all([
          supabase.from("services").select("*").order("sort_order"),
          supabase.from("fare_zones").select("*").order("sort_order"),
        ]);
        if (sData) {
          setServices(sData);
          const initialSvcs: Record<string, { extra_fee: number }> = {};
          sData.forEach((s: Service) => {
            initialSvcs[s.id] = { extra_fee: s.extra_fee };
          });
          setEditedServices(initialSvcs);
        }
        if (zData) {
          setFareZones(zData);
          const initialZones: Record<string, { base_price: number; per_km_price: number }> = {};
          zData.forEach((z: FareZone) => {
            initialZones[z.id] = { base_price: z.base_price, per_km_price: z.per_km_price };
          });
          setEditedZones(initialZones);
        }

        setIsLive(true);
      }
    } catch {}
    setIsLoadingData(false);
  }, [router]);

  useEffect(() => {
    fetchLiveData();
  }, [fetchLiveData]);

  // ─── REFRESH ORDERS & DRIVERS RINGAN (SILENT / TANPA SPINNER) ───
  const fetchOrdersRealtime = useCallback(async () => {
    try {
      const [ordersRes, driversRes] = await Promise.all([
        fetch("/api/admin/orders?limit=100"),
        fetch("/api/admin/drivers"),
      ]);

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        if (ordersData.orders) {
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
      }

      if (driversRes.ok) {
        const driversData = await driversRes.json();
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
      }
    } catch {}
  }, []);

  // ─── REALTIME SUPABASE SUBSCRIPTION + 5 DETIK LIGHT FALLBACK ───
  useEffect(() => {
    if (!isLive) return;

    const supabase = createClient();
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const channel = supabase
      .channel("admin_dashboard_realtime_pool")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          const newOrder = payload.new as any;
          if (newOrder?.id) {
            showToast(`🔔 Pesanan baru: ${newOrder.id} masuk!`);
          }
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            fetchOrdersRealtime();
          }, 300);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          const updated = payload.new as any;
          if (updated?.id && updated?.status) {
            showToast(`🔄 Order ${updated.id}: Status ${String(updated.status).toUpperCase()}`);
          }
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            fetchOrdersRealtime();
          }, 300);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "orders",
        },
        () => {
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            fetchOrdersRealtime();
          }, 300);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_events",
        },
        () => {
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            fetchOrdersRealtime();
          }, 300);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "driver_profiles",
        },
        () => {
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            fetchOrdersRealtime();
          }, 300);
        }
      )
      .subscribe();

    // Polling fallback setiap 5 detik agar data admin selalu sinkron
    const interval = setInterval(() => {
      fetchOrdersRealtime();
    }, 5000);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [isLive, fetchOrdersRealtime, showToast]);

  const [auditLogs, setAuditLogs] = useState<
    { id: string; action: string; target: string; time: string; admin: string }[]
  >([]);

  // State Edit Tarif Manual (Admin)
  const [editedZones, setEditedZones] = useState<Record<string, { base_price: number; per_km_price: number }>>({});
  const [editedServices, setEditedServices] = useState<Record<string, { extra_fee: number }>>({});
  const [isSavingFares, setIsSavingFares] = useState(false);
  const [savingItemKey, setSavingItemKey] = useState<string | null>(null);

  const handleZonePriceChange = (zoneId: string, field: "base_price" | "per_km_price", val: string) => {
    const num = Math.max(0, parseInt(val) || 0);
    setEditedZones((prev) => ({
      ...prev,
      [zoneId]: {
        base_price: prev[zoneId]?.base_price ?? 0,
        per_km_price: prev[zoneId]?.per_km_price ?? 0,
        [field]: num,
      },
    }));
  };

  const handleServiceFeeChange = (svcId: string, val: string) => {
    const num = Math.max(0, parseInt(val) || 0);
    setEditedServices((prev) => ({
      ...prev,
      [svcId]: {
        extra_fee: num,
      },
    }));
  };

  // Cek apakah ada perubahan harga yang belum disimpan
  const hasUnsavedFares = useMemo(() => {
    const zChanged = fareZones.some((z) => {
      const ed = editedZones[z.id];
      if (!ed) return false;
      return ed.base_price !== z.base_price || ed.per_km_price !== z.per_km_price;
    });
    const sChanged = services.some((s) => {
      const ed = editedServices[s.id];
      if (!ed) return false;
      return ed.extra_fee !== s.extra_fee;
    });
    return zChanged || sChanged;
  }, [fareZones, services, editedZones, editedServices]);

  // Simpan satu zona tarif
  const handleSaveSingleZone = async (zone: FareZone) => {
    const edit = editedZones[zone.id];
    if (!edit) return;
    setSavingItemKey(`zone-${zone.id}`);
    try {
      const res = await fetch("/api/admin/fares", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zones: [{ id: zone.id, base_price: edit.base_price, per_km_price: edit.per_km_price }],
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Tarif ${zone.name} berhasil disimpan!`);
        if (data.fareZones) setFareZones(data.fareZones);
        setAuditLogs((prev) => [
          {
            id: `log-${Date.now()}`,
            action: "UPDATE_ZONE_PRICE",
            target: `${zone.name} diubah ke ${formatRupiah(edit.base_price)}`,
            time: new Date().toLocaleTimeString("id-ID") + " WIB",
            admin: "Admin Pusat",
          },
          ...prev,
        ]);
      } else {
        showToast(data.error || "Gagal menyimpan tarif zona.");
      }
    } catch {
      showToast("Gagal menghubungi server.");
    } finally {
      setSavingItemKey(null);
    }
  };

  // Simpan satu layanan
  const handleSaveSingleService = async (svc: Service) => {
    const edit = editedServices[svc.id];
    if (!edit) return;
    setSavingItemKey(`svc-${svc.id}`);
    try {
      const res = await fetch("/api/admin/fares", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          services: [{ id: svc.id, extra_fee: edit.extra_fee }],
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Biaya ${svc.name} berhasil disimpan!`);
        if (data.services) setServices(data.services);
        setAuditLogs((prev) => [
          {
            id: `log-${Date.now()}`,
            action: "UPDATE_SERVICE_FEE",
            target: `${svc.name} diubah ke ${formatRupiah(edit.extra_fee)}`,
            time: new Date().toLocaleTimeString("id-ID") + " WIB",
            admin: "Admin Pusat",
          },
          ...prev,
        ]);
      } else {
        showToast(data.error || "Gagal menyimpan biaya layanan.");
      }
    } catch {
      showToast("Gagal menghubungi server.");
    } finally {
      setSavingItemKey(null);
    }
  };

  // Simpan seluruh konfigurasi tarif sekaligus
  const handleSaveAllFares = async () => {
    setIsSavingFares(true);
    try {
      const zonesPayload = fareZones.map((z) => ({
        id: z.id,
        base_price: editedZones[z.id]?.base_price ?? z.base_price,
        per_km_price: editedZones[z.id]?.per_km_price ?? z.per_km_price,
      }));

      const servicesPayload = services.map((s) => ({
        id: s.id,
        extra_fee: editedServices[s.id]?.extra_fee ?? s.extra_fee,
      }));

      const res = await fetch("/api/admin/fares", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zones: zonesPayload,
          services: servicesPayload,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Seluruh tarif & biaya layanan berhasil disimpan sebagai harga terbaru!");
        if (data.fareZones) setFareZones(data.fareZones);
        if (data.services) setServices(data.services);
        setAuditLogs((prev) => [
          {
            id: `log-${Date.now()}`,
            action: "UPDATE_ALL_FARES",
            target: "Seluruh tarif zona & layanan diperbarui oleh admin",
            time: new Date().toLocaleTimeString("id-ID") + " WIB",
            admin: "Admin Pusat",
          },
          ...prev,
        ]);
      } else {
        showToast(data.error || "Gagal menyimpan konfigurasi tarif.");
      }
    } catch {
      showToast("Gagal menghubungi server.");
    } finally {
      setIsSavingFares(false);
    }
  };

  // Kembalikan form ke nilai tersimpan
  const handleResetFares = () => {
    const resetZ: Record<string, { base_price: number; per_km_price: number }> = {};
    fareZones.forEach((z) => {
      resetZ[z.id] = { base_price: z.base_price, per_km_price: z.per_km_price };
    });
    setEditedZones(resetZ);

    const resetS: Record<string, { extra_fee: number }> = {};
    services.forEach((s) => {
      resetS[s.id] = { extra_fee: s.extra_fee };
    });
    setEditedServices(resetS);
    showToast("Form tarif dikembalikan ke data tersimpan.");
  };


  // Helper format tanggal lokal (YYYY-MM-DD)
  const getLocalDateKey = (isoString?: string | null): string => {
    if (!isoString) return "";
    try {
      const clean = isoString.includes("T") ? isoString : isoString.replace(" ", "T");
      const d = new Date(clean);
      if (isNaN(d.getTime())) {
        const match = isoString.match(/^\d{4}-\d{2}-\d{2}/);
        return match ? match[0] : "";
      }
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    } catch {
      return "";
    }
  };

  const getTodayDateKey = (): string => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // Helper tampilan tanggal & jam order di tabel
  const formatOrderDateTime = (isoString?: string | null) => {
    if (!isoString) return { date: "-", time: "-" };
    try {
      const clean = isoString.includes("T") ? isoString : isoString.replace(" ", "T");
      const d = new Date(clean);
      if (isNaN(d.getTime())) {
        return { date: isoString.slice(0, 10), time: "-" };
      }
      const date = d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const time =
        d.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }) + " WIB";
      return { date, time };
    } catch {
      return { date: isoString || "-", time: "-" };
    }
  };

  // Tanggal untuk filter penghasilan harian (default: hari ini)
  const [revenueDate, setRevenueDate] = useState<string>(() => getTodayDateKey());

  // ─── FILTER RENTANG TANGGAL GLOBAL (null = semua data / clear filter) ───
  type DateRangeOption = "today" | "week" | "month" | "custom" | null;
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeOption>(null);

  const dateRangeStartKey = useMemo((): string | null => {
    const now = new Date();
    if (dateRangeFilter === "today") {
      return getTodayDateKey();
    } else if (dateRangeFilter === "week") {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    } else if (dateRangeFilter === "month") {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    } else if (dateRangeFilter === "custom") {
      return revenueDate;
    }
    return null; // null = no date filter, show all
  }, [dateRangeFilter, revenueDate]);

  const todayKey = useMemo(() => getTodayDateKey(), []);

  // Orders yang melewati filter rentang tanggal (dipakai di stat cards & tabel)
  const dateFilteredOrders = useMemo(() => {
    if (!dateRangeFilter) return orders;
    return orders.filter((o) => {
      const orderDateKey = getLocalDateKey(o.created_at);
      if (!orderDateKey) return true;
      if (dateRangeFilter === "today") {
        return orderDateKey === todayKey;
      }
      if (dateRangeFilter === "custom") {
        return orderDateKey === revenueDate;
      }
      return orderDateKey >= dateRangeStartKey!;
    });
  }, [orders, dateRangeFilter, dateRangeStartKey, todayKey, revenueDate]);

  // Perhitungan order berstatus completed dalam rentang filter
  const allCompletedOrders = useMemo(() => {
    return dateFilteredOrders.filter((o) => o.status === "completed");
  }, [dateFilteredOrders]);

  // Penghasilan riil dari completed orders dalam rentang filter aktif
  const filteredCompletedEarnings = useMemo(() => {
    return allCompletedOrders.reduce((sum, o) => sum + (Number(o.fare) || 0), 0);
  }, [allCompletedOrders]);

  // All-time untuk footer card (seluruh data tanpa filter)
  const allTimeCompletedOrders = useMemo(() => orders.filter((o) => o.status === "completed"), [orders]);
  const allTimeCompletedEarnings = useMemo(() => {
    return allTimeCompletedOrders.reduce((sum, o) => sum + (Number(o.fare) || 0), 0);
  }, [allTimeCompletedOrders]);

  // Khusus hari ini (diselaraskan persis dengan filter 'Hari Ini' berstatus completed)
  const dailyCompletedOrders = useMemo(() => {
    return allTimeCompletedOrders.filter((o) => {
      const orderDateKey = getLocalDateKey(o.created_at);
      return orderDateKey === todayKey;
    });
  }, [allTimeCompletedOrders, todayKey]);

  const dailyCompletedEarnings = useMemo(() => {
    return dailyCompletedOrders.reduce((sum, o) => sum + (Number(o.fare) || 0), 0);
  }, [dailyCompletedOrders]);

  const formattedRevenueShort = useMemo(() => {
    try {
      const parts = revenueDate.split("-");
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      }
    } catch {}
    return revenueDate;
  }, [revenueDate]);

  const formattedRevenueDate = useMemo(() => {
    try {
      const parts = revenueDate.split("-");
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
      }
    } catch {}
    return revenueDate;
  }, [revenueDate]);

  // Label rentang tanggal untuk ditampilkan
  const dateRangeLabel = useMemo(() => {
    if (dateRangeFilter === "today") return "Hari Ini";
    if (dateRangeFilter === "week") return "1 Minggu";
    if (dateRangeFilter === "month") return "1 Bulan";
    if (dateRangeFilter === "custom") return `Tanggal: ${formattedRevenueShort}`;
    return null;
  }, [dateRangeFilter, formattedRevenueShort]);

  // Filtered orders (kombinasi filter tanggal + status + search)
  const filteredOrders = useMemo(() => {
    return dateFilteredOrders.filter((o) => {
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
  }, [dateFilteredOrders, statusFilter, searchOrder]);

  // Filter & Skor Ulasan
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (reviewRatingFilter !== "all" && r.rating !== reviewRatingFilter) {
        return false;
      }
      if (reviewSearch.trim()) {
        const q = reviewSearch.toLowerCase();
        const matchesCustomer = (r.customer_name || "").toLowerCase().includes(q);
        const matchesDriver = (r.driver_name || "").toLowerCase().includes(q);
        const matchesOrder = (r.order_id || "").toLowerCase().includes(q);
        const matchesComment = (r.comment || "").toLowerCase().includes(q);
        const matchesService = (r.service_name || "").toLowerCase().includes(q);
        return matchesCustomer || matchesDriver || matchesOrder || matchesComment || matchesService;
      }
      return true;
    });
  }, [reviews, reviewRatingFilter, reviewSearch]);

  const reviewAvgScore = useMemo(() => {
    if (reviews.length === 0) return "5.0";
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  // Hapus Ulasan (Admin)
  const handleConfirmDeleteReview = async () => {
    if (!reviewToDelete) return;
    setIsDeletingReview(true);
    try {
      const res = await fetch(`/api/admin/reviews?id=${encodeURIComponent(reviewToDelete.id)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== reviewToDelete.id));
        setAuditLogs((prev) => [
          {
            id: `log-${Date.now()}`,
            action: "DELETE_REVIEW",
            target: `Hapus ulasan dari ${reviewToDelete.customer_name} (${reviewToDelete.rating}★)`,
            time: new Date().toLocaleTimeString("id-ID") + " WIB",
            admin: "Admin Pusat",
          },
          ...prev,
        ]);
        showToast("Ulasan berhasil dihapus!");
        setReviewToDelete(null);
      } else {
        showToast(data.error || "Gagal menghapus ulasan.");
      }
    } catch {
      showToast("Gagal menghubungi server.");
    } finally {
      setIsDeletingReview(false);
    }
  };

  // Driver actions
  const handleDriverStatus = async (driverId: string, newStatus: DriverStatus) => {
    try {
      const res = await fetch("/api/admin/drivers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId, status: newStatus }),
      });
      if (res.ok) {
        await fetchLiveData();
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
        showToast(`Status driver berhasil diubah ke ${newStatus}.`);
        return;
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || "Gagal mengubah status driver.");
      }
    } catch {
      showToast("Gagal menghubungi server.");
    }
  };

  // Buka modal pendaftaran mitra driver baru
  const handleOpenAddDriver = () => {
    setNewDriverName("");
    setNewDriverPhone("");
    setNewDriverEmail("");
    setNewDriverPassword("");
    setNewDriverVehicle("");
    setNewDriverPlate("");
    setNewDriverStatus("approved");
    setAddDriverError("");
    setShowDriverPassword(false);
    setAddDriverModalOpen(true);
  };

  // Submit pendaftaran mitra driver baru oleh admin
  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingDriver(true);
    setAddDriverError("");

    try {
      const res = await fetch("/api/admin/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: newDriverName,
          email: newDriverEmail,
          phone: newDriverPhone,
          password: newDriverPassword,
          vehicleType: newDriverVehicle,
          plateNumber: newDriverPlate,
          status: newDriverStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAddDriverError(data.error || "Gagal mendaftarkan mitra driver baru.");
        setIsSubmittingDriver(false);
        return;
      }

      showToast(`Mitra driver "${newDriverName}" berhasil didaftarkan!`);
      setAddDriverModalOpen(false);
      setAuditLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          action: "CREATE_DRIVER",
          target: `Mendaftarkan driver baru ${newDriverName} (${newDriverPlate})`,
          time: new Date().toLocaleTimeString("id-ID") + " WIB",
          admin: "Admin Pusat",
        },
        ...prev,
      ]);
      await fetchLiveData();
    } catch {
      setAddDriverError("Terjadi kesalahan jaringan saat mendaftarkan driver.");
    } finally {
      setIsSubmittingDriver(false);
    }
  };

  // Assign driver to order
  const handleAssignDriver = async (driverId: string) => {
    if (!selectedOrder) return;
    const driver = drivers.find((d) => d.id === driverId);

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
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || "Gagal menugaskan driver.");
      }
    } catch {
      showToast("Gagal menghubungi server.");
    }
  };

  // Excel Export — mengikuti filter aktif (dateRangeFilter + statusFilter + searchOrder)
  const handleExportExcel = () => {
    // Gunakan filteredOrders agar file Excel sesuai filter yang sedang aktif.
    // Jika semua filter clear maka filteredOrders = seluruh data.
    const exportData = filteredOrders;

    if (exportData.length === 0) {
      showToast("Tidak ada data order untuk diekspor.");
      return;
    }

    const headers = [
      "ID Order",
      "Tanggal",
      "Jam",
      "Nama Pelanggan",
      "No Telepon",
      "Layanan",
      "Titik Jemput",
      "Titik Tujuan",
      "Jarak (km)",
      "Ongkos (Rp)",
      "Driver",
      "Metode Pembayaran",
      "Status",
      "Waktu ISO",
    ];

    const rows = exportData.map((o) => {
      const dt = formatOrderDateTime(o.created_at);
      return [
        o.id,
        dt.date,
        dt.time,
        o.customer_name || "-",
        o.customer_phone || "-",
        o.service_name || "-",
        o.pickup_name || "-",
        o.dropoff_name || "-",
        Number(o.distance_km) || 0,
        Number(o.fare) || 0,
        o.driver_name || "-",
        o.payment_method || "-",
        o.status,
        o.created_at || "",
      ];
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Format lebar kolom agar rapi saat dibuka di Microsoft Excel / Google Sheets
    worksheet["!cols"] = [
      { wch: 22 }, // ID Order
      { wch: 14 }, // Tanggal
      { wch: 10 }, // Jam
      { wch: 22 }, // Nama Pelanggan
      { wch: 16 }, // No Telepon
      { wch: 20 }, // Layanan
      { wch: 28 }, // Titik Jemput
      { wch: 28 }, // Titik Tujuan
      { wch: 12 }, // Jarak (km)
      { wch: 14 }, // Ongkos (Rp)
      { wch: 20 }, // Driver
      { wch: 18 }, // Metode Pembayaran
      { wch: 14 }, // Status
      { wch: 24 }, // Waktu ISO
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Order");

    // Nama file menyertakan info filter agar mudah diidentifikasi
    const filterSuffix = dateRangeFilter ? `_${dateRangeFilter}` : "_semua";
    const fileName = `laporan_order_anjem_uin${filterSuffix}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    XLSX.writeFile(workbook, fileName);

    const filterDesc = dateRangeLabel ? ` (${dateRangeLabel})` : " (Semua Data)";
    showToast(`Excel${filterDesc} berhasil diunduh — ${exportData.length} order.`);
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
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Dashboard Administrasi Anjem UIN
                </h1>
                <p className="text-xs text-slate-500">
                  Kelola order, verifikasi driver kampus, pantau tarif & audit log.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
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
                onClick={handleExportExcel}
                className="btn btn-secondary text-xs flex items-center gap-1.5 relative group"
                title={dateRangeLabel ? `Ekspor Excel: ${dateRangeLabel}` : "Ekspor Excel: Semua Data"}
              >
                <FileSpreadsheet size={14} className="text-emerald-600" />
                Ekspor Excel (.xlsx)
                {dateRangeFilter && (
                  <span className="absolute -top-1.5 -right-1.5 w-2 h-2 rounded-full bg-blue-500 border border-white" />
                )}
              </button>
            </div>
          </div>

          {/* ─── FILTER TANGGAL GLOBAL ─── */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mr-1">
              <Filter size={13} className="text-slate-400" />
              Filter Periode:
            </div>
            {([
              { key: "today" as const, label: "Hari Ini" },
              { key: "week" as const, label: "1 Minggu" },
              { key: "month" as const, label: "1 Bulan" },
            ] as { key: "today" | "week" | "month"; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setDateRangeFilter(dateRangeFilter === key ? null : key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${
                  dateRangeFilter === key
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20"
                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50"
                }`}
              >
                <Calendar size={11} className={dateRangeFilter === key ? "text-blue-200" : "text-slate-400"} />
                {label}
              </button>
            ))}
            {dateRangeFilter ? (
              <button
                type="button"
                onClick={() => setDateRangeFilter(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border cursor-pointer bg-white text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircle size={12} />
                Clear Filter (Semua Data)
              </button>
            ) : (
              <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-full">
                Menampilkan seluruh data ({orders.length} order)
              </span>
            )}
            {dateRangeFilter && (
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full ml-auto">
                📊 Menampilkan data: <strong>{dateRangeLabel}</strong> — {dateFilteredOrders.length} order
              </span>
            )}
          </div>

          {/* Stat Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {/* Card 1: Penghasilan — menjumlahkan real penghasilan sesuai filter */}
            <div className={`bg-white p-4 rounded-2xl border shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1 overflow-hidden transition-all ${
              dateRangeFilter ? "border-emerald-300 ring-1 ring-emerald-100" : "border-slate-200"
            }`}>
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                    <Wallet size={13} className="text-emerald-600 shrink-0" />
                    Penghasilan
                  </span>

                  {/* Label periode atau pemilih tanggal */}
                  {dateRangeFilter ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg whitespace-nowrap">
                      <Calendar size={10} className="text-emerald-500 shrink-0" />
                      {dateRangeLabel}
                    </span>
                  ) : (
                    <div className="relative inline-flex items-center">
                      <button
                        type="button"
                        onClick={() => dateInputRef.current?.showPicker?.()}
                        className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200/90 active:bg-slate-200 px-2 py-0.5 rounded-lg border border-slate-200/80 transition-all cursor-pointer shadow-2xs"
                        title="Pilih tanggal tertentu"
                      >
                        <Calendar size={11} className="text-emerald-600 shrink-0" />
                        <span>Semua Waktu</span>
                      </button>
                      <input
                        ref={dateInputRef}
                        type="date"
                        value={revenueDate}
                        onChange={(e) => {
                          setRevenueDate(e.target.value);
                          setDateRangeFilter("custom");
                        }}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        tabIndex={-1}
                        aria-label="Pilih tanggal penghasilan"
                      />
                    </div>
                  )}
                </div>

                {/* Angka penghasilan utama: menjumlahkan real penghasilan dari order */}
                <span className="text-2xl font-extrabold text-emerald-600 tracking-tight block">
                  {formatRupiah(filteredCompletedEarnings)}
                </span>

                {/* Subtitle dinamis */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
                  <span className="truncate">
                    {dateRangeFilter ? (
                      <>
                        {dateRangeLabel}:{" "}
                        <strong className="text-slate-700">
                          {allCompletedOrders.length} selesai
                        </strong>
                      </>
                    ) : (
                      <>
                        Total pesanan selesai:{" "}
                        <strong className="text-slate-700">{allCompletedOrders.length} selesai</strong>
                      </>
                    )}
                  </span>
                  {dateRangeFilter && (
                    <button
                      type="button"
                      onClick={() => setDateRangeFilter(null)}
                      className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline shrink-0 ml-1"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
              <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span>{dateRangeFilter ? "Semua waktu:" : "Hari ini:"}</span>
                <span className="font-bold text-slate-700">
                  {dateRangeFilter
                    ? formatRupiah(allTimeCompletedEarnings)
                    : `${formatRupiah(dailyCompletedEarnings)} (${dailyCompletedOrders.length} selesai)`}
                </span>
              </div>
            </div>

            {/* Card 2: Total Order */}
            <div className={`bg-white p-4 rounded-2xl border shadow-sm flex flex-col justify-between transition-all ${
              dateRangeFilter ? "border-blue-200 ring-1 ring-blue-100" : "border-slate-200"
            }`}>
              <div>
                <span className="text-xs text-slate-400 font-semibold block mb-1">Total Order</span>
                <span className="text-2xl font-extrabold text-slate-900">{dateFilteredOrders.length}</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  {dateRangeLabel ? dateRangeLabel : "Semua status"}
                </span>
              </div>
              <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span>Selesai:</span>
                <span className="font-bold text-emerald-600">{allCompletedOrders.length} order</span>
              </div>
            </div>

            {/* Card 3: Order Menunggu */}
            <div className={`bg-white p-4 rounded-2xl border shadow-sm flex flex-col justify-between transition-all ${
              dateRangeFilter ? "border-blue-200 ring-1 ring-blue-100" : "border-slate-200"
            }`}>
              <div>
                <span className="text-xs text-slate-400 font-semibold block mb-1">Order Menunggu</span>
                <span className="text-2xl font-extrabold text-amber-600">
                  {dateFilteredOrders.filter((o) => o.status === "pending").length}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  {dateRangeLabel ? `Dalam ${dateRangeLabel.toLowerCase()}` : "Perlu konfirmasi"}
                </span>
              </div>
              <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span>Proses jalan:</span>
                <span className="font-bold text-blue-600">
                  {dateFilteredOrders.filter((o) => o.status === "assigned" || o.status === "on_the_way").length}
                </span>
              </div>
            </div>

            {/* Card 4: Driver Aktif */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-400 font-semibold block mb-1">Driver Aktif</span>
                <span className="text-2xl font-extrabold text-emerald-600">
                  {drivers.filter((d) => d.status === "approved").length}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Telah diverifikasi</span>
              </div>
              <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span>Driver online:</span>
                <span className="font-bold text-emerald-600">
                  {drivers.filter((d) => d.is_online).length}
                </span>
              </div>
            </div>

            {/* Card 5: Rating Kepuasan */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-400 font-semibold block mb-1">Rating Kepuasan</span>
                <span className="text-2xl font-extrabold text-blue-600">5.0 / 5.0</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Dari ulasan terverifikasi</span>
              </div>
              <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span>Kepuasan:</span>
                <span className="font-bold text-blue-600">
                  {reviews.length > 0 ? `⭐ ${reviewAvgScore} (${reviews.length} ulasan)` : "100% Positif"}
                </span>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden mb-8">
            {activeTab === "orders" && (
              <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-4.5 bg-blue-600 rounded-full inline-block" />
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    📋 Semua Order
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full ml-1">
                      {filteredOrders.length}
                    </span>
                    {dateRangeLabel && (
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                        {dateRangeLabel}
                      </span>
                    )}
                  </h3>
                </div>
                {/* Tombol Export Excel inline di header orders (shortcut) */}
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="text-xs font-semibold text-slate-600 hover:text-emerald-700 flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-emerald-50/50 hover:border-emerald-200 transition-all cursor-pointer"
                  title={dateRangeLabel ? `Ekspor Excel: ${dateRangeLabel}` : "Ekspor Excel: Semua Data"}
                >
                  <FileSpreadsheet size={12} className="text-emerald-600" />
                  <span>Excel{dateRangeFilter ? ` (${dateRangeLabel})` : " (Semua)"}</span>
                </button>
              </div>
            )}

            {activeTab === "drivers" && (
              <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-6 bg-purple-600 rounded-full inline-block" />
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                      🛵 Kelola & Pendaftaran Mitra Driver
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full ml-1">
                        Total {drivers.length}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Pendaftaran mitra driver hanya dapat dilakukan oleh admin dari panel ini.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenAddDriver}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm shadow-purple-500/20 cursor-pointer"
                  >
                    <UserPlus size={15} />
                    <span>+ Tambah Mitra Driver</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === "logs" && (
              <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-4.5 bg-purple-600 rounded-full inline-block" />
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    🛡️ Audit Log Admin
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full ml-1">
                      {auditLogs.length}
                    </span>
                  </h3>
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-4.5 bg-purple-600 rounded-full inline-block" />
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    ⭐ Kelola Ulasan Pelanggan
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full ml-1">
                      {reviews.length}
                    </span>
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={fetchReviews}
                  disabled={isLoadingReviews}
                  className="text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-white transition-all cursor-pointer"
                  title="Segarkan daftar ulasan"
                >
                  <RefreshCw size={12} className={isLoadingReviews ? "animate-spin text-blue-600" : ""} />
                  <span>Segarkan</span>
                </button>
              </div>
            )}

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

                  {/* Summary Bar: Completed filter + atau date range aktif */}
                  {(statusFilter === "completed" || dateRangeFilter) && (
                    <div className="bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs px-4 py-2.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-1 shadow-sm">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={16} className="text-emerald-600 shrink-0" />
                        <span>
                          {statusFilter === "completed" && dateRangeLabel
                            ? <>Filter: <strong>COMPLETED</strong> • <strong>{dateRangeLabel}</strong></>
                            : statusFilter === "completed"
                            ? <>Menampilkan pesanan dengan status <strong>COMPLETED</strong></>
                            : <>Filter aktif: <strong>{dateRangeLabel}</strong> — {filteredOrders.length} order ditampilkan</>}
                        </span>
                      </div>
                      <div className="font-extrabold text-emerald-700 text-xs sm:text-sm">
                        Penghasilan Selesai: {formatRupiah(filteredCompletedEarnings)} ({allCompletedOrders.length} order)
                      </div>
                    </div>
                  )}

                  {/* Orders Table */}
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3 whitespace-nowrap">ID Order</th>
                          <th className="p-3 whitespace-nowrap">Tanggal</th>
                          <th className="p-3 whitespace-nowrap">Pelanggan</th>
                          <th className="p-3 whitespace-nowrap">Layanan</th>
                          <th className="p-3 whitespace-nowrap">Rute</th>
                          <th className="p-3 whitespace-nowrap">Ongkos</th>
                          <th className="p-3 whitespace-nowrap">Driver</th>
                          <th className="p-3 whitespace-nowrap">Status</th>
                          <th className="p-3 text-right whitespace-nowrap">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredOrders.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="p-8 text-center text-slate-400">
                              Tidak ada pesanan ditemukan.
                            </td>
                          </tr>
                        ) : (
                          filteredOrders.map((ord) => (
                            <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="p-3 font-mono font-bold text-slate-900">{ord.id}</td>
                              <td className="p-3 whitespace-nowrap">
                                <div className="font-semibold text-slate-800">
                                  {formatOrderDateTime(ord.created_at).date}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {formatOrderDateTime(ord.created_at).time}
                                </div>
                              </td>
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

              {/* TAB 2: KELOLA & PENDAFTARAN MITRA DRIVER */}
              {activeTab === "drivers" && (
                <div className="space-y-4">
                  {/* Filter & Search Bar */}
                  <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={driverSearch}
                        onChange={(e) => setDriverSearch(e.target.value)}
                        placeholder="Cari nama driver, plat motor, tipe kendaraan, atau nomor HP..."
                        className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
                        <Filter size={12} /> Status:
                      </span>
                      {[
                        { key: "all", label: "Semua" },
                        { key: "approved", label: "Aktif" },
                        { key: "pending", label: "Pending" },
                        { key: "blocked", label: "Diblokir" },
                      ].map((s) => (
                        <button
                          key={s.key}
                          type="button"
                          onClick={() => setDriverStatusFilter(s.key)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                            driverStatusFilter === s.key
                              ? "bg-purple-600 text-white shadow-2xs"
                              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredDrivers.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                      <Bike size={36} className="mx-auto text-slate-300 mb-2" />
                      <h4 className="text-sm font-bold text-slate-700">Tidak ada driver yang cocok</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        {driverSearch || driverStatusFilter !== "all"
                          ? "Coba sesuaikan kata kunci pencarian atau filter status driver."
                          : "Belum ada mitra driver terdaftar. Klik tombol '+ Tambah Mitra Driver' di atas untuk mendaftarkan driver baru."}
                      </p>
                      <button
                        type="button"
                        onClick={handleOpenAddDriver}
                        className="mt-4 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm shadow-purple-500/20"
                      >
                        <UserPlus size={14} />
                        Daftarkan Driver Pertama
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredDrivers.map((drv) => (
                        <div
                          key={drv.id}
                          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between hover:border-purple-200 transition-all"
                        >
                          <div>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-extrabold flex items-center justify-center text-sm shadow-sm flex-shrink-0">
                                  {drv.profile?.full_name?.slice(0, 2).toUpperCase() || "DR"}
                                </div>
                                <div>
                                  <h3 className="font-bold text-slate-900 text-sm leading-tight">
                                    {drv.profile?.full_name}
                                  </h3>
                                  <span className="text-[11px] text-slate-500 block">
                                    {drv.vehicle_type} • Plat: <strong className="text-slate-800">{drv.plate_number}</strong>
                                  </span>
                                  {drv.profile?.phone && (
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-[11px] text-slate-500 font-mono">
                                        📞 {drv.profile.phone}
                                      </span>
                                      <a
                                        href={buildWALink(drv.profile.phone, `Halo ${drv.profile.full_name}, kami dari Admin Anjem UIN.`)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md hover:bg-emerald-100 transition-colors inline-flex items-center gap-1"
                                      >
                                        Chat WA
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <span
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                                  drv.status === "approved"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : drv.status === "pending"
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-red-50 text-red-700 border border-red-200"
                                }`}
                              >
                                {drv.status === "approved" ? "AKTIF" : drv.status === "pending" ? "PENDING" : "DIBLOKIR"}
                              </span>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 space-y-1 mb-4">
                              <div className="flex items-center justify-between">
                                <span>Rating Layanan:</span>
                                <strong>⭐ {drv.rating_avg.toFixed(1)} / 5.0 ({drv.total_trips} trip)</strong>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Status Siaga:</span>
                                <span className={drv.is_online ? "text-emerald-600 font-bold flex items-center gap-1" : "text-slate-400"}>
                                  <span className={`w-2 h-2 rounded-full ${drv.is_online ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                                  {drv.is_online ? "Online (Siaga Order)" : "Offline"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                            {drv.status !== "approved" && (
                              <button
                                onClick={() => handleDriverStatus(drv.id, "approved")}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              >
                                Setujui / Aktifkan Driver
                              </button>
                            )}
                            {drv.status === "approved" && (
                              <button
                                onClick={() => handleDriverStatus(drv.id, "blocked")}
                                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              >
                                Blokir Driver
                              </button>
                            )}
                            {drv.status === "blocked" && (
                              <button
                                onClick={() => handleDriverStatus(drv.id, "approved")}
                                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              >
                                Buka Blokir
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: LAYANAN & TARIF ZONA */}
              {activeTab === "fares" && (
                <div className="space-y-8">
                  {/* Action Header Bar */}
                  <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge badge-blue text-[11px] font-bold">
                          Pengaturan Tarif Fleksibel
                        </span>
                        {hasUnsavedFares && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full animate-pulse">
                            ● Perubahan belum disimpan
                          </span>
                        )}
                      </div>
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                        Atur Tarif Zona & Biaya Layanan
                      </h3>
                      <p className="text-xs text-slate-500 max-w-xl">
                        Ubah harga secara manual. Nilai yang disimpan otomatis menjadi <strong>harga terbaru resmi</strong> dan langsung berlaku pada kalkulator publik, rincian halaman tarif, serta pemesanan order.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleResetFares}
                        disabled={isSavingFares || !hasUnsavedFares}
                        className="btn btn-secondary text-xs flex items-center gap-1.5 disabled:opacity-50"
                        title="Kembalikan ke tarif tersimpan di database"
                      >
                        <RotateCcw size={13} />
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAllFares}
                        disabled={isSavingFares}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <Save size={14} className={isSavingFares ? "animate-spin" : ""} />
                        <span>{isSavingFares ? "Menyimpan..." : "Simpan Semua Perubahan"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Section 1: Zona Tarif */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                          <span className="w-2.5 h-5 bg-blue-600 rounded-full inline-block" />
                          Tabel Zona Tarif Layanan ({fareZones.length} Zona)
                        </h4>
                        <span className="text-xs text-slate-500">
                          Tarif dasar flat per jangkauan jarak kilometer.
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {fareZones.map((zone) => {
                        const edit = editedZones[zone.id] || {
                          base_price: zone.base_price,
                          per_km_price: zone.per_km_price,
                        };
                        const isSavingThis = savingItemKey === `zone-${zone.id}`;
                        const isModified =
                          edit.base_price !== zone.base_price ||
                          edit.per_km_price !== zone.per_km_price;

                        return (
                          <div
                            key={zone.id}
                            className={`bg-white rounded-2xl p-5 border shadow-sm relative overflow-hidden flex flex-col justify-between transition-all ${
                              isModified ? "border-blue-400 ring-2 ring-blue-500/10" : "border-slate-200"
                            }`}
                          >
                            <div
                              className="absolute top-0 left-0 right-0 h-1.5"
                              style={{ backgroundColor: zone.color || "#3b82f6" }}
                            />

                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                  {zone.name}
                                </span>
                                <span
                                  className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                                  style={{
                                    backgroundColor: `${zone.color || "#3b82f6"}18`,
                                    color: zone.color || "#3b82f6",
                                  }}
                                >
                                  {zone.max_km ? `${zone.min_km} – ${zone.max_km} km` : `> ${zone.min_km} km`}
                                </span>
                              </div>

                              {/* Input Tarif Dasar / Flat */}
                              <div className="mb-3">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                                  Tarif Flat / Dasar (Rp)
                                </label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    min="0"
                                    step="500"
                                    value={edit.base_price}
                                    onChange={(e) =>
                                      handleZonePriceChange(zone.id, "base_price", e.target.value)
                                    }
                                    className="w-full text-base font-extrabold text-slate-900 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                  />
                                </div>
                                <div className="flex items-center justify-between text-[11px] mt-1 font-semibold">
                                  <span className="text-slate-400">Pratinjau:</span>
                                  <span className="text-blue-600 font-extrabold">
                                    {formatRupiah(edit.base_price)}
                                  </span>
                                </div>
                              </div>

                              {/* Input Tarif Tambahan per-km (untuk zona > 10 km atau yang ada per_km_price) */}
                              {(zone.per_km_price > 0 || zone.max_km === null) && (
                                <div className="mb-3 pt-2 border-t border-slate-100">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                                    Tarif Tambahan / Km (Rp)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="500"
                                    value={edit.per_km_price}
                                    onChange={(e) =>
                                      handleZonePriceChange(zone.id, "per_km_price", e.target.value)
                                    }
                                    className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                  />
                                  <div className="flex items-center justify-between text-[10px] mt-1">
                                    <span className="text-slate-400">Ekstra per km:</span>
                                    <span className="text-emerald-600 font-bold">
                                      +{formatRupiah(edit.per_km_price)}/km
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-[10px] text-slate-400">
                                {isModified ? "Belum disimpan" : "Tersimpan aktif"}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleSaveSingleZone(zone)}
                                disabled={isSavingThis || !isModified}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                                  isModified
                                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-2xs"
                                    : "bg-slate-100 text-slate-400 cursor-default"
                                }`}
                              >
                                <Save size={12} className={isSavingThis ? "animate-spin" : ""} />
                                <span>{isSavingThis ? "Menyimpan..." : "Simpan"}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section 2: Biaya Tambahan Per Jenis Layanan */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                          <span className="w-2.5 h-5 bg-blue-600 rounded-full inline-block" />
                          Biaya Tambahan Per Jenis Layanan ({services.length} Layanan)
                        </h4>
                        <span className="text-xs text-slate-500">
                          Biaya ekstra khusus tiap layanan (misal: jasa titip, motor kilat). Masukkan <strong>0</strong> untuk layanan gratis tanpa biaya ekstra.
                        </span>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
                      <div className="divide-y divide-slate-100">
                        {services.map((svc) => {
                          const edit = editedServices[svc.id] || { extra_fee: svc.extra_fee };
                          const isSavingThis = savingItemKey === `svc-${svc.id}`;
                          const isModified = edit.extra_fee !== svc.extra_fee;

                          return (
                            <div
                              key={svc.id}
                              className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                                isModified ? "bg-blue-50/40" : "hover:bg-slate-50/70"
                              }`}
                            >
                              <div className="flex items-start sm:items-center gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold mt-0.5 sm:mt-0">
                                  {svc.slug === "antar-jemput-motor" && <Bike size={20} />}
                                  {svc.slug === "jastip-kuliner" && <UtensilsCrossed size={20} />}
                                  {svc.slug === "jastip-belanja" && <ShoppingBasket size={20} />}
                                  {svc.slug === "kirim-dokumen" && <Package size={20} />}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h5 className="font-bold text-slate-900 text-sm">{svc.name}</h5>
                                    {svc.badge_text && (
                                      <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                                        {svc.badge_text}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500 max-w-lg mt-0.5">
                                    {svc.description}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                                <div className="text-left sm:text-right">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                                    Biaya Layanan (Rp)
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      min="0"
                                      step="500"
                                      value={edit.extra_fee}
                                      onChange={(e) =>
                                        handleServiceFeeChange(svc.id, e.target.value)
                                      }
                                      className="w-28 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-right"
                                    />
                                    <span className="text-xs font-bold whitespace-nowrap min-w-[70px] text-right">
                                      {edit.extra_fee === 0 ? (
                                        <span className="text-emerald-600 font-extrabold">Gratis (+Rp0)</span>
                                      ) : (
                                        <span className="text-blue-600 font-extrabold">
                                          +{formatRupiah(edit.extra_fee)}
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleSaveSingleService(svc)}
                                  disabled={isSavingThis || !isModified}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all mt-3 sm:mt-0 ${
                                    isModified
                                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-2xs"
                                      : "bg-slate-100 text-slate-400 cursor-default"
                                  }`}
                                >
                                  <Save size={12} className={isSavingThis ? "animate-spin" : ""} />
                                  <span>{isSavingThis ? "..." : "Simpan"}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
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

              {/* TAB 5: KELOLA ULASAN */}
              {activeTab === "reviews" && (
                <div className="space-y-4">
                  {/* Summary & Filters Bar */}
                  <div className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500">
                          <Star size={24} fill="#f59e0b" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xl font-extrabold text-slate-900">{reviewAvgScore}</span>
                            <span className="text-xs text-slate-400 font-bold">/ 5.0</span>
                          </div>
                          <span className="text-xs text-slate-500">
                            Total {reviews.length} ulasan masuk
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Search & Rating Filter */}
                    <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                      <div className="relative w-full sm:w-64">
                        <Search
                          size={15}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type="text"
                          value={reviewSearch}
                          onChange={(e) => setReviewSearch(e.target.value)}
                          placeholder="Cari pelanggan, driver, order..."
                          className="w-full pl-9 pr-3 py-1.5 bg-white rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>

                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => setReviewRatingFilter("all")}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            reviewRatingFilter === "all"
                              ? "bg-slate-900 text-white shadow-2xs"
                              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          Semua ({reviews.length})
                        </button>
                        {[5, 4, 3, 2, 1].map((starVal) => {
                          const count = reviews.filter((r) => r.rating === starVal).length;
                          return (
                            <button
                              key={starVal}
                              type="button"
                              onClick={() => setReviewRatingFilter(starVal)}
                              className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-0.5 transition-all cursor-pointer ${
                                reviewRatingFilter === starVal
                                  ? "bg-amber-500 text-white shadow-2xs"
                                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              <span>{starVal}</span>
                              <Star
                                size={10}
                                fill={reviewRatingFilter === starVal ? "#ffffff" : "#f59e0b"}
                                className={reviewRatingFilter === starVal ? "text-white" : "text-amber-500"}
                              />
                              <span className="text-[10px] opacity-75">({count})</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Review List */}
                  {filteredReviews.length === 0 ? (
                    <div className="py-16 text-center text-slate-500 bg-slate-50/50 rounded-2xl border border-slate-200/80">
                      <MessageSquare size={36} className="mx-auto text-slate-300 mb-2.5" />
                      <p className="text-sm font-bold text-slate-700 mb-1">
                        {reviews.length === 0 ? "Belum ada ulasan dari pelanggan" : "Tidak ada ulasan yang sesuai dengan filter"}
                      </p>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        {reviews.length === 0
                          ? "Ulasan yang diberikan oleh pelanggan setelah menyelesaikan order akan otomatis muncul di sini."
                          : "Coba ubah kata kunci pencarian atau pilih filter bintang lainnya."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredReviews.map((rev) => (
                        <div
                          key={rev.id}
                          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs hover:border-blue-200 transition-all flex flex-col justify-between gap-3.5"
                        >
                          {/* Top Row: Stars + Date + Service */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    size={14}
                                    fill={s <= rev.rating ? "#f59e0b" : "none"}
                                    className={s <= rev.rating ? "text-amber-400" : "text-slate-200"}
                                  />
                                ))}
                              </div>
                              <span className="text-xs font-extrabold text-slate-800">
                                {rev.rating}.0
                              </span>
                              <span className="text-xs text-slate-300">•</span>
                              <span className="badge badge-blue text-[10px] font-bold">
                                {rev.service_name}
                              </span>
                            </div>

                            <span className="text-[11px] text-slate-400 font-medium">
                              {rev.created_at ? formatDate(rev.created_at) : "-"}
                            </span>
                          </div>

                          {/* Comment Content */}
                          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
                            &ldquo;{rev.comment || "Tanpa komentar tertulis."}&rdquo;
                          </div>

                          {/* Bottom Row: Metadata & Delete Button */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100">
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                              <div>
                                <span className="text-slate-400">Pelanggan: </span>
                                <strong className="text-slate-700">{rev.customer_name}</strong>
                                {rev.customer_phone && rev.customer_phone !== "-" && (
                                  <span className="text-slate-400 ml-1">({rev.customer_phone})</span>
                                )}
                              </div>
                              <div>
                                <span className="text-slate-400">Driver: </span>
                                <strong className="text-slate-700">{rev.driver_name}</strong>
                                {rev.driver_plate && rev.driver_plate !== "-" && (
                                  <span className="text-slate-400 ml-1">[{rev.driver_plate}]</span>
                                )}
                              </div>
                              <div>
                                <span className="text-slate-400">ID Order: </span>
                                <span className="font-mono font-semibold text-slate-600">{rev.order_id}</span>
                                {rev.route_summary && (
                                  <span className="text-slate-400 ml-1">({rev.route_summary})</span>
                                )}
                              </div>
                            </div>

                            {/* Tombol Hapus Ulasan */}
                            <button
                              type="button"
                              onClick={() => setReviewToDelete(rev)}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 active:bg-red-200 border border-red-200 text-red-600 hover:text-red-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 self-end sm:self-auto"
                              title="Hapus ulasan ini"
                            >
                              <Trash2 size={13} />
                              <span>Hapus Ulasan</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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

          {/* Modal Konfirmasi Hapus Ulasan */}
          {reviewToDelete && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4 mx-auto sm:mx-0">
                  <Trash2 size={24} />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mb-1">
                  Hapus Ulasan Pelanggan?
                </h3>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Tindakan ini akan menghapus ulasan dari database secara permanen dan tidak dapat dibatalkan.
                </p>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 mb-5 text-xs text-slate-700 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{reviewToDelete.customer_name}</span>
                    <span className="text-amber-500 font-extrabold">⭐ {reviewToDelete.rating}.0</span>
                  </div>
                  <p className="text-slate-600 italic line-clamp-2">
                    &ldquo;{reviewToDelete.comment}&rdquo;
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setReviewToDelete(null)}
                    disabled={isDeletingReview}
                    className="btn btn-secondary text-xs px-4 py-2"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteReview}
                    disabled={isDeletingReview}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Trash2 size={13} className={isDeletingReview ? "animate-spin" : ""} />
                    <span>{isDeletingReview ? "Menghapus..." : "Ya, Hapus Ulasan"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Pendaftaran Mitra Driver Baru oleh Admin */}
          {addDriverModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 my-8 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shadow-sm">
                      <UserPlus size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        Daftarkan Mitra Driver Baru
                      </h3>
                      <p className="text-xs text-slate-500">
                        Hanya admin berwenang mendaftarkan akun mitra driver Anjem UIN
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddDriverModalOpen(false)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <XCircle size={20} />
                  </button>
                </div>

                {addDriverError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <div>{addDriverError}</div>
                  </div>
                )}

                <form onSubmit={handleCreateDriver} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nama Lengkap Driver <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newDriverName}
                        onChange={(e) => setNewDriverName(e.target.value)}
                        placeholder="Contoh: Muhammad Rizki"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nomor WhatsApp / HP <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="tel"
                          required
                          value={newDriverPhone}
                          onChange={(e) => setNewDriverPhone(e.target.value)}
                          placeholder="081234567890"
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Email Akun Driver <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={newDriverEmail}
                          onChange={(e) => setNewDriverEmail(e.target.value)}
                          placeholder="driver@anjem.uin"
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Kata Sandi Akun Driver (Min 6 Karakter) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type={showDriverPassword ? "text" : "password"}
                          required
                          minLength={6}
                          value={newDriverPassword}
                          onChange={(e) => setNewDriverPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowDriverPassword(!showDriverPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        >
                          {showDriverPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Merk & Tipe Motor <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newDriverVehicle}
                        onChange={(e) => setNewDriverVehicle(e.target.value)}
                        placeholder="Contoh: Honda Vario 125"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nomor Plat Polisi <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newDriverPlate}
                        onChange={(e) => setNewDriverPlate(e.target.value)}
                        placeholder="Contoh: AD 1234 XY"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 uppercase focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Status Awal Akun Driver
                      </label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => setNewDriverStatus("approved")}
                          className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-left flex items-center gap-2 cursor-pointer ${
                            newDriverStatus === "approved"
                              ? "bg-emerald-50 border-emerald-400 text-emerald-800 shadow-2xs"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[10px] ${
                            newDriverStatus === "approved" ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300"
                          }`}>
                            {newDriverStatus === "approved" && "✓"}
                          </span>
                          <div>
                            <div>Langsung Aktif</div>
                            <div className="text-[10px] font-normal text-emerald-600">Bisa langsung narik order</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setNewDriverStatus("pending")}
                          className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-left flex items-center gap-2 cursor-pointer ${
                            newDriverStatus === "pending"
                              ? "bg-amber-50 border-amber-400 text-amber-800 shadow-2xs"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[10px] ${
                            newDriverStatus === "pending" ? "border-amber-600 bg-amber-600 text-white" : "border-slate-300"
                          }`}>
                            {newDriverStatus === "pending" && "✓"}
                          </span>
                          <div>
                            <div>Pending (Verifikasi)</div>
                            <div className="text-[10px] font-normal text-amber-600">Disetujui nanti</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5 mt-5">
                    <button
                      type="button"
                      onClick={() => setAddDriverModalOpen(false)}
                      disabled={isSubmittingDriver}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingDriver}
                      className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm shadow-purple-500/20 transition-all cursor-pointer"
                    >
                      {isSubmittingDriver ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Mendaftarkan...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={14} />
                          <span>Daftarkan Mitra Driver</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
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
