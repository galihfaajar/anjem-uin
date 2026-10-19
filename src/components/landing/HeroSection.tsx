"use client";

import Link from "next/link";
import { MessageCircle, Calculator, Clock, MapPin } from "lucide-react";
import { siteConfig } from "@/config/site";
import { buildWALink } from "@/lib/utils";
import ScooterIllustration from "./ScooterIllustration";

export default function HeroSection() {
  const waHref = buildWALink(
    siteConfig.whatsapp,
    `Halo ${siteConfig.name}! Saya ingin memesan layanan antar-jemput. Mohon bantuannya.`
  );

  const scrollToCalc = () => {
    const el = document.getElementById("kalkulator");
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <section
      id="beranda"
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #f8fafc 100%)" }}
    >
      {/* Decorative blobs */}
      <div
        className="absolute top-20 right-0 w-[600px] h-[600px] rounded-full opacity-20 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, #bfdbfe 0%, transparent 70%)",
          transform: "translate(25%, -15%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, #93c5fd 0%, transparent 70%)",
          transform: "translate(-30%, 30%)",
        }}
      />

      <div className="container-main w-full pt-8 sm:pt-12 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — text */}
          <div className="order-2 lg:order-1">
            {/* Eyebrow */}
            <div className="section-eyebrow">
              🎓 Layanan Mahasiswa UIN Raden Mas Said
            </div>

            {/* H1 */}
            <h1
              className="section-title mb-6"
              style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)" }}
            >
              Layanan Antar-Jemput{" "}
              <span className="text-blue-600">Area UIN</span> Raden Mas Said
              dan Sekitarnya
            </h1>

            <p className="section-subtitle mb-8">
              Dari antar-jemput motor harian, jastip kuliner, hingga kirim
              dokumen kilat — semua untuk kemudahan mahasiswa di Kartasura,
              Sukoharjo, dan Solo Raya.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3 mb-10">
              <Link
                href="/pesan"
                className="btn btn-primary text-base px-7 py-3.5 shadow-md shadow-blue-500/20"
              >
                Pesan via Web
              </Link>
              <a
                href={waHref === "#" ? undefined : waHref}
                target={waHref !== "#" ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="btn btn-wa text-base px-6 py-3.5"
                style={{ pointerEvents: waHref === "#" ? "none" : "auto", opacity: waHref === "#" ? 0.5 : 1 }}
              >
                <MessageCircle size={18} />
                Pesan via WhatsApp
              </a>
              <button
                onClick={scrollToCalc}
                className="btn btn-outline text-base px-6 py-3.5"
              >
                <Calculator size={18} />
                Cek Ongkir
              </button>
            </div>

            {/* Info badges */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-100 text-blue-600">
                  <Clock size={15} />
                </span>
                <div>
                  <div className="font-bold text-slate-900 text-xs leading-tight">
                    {siteConfig.operatingHours.value}
                  </div>
                  <div className="text-xs text-slate-500">Jam Layanan</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-green-100 text-green-600">
                  <MapPin size={15} />
                </span>
                <div>
                  <div className="font-bold text-slate-900 text-xs leading-tight">
                    Kartasura & Solo Raya
                  </div>
                  <div className="text-xs text-slate-500">Area Layanan</div>
                </div>
              </div>
            </div>

          </div>

          {/* Right — illustration */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <div className="animate-float w-full max-w-sm lg:max-w-md">
              <ScooterIllustration />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
