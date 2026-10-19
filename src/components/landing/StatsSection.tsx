import { TrendingUp, Users, Star, Wifi } from "lucide-react";
import { siteConfig } from "@/config/site";

export default function StatsSection() {
  const { isDemoMode, statsOverride } = siteConfig;

  const stats = [
    {
      id: "orders",
      icon: TrendingUp,
      iconClass: "icon-box-blue",
      value: isDemoMode || statsOverride.enabled
        ? statsOverride.ordersCompleted === 0
          ? "—"
          : `${statsOverride.ordersCompleted.toLocaleString("id-ID")}+`
        : "—",
      label: "Pesanan Selesai",
      sublabel: isDemoMode ? "Belum tersedia (mode demo)" : "Total pesanan berhasil dikirim",
    },
    {
      id: "drivers",
      icon: Wifi,
      iconClass: "icon-box-green",
      value: isDemoMode || statsOverride.enabled
        ? statsOverride.driversOnline === 0
          ? "—"
          : statsOverride.driversOnline.toString()
        : "—",
      label: "Driver Standby",
      sublabel: "Siap menerima order di areamu",
      isLive: !isDemoMode,
    },
    {
      id: "rating",
      icon: Star,
      iconClass: "icon-box-orange",
      value: isDemoMode || statsOverride.enabled
        ? statsOverride.ratingAvg === 0
          ? "—"
          : `${statsOverride.ratingAvg.toFixed(1)} / 5.0`
        : "—",
      label: "Rating Layanan",
      sublabel:
        statsOverride.reviewCount > 0
          ? `Dari ${statsOverride.reviewCount} ulasan terverifikasi`
          : "Belum ada ulasan",
    },
  ];

  return (
    <section className="py-8 -mt-8 relative z-10">
      <div className="container-main">
        {isDemoMode && (
          <div className="demo-banner mb-6">
            <span>📊</span>
            <span>
              Statistik belum tersedia — layanan dalam mode demo. Angka akan
              muncul setelah operasional dan database Supabase terhubung.
            </span>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.id}
                className="card flex items-center gap-4"
              >
                <div className={`icon-box ${stat.iconClass} flex-shrink-0`}>
                  <Icon size={22} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-extrabold text-slate-900 leading-none">
                      {stat.value}
                    </span>
                    {stat.isLive && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
                        <span
                          className="w-2 h-2 rounded-full bg-green-500 animate-pulse-dot inline-block"
                        />
                        Live
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">
                    {stat.label}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {stat.sublabel}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
