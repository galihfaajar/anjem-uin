import Link from "next/link";
import { Bike, MessageCircle, Phone, MapPin, ShieldCheck } from "lucide-react";
import { siteConfig } from "@/config/site";
import { buildWALink } from "@/lib/utils";

const footerLinks = {
  layanan: [
    { label: "Antar Jemput Motor", href: "/#layanan" },
    { label: "Jastip Kuliner Kampus", href: "/#layanan" },
    { label: "Jastip Belanja Pasar", href: "/#layanan" },
    { label: "Kirim Dokumen & Paket", href: "/#layanan" },
  ],
  eksplorasi: [
    { label: "Kalkulator Tarif Ongkir", href: "/tarif" },
    { label: "Ulasan & Testimoni", href: "/ulasan" },
    { label: "Tanya Jawab (FAQ)", href: "/#faq" },
  ],
  bantuan: [
    {
      label: "WhatsApp CS (24 Jam)",
      href: buildWALink(
        siteConfig.whatsapp,
        `Halo ${siteConfig.name}, saya butuh bantuan.`
      ),
      external: true,
    },
    { label: "Pusat Bantuan", href: "/bantuan" },
    { label: "Syarat & Ketentuan", href: "/syarat" },
    { label: "Kebijakan Privasi", href: "/privasi" },
  ],
};

export default function Footer() {
  return (
    <footer className="mt-24 sm:mt-32 w-full bg-slate-950 text-slate-300 border-t border-slate-800/90 relative overflow-hidden">
      {/* Decorative subtle blue highlight bar at very top of footer */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

      {/* Main footer container with generous padding */}
      <div className="container-main pt-16 sm:pt-20 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12 xl:gap-16">
          {/* Brand column */}
          <div className="lg:col-span-2 space-y-5">
            <Link
              href="/"
              className="inline-flex items-center gap-3 font-extrabold text-lg text-white no-underline group"
            >
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
                <Bike size={20} strokeWidth={2.5} />
              </span>
              <div className="flex flex-col">
                <span className="text-white text-lg font-black tracking-tight leading-tight">
                  {siteConfig.name}
                </span>
                <span className="text-[11px] text-blue-400 font-semibold tracking-wider uppercase">
                  Layanan Mahasiswa UIN RMS
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              {siteConfig.description}
            </p>

            <div className="pt-2 space-y-3 text-xs sm:text-sm text-slate-400">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400 flex-shrink-0">
                  <MapPin size={15} />
                </div>
                <span>{siteConfig.campus}, Kartasura, Sukoharjo</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <Phone size={15} />
                </div>
                <span>
                  {siteConfig.whatsapp === "628XXXXXXXXXX"
                    ? "WhatsApp Customer Service Siaga 24 Jam"
                    : `+${siteConfig.whatsapp}`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400 flex-shrink-0">
                  <ShieldCheck size={15} />
                </div>
                <span>Tarif Transparan & Terverifikasi Mahasiswa</span>
              </div>
            </div>
          </div>

          {/* Links Columns */}
          <FooterLinkColumn title="Layanan" links={footerLinks.layanan} />
          <FooterLinkColumn title="Eksplorasi" links={footerLinks.eksplorasi} />
          <FooterLinkColumn title="Bantuan" links={footerLinks.bantuan} />
        </div>
      </div>

      {/* Bottom bar with generous breathing room and clear border */}
      <div className="border-t border-slate-800/80 bg-slate-950/90">
        <div className="container-main py-8 flex flex-col sm:flex-row items-center justify-between gap-5 text-xs text-slate-400">
          <p className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <span>© {new Date().getFullYear()} {siteConfig.name}. Semua hak dilindungi.</span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="text-slate-500">
              Dibuat untuk Mahasiswa UIN Raden Mas Said Solo
            </span>
          </p>
          <div className="flex items-center gap-6 sm:gap-8 text-xs">
            <Link
              href="/privasi"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Privasi
            </Link>
            <Link
              href="/syarat"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Syarat Layanan
            </Link>
            <Link
              href="/tarif"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Tarif Transparan
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLinkColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string; external?: boolean }[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        <h3
          className="font-bold text-white text-xs uppercase tracking-wider block"
          style={{ color: "#ffffff", letterSpacing: "0.08em" }}
        >
          {title}
        </h3>
      </div>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              className="text-xs sm:text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2 group"
            >
              {link.label.includes("WhatsApp") ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              ) : null}
              <span className="group-hover:translate-x-0.5 transition-transform">
                {link.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
