import Link from "next/link";
import { MapPin, UserCheck, CreditCard, ArrowRight } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: MapPin,
    iconClass: "icon-box-blue",
    title: "Tentukan Titik & Jenis Layanan",
    desc: "Beri tahu driver titik jemput, tujuan, dan jenis layanan yang kamu butuhkan melalui WhatsApp atau form pemesanan web.",
    label: "Tahap 1 dari 3",
  },
  {
    num: "02",
    icon: UserCheck,
    iconClass: "icon-box-green",
    title: "Driver Menerima Pesananmu",
    desc: "Driver terverifikasi akan mengonfirmasi pesananmu. Kamu akan mendapat notifikasi saat driver siap menuju lokasi jemput.",
    label: "Tahap 2 dari 3",
  },
  {
    num: "03",
    icon: CreditCard,
    iconClass: "icon-box-orange",
    title: "Tiba di Tujuan & Bayar",
    desc: "Sesampainya di tujuan, lakukan pembayaran langsung ke driver via QRIS atau tunai sesuai estimasi tarif yang telah dikonfirmasi.",
    label: "Tahap 3 dari 3",
  },
];

export default function HowToOrderSection() {
  return (
    <section id="cara-pesan" className="py-20 bg-white">
      <div className="container-main">
        <div className="text-center mb-14">
          <span className="section-eyebrow">ALUR SEDERHANA</span>
          <h2 className="section-title mb-4">Cara Pesan dalam 3 Langkah Mudah</h2>
          <p className="section-subtitle mx-auto">
            Pesan layanan Anjem UIN sangat mudah — cukup beberapa langkah dan
            driver sudah dalam perjalanan menuju kamu.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-blue-200 via-green-200 to-orange-200 -translate-y-1/2 z-0" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="card text-center relative z-10">
                {/* Step number (large faded) */}
                <div
                  className="absolute top-4 right-5 text-6xl font-black leading-none pointer-events-none select-none"
                  style={{ color: "#e2e8f0" }}
                >
                  {step.num}
                </div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {step.label}
                </span>
                <div
                  className={`icon-box ${step.iconClass} mx-auto my-4`}
                  style={{ width: 52, height: 52 }}
                >
                  <Icon size={22} />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-3 px-4">
                  {step.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/pesan"
            className="btn btn-primary inline-flex items-center gap-2 shadow-md shadow-blue-500/20"
          >
            Mulai Pesan Sekarang
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
