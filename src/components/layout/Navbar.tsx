"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  ChevronDown,
  Bike,
  Shield,
  User,
  LogOut,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Mounted state to prevent SSR hydration mismatch
  const [mounted, setMounted] = useState(false);

  // Auth / Role State - initialize from localStorage cache synchronously for instant display
  const [role, setRole] = useState<"admin" | "driver" | "customer" | null>(null);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    setMounted(true);
    // Load from localStorage cache on first client render (instant, no network)
    const savedRole = localStorage.getItem("anjem_role");
    if (savedRole) setRole(savedRole as any);
    try {
      const savedUser = localStorage.getItem("anjem_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed.name) setUserName(parsed.name);
      }
    } catch {}
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Sync session with Supabase Auth and listen to state changes
  useEffect(() => {
    const supabase = createClient();

    const syncUserSession = async () => {
      try {
        // Use getSession() - reads from local cookie cache (fast, no extra network call)
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Try to get role from existing localStorage first
          const cachedRole = localStorage.getItem("anjem_role");
          if (cachedRole) {
            setRole(cachedRole as any);
            // Fetch fresh profile in background to update name/role if changed
            supabase
              .from("profiles")
              .select("role, full_name")
              .eq("id", session.user.id)
              .maybeSingle()
              .then(({ data: profile }) => {
                if (profile) {
                  const resolvedRole = profile.role || cachedRole;
                  const resolvedName = profile.full_name || session.user!.user_metadata?.full_name || session.user!.email?.split("@")[0] || "User";
                  setRole(resolvedRole as any);
                  setUserName(resolvedName);
                  localStorage.setItem("anjem_role", resolvedRole);
                  localStorage.setItem("anjem_user", JSON.stringify({ id: session.user!.id, name: resolvedName, role: resolvedRole }));
                }
              });
            return;
          }

          // No cached role - fetch profile once
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, full_name")
            .eq("id", session.user.id)
            .maybeSingle();

          const resolvedRole = profile?.role || session.user.user_metadata?.role || "customer";
          const resolvedName =
            profile?.full_name ||
            session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0] ||
            "User";

          setRole(resolvedRole as any);
          setUserName(resolvedName);

          if (typeof window !== "undefined") {
            localStorage.setItem("anjem_role", resolvedRole);
            localStorage.setItem(
              "anjem_user",
              JSON.stringify({ id: session.user.id, name: resolvedName, role: resolvedRole })
            );
          }
          return;
        }
      } catch (err) {
        // Fallback silently if offline or network error
      }

      // If no session, reset only if no cached role
      if (typeof window !== "undefined") {
        const hasSavedRole = localStorage.getItem("anjem_role");
        if (!hasSavedRole) {
          setRole(null);
          setUserName("");
        }
      }
    };

    syncUserSession();

    // Listen to Supabase auth events (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        syncUserSession();
      } else if (event === "SIGNED_OUT") {
        setRole(null);
        setUserName("");
        if (typeof window !== "undefined") {
          localStorage.removeItem("anjem_role");
          localStorage.removeItem("anjem_user");
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Close drawer on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setOpenDropdown(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    setOpenDropdown(null);

    // If it's an anchor link like #layanan
    if (href.startsWith("#")) {
      if (pathname === "/") {
        const el = document.querySelector(href);
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - 90;
          window.scrollTo({ top, behavior: "smooth" });
          return;
        }
      }
      // If not on homepage, navigate to /#hash
      router.push("/" + href);
      return;
    }

    // Normal path
    router.push(href);
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout error:", err);
    }

    if (typeof window !== "undefined") {
      localStorage.removeItem("anjem_role");
      localStorage.removeItem("anjem_user");
    }

    setRole(null);
    setUserName("");
    setMobileOpen(false);
    router.push("/masuk");
  };

  const isHome = pathname === "/";
  const activeRole = mounted ? role : null;
  const isAdmin = activeRole === "admin" || pathname.startsWith("/admin");
  const isDriver = activeRole === "driver" || pathname.startsWith("/driver");
  const isCustomer = activeRole === "customer" || pathname.startsWith("/dashboard");

  // Track tab query param untuk admin (?tab=fares)
  const [currentTab, setCurrentTab] = useState<string>("");

  useEffect(() => {
    const syncTab = () => {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        setCurrentTab(params.get("tab") || "");
      }
    };
    syncTab();
    window.addEventListener("popstate", syncTab);
    window.addEventListener("admin_tab_change", syncTab);
    return () => {
      window.removeEventListener("popstate", syncTab);
      window.removeEventListener("admin_tab_change", syncTab);
    };
  }, [pathname]);

  const isFaresActive = pathname === "/admin" && currentTab === "fares";
  const isDriversActive = pathname === "/admin" && currentTab === "drivers";
  const isLogsActive = pathname === "/admin" && currentTab === "logs";
  const isReviewsActive = pathname === "/admin" && currentTab === "reviews";
  const isDashboardActive =
    pathname === "/admin" &&
    currentTab !== "fares" &&
    currentTab !== "drivers" &&
    currentTab !== "logs" &&
    currentTab !== "reviews";
  const isUlasanActive = pathname === "/ulasan";

  const handleAdminNav = (target: "dashboard" | "drivers" | "fares" | "logs" | "reviews") => {
    setMobileOpen(false);
    if (pathname === "/admin") {
      const url = new URL(window.location.href);
      if (target === "fares") {
        url.searchParams.set("tab", "fares");
      } else if (target === "drivers") {
        url.searchParams.set("tab", "drivers");
      } else if (target === "logs") {
        url.searchParams.set("tab", "logs");
      } else if (target === "reviews") {
        url.searchParams.set("tab", "reviews");
      } else {
        url.searchParams.delete("tab");
      }
      window.history.pushState({}, "", url.toString());
      window.dispatchEvent(new Event("admin_tab_change"));
    } else {
      if (target === "fares") router.push("/admin?tab=fares");
      else if (target === "drivers") router.push("/admin?tab=drivers");
      else if (target === "logs") router.push("/admin?tab=logs");
      else if (target === "reviews") router.push("/admin?tab=reviews");
      else router.push("/admin");
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="container-main py-3">
          <div
            className={cn(
              "navbar-inner transition-all duration-300",
              scrolled ? "shadow-lg" : "shadow-md"
            )}
          >
            {/* Logo Brand */}
            <Link
              href="/"
              className="flex items-center gap-2.5 font-extrabold text-[17px] text-slate-900 no-underline group"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Bike size={16} strokeWidth={2.5} />
              </span>
              <span className="tracking-tight">
                Anjem<span className="text-blue-600">UIN</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-1">
              {isAdmin ? (
                // Admin Nav Links: Dashboard, Kelola Driver, Layanan dan Tarif Zona, Ulasan
                <>
                  <button
                    type="button"
                    onClick={() => handleAdminNav("dashboard")}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
                      isDashboardActive
                        ? "bg-purple-100 text-purple-700 shadow-2xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdminNav("drivers")}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer",
                      isDriversActive
                        ? "bg-purple-100 text-purple-700 font-bold shadow-2xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    Kelola Driver
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdminNav("fares")}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer",
                      isFaresActive
                        ? "bg-purple-100 text-purple-700 font-bold shadow-2xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    Layanan dan Tarif Zona
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdminNav("logs")}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer",
                      isLogsActive
                        ? "bg-purple-100 text-purple-700 font-bold shadow-2xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    Audit Log Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdminNav("reviews")}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer",
                      isReviewsActive
                        ? "bg-purple-100 text-purple-700 font-bold shadow-2xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    Ulasan
                  </button>
                </>
              ) : isDriver ? (
                // Driver Nav Links
                <>
                  <Link
                    href="/driver"
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all",
                      pathname === "/driver"
                        ? "bg-emerald-100 text-emerald-700 shadow-2xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    Dashboard Driver
                  </Link>
                  <Link
                    href="/tarif"
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all",
                      pathname === "/tarif"
                        ? "bg-emerald-100 text-emerald-700 shadow-2xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    Struktur Tarif
                  </Link>
                  <Link
                    href="/bantuan"
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all",
                      pathname === "/bantuan"
                        ? "bg-emerald-100 text-emerald-700 shadow-2xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    Bantuan CS
                  </Link>
                  <Link
                    href="/"
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center gap-1"
                  >
                    Lihat Web Publik
                    <ExternalLink size={12} />
                  </Link>
                </>
              ) : (
                // Public & Customer Links
                <>
                  <button
                    type="button"
                    onClick={() => handleNavClick("#layanan")}
                    className="px-3.5 py-2 rounded-full text-sm font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                  >
                    Layanan
                  </button>

                  {/* Dropdown Cek Ongkir */}
                  <div className="relative">
                    <button
                      type="button"
                      className="flex items-center gap-1 px-3.5 py-2 rounded-full text-sm font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                      onClick={() =>
                        setOpenDropdown(openDropdown === "Cek Ongkir" ? null : "Cek Ongkir")
                      }
                      aria-expanded={openDropdown === "Cek Ongkir"}
                    >
                      Cek Ongkir
                      <ChevronDown
                        size={14}
                        className={cn(
                          "transition-transform",
                          openDropdown === "Cek Ongkir" ? "rotate-180" : ""
                        )}
                      />
                    </button>
                    {openDropdown === "Cek Ongkir" && (
                      <div
                        className="absolute top-full left-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50"
                        onMouseLeave={() => setOpenDropdown(null)}
                      >
                        <button
                          type="button"
                          onClick={() => handleNavClick("#kalkulator")}
                          className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          Kalkulator Ongkir Live
                        </button>
                        <Link
                          href="/tarif"
                          onClick={() => setOpenDropdown(null)}
                          className="block w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          Tabel Zona Tarif & Pricelist
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleNavClick("#kalkulator")}
                          className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          Pilihan Rute Populer
                        </button>
                      </div>
                    )}
                  </div>

                  <Link
                    href="/ulasan"
                    className="px-3.5 py-2 rounded-full text-sm font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all"
                  >
                    Ulasan
                  </Link>

                  <Link
                    href="/bantuan"
                    className="px-3.5 py-2 rounded-full text-sm font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all"
                  >
                    FAQ
                  </Link>
                </>
              )}
            </div>

            {/* Right Action Buttons */}
            <div className="hidden lg:flex items-center gap-2">
              {isAdmin ? (
                <div className="flex items-center gap-2">
                  <span className="badge badge-purple text-[10px] py-1 px-2.5 font-bold flex items-center gap-1">
                    <Shield size={12} />
                    Admin
                  </span>
                  <button
                    onClick={handleLogout}
                    className="btn btn-outline btn-sm text-xs text-red-600 hover:text-red-700 hover:border-red-300 hover:bg-red-50 flex items-center gap-1"
                  >
                    <LogOut size={13} />
                    Keluar
                  </button>
                </div>
              ) : isDriver ? (
                <div className="flex items-center gap-2">
                  <span className="badge badge-green text-[10px] py-1 px-2.5 font-bold flex items-center gap-1">
                    <Bike size={12} />
                    Mitra Driver
                  </span>
                  <button
                    onClick={handleLogout}
                    className="btn btn-outline btn-sm text-xs text-red-600 hover:text-red-700 hover:border-red-300 hover:bg-red-50 flex items-center gap-1"
                  >
                    <LogOut size={13} />
                    Keluar
                  </button>
                </div>
              ) : isCustomer ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/dashboard"
                    className="btn btn-outline btn-sm text-xs flex items-center gap-1.5"
                  >
                    <User size={13} />
                    Pesanan Saya
                  </Link>
                  <Link
                    href="/pesan"
                    className="btn btn-primary btn-sm text-xs flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
                  >
                    Pesan
                    <ArrowRight size={13} />
                  </Link>
                  <button
                    onClick={handleLogout}
                    title="Keluar"
                    className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/masuk" className="btn btn-ghost btn-sm text-xs">
                    Masuk
                  </Link>
                  <Link href="/daftar" className="btn btn-primary btn-sm text-xs">
                    Daftar
                  </Link>
                  {pathname !== "/pesan" && (
                    <Link
                      href="/pesan"
                      className="ml-1 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs flex items-center gap-1 transition-colors"
                    >
                      Pesan Sekarang
                      <ArrowRight size={13} />
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Menu navigasi"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer panel */}
          <div className="relative ml-auto w-80 max-w-full h-full bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <Link
                href="/"
                className="flex items-center gap-2 font-extrabold text-slate-900"
                onClick={() => setMobileOpen(false)}
              >
                <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-600 text-white">
                  <Bike size={16} strokeWidth={2.5} />
                </span>
                {siteConfig.name}
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100"
                aria-label="Tutup menu"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-1 text-sm">
              {isAdmin ? (
                <>
                  <div className="px-3 py-2 text-xs font-bold text-purple-600 uppercase tracking-wider">
                    Panel Pengelola
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAdminNav("dashboard")}
                    className={cn(
                      "w-full text-left px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer",
                      isDashboardActive
                        ? "bg-purple-50 text-purple-700"
                        : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdminNav("drivers")}
                    className={cn(
                      "w-full text-left px-4 py-2.5 rounded-xl font-medium transition-all cursor-pointer",
                      isDriversActive
                        ? "bg-purple-50 text-purple-700 font-bold"
                        : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    Kelola Driver
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdminNav("fares")}
                    className={cn(
                      "w-full text-left px-4 py-2.5 rounded-xl font-medium transition-all cursor-pointer",
                      isFaresActive
                        ? "bg-purple-50 text-purple-700 font-bold"
                        : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    Layanan dan Tarif Zona
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdminNav("logs")}
                    className={cn(
                      "w-full text-left px-4 py-2.5 rounded-xl font-medium transition-all cursor-pointer",
                      isLogsActive
                        ? "bg-purple-50 text-purple-700 font-bold"
                        : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    Audit Log Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdminNav("reviews")}
                    className={cn(
                      "w-full text-left px-4 py-2.5 rounded-xl font-medium transition-all cursor-pointer",
                      isReviewsActive
                        ? "bg-purple-50 text-purple-700 font-bold"
                        : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    Ulasan
                  </button>
                </>
              ) : isDriver ? (
                <>
                  <div className="px-3 py-2 text-xs font-bold text-emerald-600 uppercase tracking-wider">
                    Panel Driver
                  </div>
                  <Link
                    href="/driver"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "block px-4 py-2.5 rounded-xl font-bold transition-all",
                      pathname === "/driver"
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-700 hover:bg-slate-50 font-medium"
                    )}
                  >
                    Dashboard Driver
                  </Link>
                  <Link
                    href="/tarif"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "block px-4 py-2.5 rounded-xl font-bold transition-all",
                      pathname === "/tarif"
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-700 hover:bg-slate-50 font-medium"
                    )}
                  >
                    Struktur Tarif
                  </Link>
                  <Link
                    href="/bantuan"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "block px-4 py-2.5 rounded-xl font-bold transition-all",
                      pathname === "/bantuan"
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-700 hover:bg-slate-50 font-medium"
                    )}
                  >
                    Pusat Bantuan
                  </Link>
                  <Link
                    href="/"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 rounded-xl font-medium text-blue-600 hover:bg-blue-50"
                  >
                    Buka Beranda Publik →
                  </Link>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleNavClick("#layanan")}
                    className="w-full text-left px-4 py-2.5 rounded-xl font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600"
                  >
                    Layanan
                  </button>
                  <button
                    onClick={() => handleNavClick("#kalkulator")}
                    className="w-full text-left px-4 py-2.5 rounded-xl font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600"
                  >
                    Kalkulator Ongkir
                  </button>
                  <Link
                    href="/tarif"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 rounded-xl font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600"
                  >
                    Struktur Tarif
                  </Link>
                  <Link
                    href="/ulasan"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 rounded-xl font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600"
                  >
                    Ulasan Pelanggan
                  </Link>
                  <Link
                    href="/bantuan"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 rounded-xl font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600"
                  >
                    Pusat Bantuan & FAQ
                  </Link>
                  <Link
                    href="/pesan"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 rounded-xl font-bold text-white bg-blue-600 shadow-md text-center mt-2"
                  >
                    Pesan Layanan Sekarang
                  </Link>
                </>
              )}
            </nav>

            <div className="p-4 border-t border-slate-100 space-y-2">
              {isAdmin || isDriver || isCustomer ? (
                <button
                  onClick={handleLogout}
                  className="btn btn-outline w-full justify-center text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Keluar dari Akun
                </button>
              ) : (
                <>
                  <Link
                    href="/masuk"
                    className="btn btn-outline w-full justify-center"
                    onClick={() => setMobileOpen(false)}
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/daftar"
                    className="btn btn-primary w-full justify-center"
                    onClick={() => setMobileOpen(false)}
                  >
                    Daftar
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
