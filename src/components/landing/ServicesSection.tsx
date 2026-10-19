import Link from "next/link";
import { Bike, UtensilsCrossed, ShoppingBasket, Package, ArrowRight } from "lucide-react";
import type { Service } from "@/types";

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  Bike,
  UtensilsCrossed,
  ShoppingBasket,
  Package,
};

const badgeColorMap: Record<number, string> = {
  0: "badge-blue",
  1: "badge-orange",
  2: "badge-green",
  3: "badge-purple",
};

const iconBoxColorMap: Record<number, string> = {
  0: "icon-box-blue",
  1: "icon-box-orange",
  2: "icon-box-green",
  3: "icon-box-purple",
};

const DEFAULT_SERVICES: Service[] = [
  {
    id: "svc-1",
    name: "Antar Jemput Motor",
    slug: "antar-jemput-motor",
    description: "Naik motor langsung dari lokasi kamu ke tujuan. Cepat, aman, dan terjangkau untuk mobilitas harian mahasiswa.",
    icon: "Bike",
    extra_fee: 0,
    is_active: true,
    badge_text: "Paling Populer",
    sort_order: 1,
  },
  {
    id: "svc-2",
    name: "Jastip Kuliner & Makanan",
    slug: "jastip-kuliner",
    description: "Titip beli makanan, minuman, atau jajanan favoritmu. Driver belikan dan antar langsung ke kosan.",
    icon: "UtensilsCrossed",
    extra_fee: 2000,
    is_active: true,
    badge_text: "Favorit Mahasiswa",
    sort_order: 2,
  },
  {
    id: "svc-3",
    name: "Jastip Belanja Harian & Pasar",
    slug: "jastip-belanja",
    description: "Titip belanja kebutuhan sehari-hari dari minimarket, pasar, atau toko langgananmu.",
    icon: "ShoppingBasket",
    extra_fee: 2000,
    is_active: true,
    badge_text: "Praktis & Hemat",
    sort_order: 3,
  },
  {
    id: "svc-4",
    name: "Kirim Dokumen & Paket Kilat",
    slug: "kirim-dokumen",
    description: "Kirim surat, berkas tugas, atau paket kecil antar lokasi di area layanan dengan cepat.",
    icon: "Package",
    extra_fee: 0,
    is_active: true,
    badge_text: "Instan Sampai",
    sort_order: 4,
  },
];

function ServiceCard({ service, index }: { service: Service; index: number }) {
  const Icon = iconMap[service.icon] ?? Bike;
  const badgeClass = badgeColorMap[index] ?? "badge-blue";
  const iconBoxClass = iconBoxColorMap[index] ?? "icon-box-blue";

  return (
    <Link
      href={`/pesan?service=${service.id}`}
      className="card group cursor-pointer relative overflow-hidden block no-underline"
    >
      {service.badge_text && (
        <span
          className={`badge ${badgeClass} absolute top-4 right-4`}
        >
          {service.badge_text}
        </span>
      )}
      <div className={`icon-box ${iconBoxClass} mb-4`} style={{ width: 52, height: 52 }}>
        <Icon size={24} />
      </div>
      <h3 className="font-bold text-slate-900 text-lg mb-2 pr-24">
        {service.name}
      </h3>
      <p className="text-slate-500 text-sm leading-relaxed mb-4">
        {service.description}
      </p>
      {service.extra_fee > 0 && (
        <p className="text-xs text-slate-400">
          +Rp {service.extra_fee.toLocaleString("id-ID")} biaya layanan
        </p>
      )}
      <div className="mt-4 flex items-center gap-1 text-blue-600 text-sm font-semibold group-hover:gap-2 transition-all">
        Pesan Sekarang <ArrowRight size={14} />
      </div>

      {/* Hover accent */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-b-xl"
      />
    </Link>
  );
}

export default function ServicesSection({ services: propServices }: { services?: Service[] }) {
  const services = (propServices && propServices.length > 0 ? propServices : DEFAULT_SERVICES).filter((s) => s.is_active);

  return (
    <section id="layanan" className="py-20">
      <div className="container-main">
        <div className="text-center mb-14">
          <span className="section-eyebrow">SOLUSI MOBILITAS LENGKAP</span>
          <h2 className="section-title mb-4">
            Semua Kebutuhan Antar-Jemput Jadi Mudah
          </h2>
          <p className="section-subtitle mx-auto">
            Dari bepergian harian hingga titip belanja — kami siap membantu
            dengan layanan yang terjangkau dan terpercaya.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {services.map((service, i) => (
            <ServiceCard key={service.id} service={service} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
