"use client";

import { Tag, MessageCircle, ShieldCheck, Zap, Wallet, ArrowRight } from "lucide-react";
import { siteConfig } from "@/config/site";

const features = [
  {
    icon: Tag,
    iconClass: "icon-box-blue",
    title: "Tarif Transparan & Terjangkau",
    desc: "Tarif berbasis zona yang jelas — kamu bisa cek estimasi sebelum pesan. Tidak ada biaya tersembunyi.",
    link: "#kalkulator",
  },
  {
    icon: MessageCircle,
    iconClass: "icon-box-green",
    title: "Pesan Mudah via WhatsApp & Web",
    desc: "Pesan melalui WhatsApp yang familiar atau form web langsung dari browser — tanpa harus download app.",
    link: "#kalkulator",
  },
  {
    icon: ShieldCheck,
    iconClass: "icon-box-purple",
    title: "Mitra Driver Terverifikasi",
    desc: "Setiap driver menjalani verifikasi identitas sebelum aktif. Keamanan dan kenyamananmu adalah prioritas.",
    link: "#driver",
  },
  {
    icon: Zap,
    iconClass: "icon-box-orange",
    title: "Penanganan Order yang Jelas",
    desc: "Order diterima dan dikonfirmasi oleh driver terdekat. Status pesanan dapat dipantau secara transparan.",
    link: "#cara-pesan",
  },
  {
    icon: Wallet,
    iconClass: "icon-box-blue",
    title: "Pembayaran QRIS atau Tunai",
    desc: "Bayar langsung ke driver via QRIS atau tunai setelah layanan selesai. Mudah dan tidak perlu top-up.",
    link: "#faq",
  },
];

export default function FeaturesSection() {
  return (
    <section
      id="keunggulan"
      className="py-20"
      style={{ background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)" }}
    >
      <div className="container-main">
        <div className="text-center mb-14">
          <span className="section-eyebrow">
            MENGAPA MEMILIH {siteConfig.name.toUpperCase()}
          </span>
          <h2 className="section-title mb-4">
            Standar Layanan yang Selalu Mengutamakan Kamu
          </h2>
          <p className="section-subtitle mx-auto">
            Kami membangun layanan dengan fokus pada kepercayaan, kemudahan, dan
            keterjangkauan — khusus untuk komunitas kampus.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div key={i} className="card group">
                <div
                  className={`icon-box ${feat.iconClass} mb-4`}
                  style={{ width: 48, height: 48 }}
                >
                  <Icon size={20} />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-2">
                  {feat.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-4">
                  {feat.desc}
                </p>
                <a
                  href={feat.link}
                  className="inline-flex items-center gap-1 text-blue-600 text-sm font-semibold hover:gap-2 transition-all"
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.querySelector(feat.link);
                    if (el) {
                      const top = el.getBoundingClientRect().top + window.scrollY - 90;
                      window.scrollTo({ top, behavior: "smooth" });
                    }
                  }}
                >
                  Selengkapnya <ArrowRight size={14} />
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
