import { TrendingUp, Users, Star, Wifi } from "lucide-react";
import { siteConfig } from "@/config/site";

export default function StatsSection() {
  const { statsOverride } = siteConfig;

  const stats = [
    {
      id: "orders",
      icon: TrendingUp,
      iconClass: "icon-box-blue",
      value: statsOverride.enabled
        ? statsOverride.ordersCompleted === 0
          ? "—"
          : `${statsOverride.ordersCompleted.toLocaleString("id-ID")}+`
        : "150+",
      label: "Pesanan Selesai",
      sublabel: "Total pesanan berhasil dikirim",
    },
    {
      id: "drivers",
      icon: Wifi,
      iconClass: "icon-box-green",
      value: statsOverride.enabled
        ? statsOverride.driversOnline === 0
          ? "—"
          : statsOverride.driversOnline.toString()
        : "Aktif",
      label: "Driver Standby",
      sublabel: "Siap menerima order di areamu",
      isLive: true,
    },
    {
      id: "rating",
      icon: Star,
      iconClass: "icon-box-orange",
      value: statsOverride.enabled
        ? statsOverride.ratingAvg === 0
          ? "—"
          : `${statsOverride.ratingAvg.toFixed(1)} / 5.0`
        : "5.0 / 5.0",
      label: "Rating Layanan",
      sublabel:
        statsOverride.reviewCount > 0
          ? `Dari ${statsOverride.reviewCount} ulasan terverifikasi`
          : "Kepuasan mahasiswa terjamin",
    },
  ];

  return (
    <section className="pt-10 pb-8 sm:pt-14 sm:pb-10 relative z-10">
      <div className="container-main">
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
