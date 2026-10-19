"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppFAB from "@/components/layout/WhatsAppFAB";
import {
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  Clock,
  MapPin,
  ChevronDown,
  Search,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { DEMO_FAQS } from "@/lib/data/demo";
import { buildWALink } from "@/lib/utils";

const helpCategories = [
  {
    title: "Pemesanan & Alur",
    items: [
      {
        q: "Bagaimana alur pemesanan Anjem UIN?",
        a: "Kamu dapat memesan langsung melalui tombol WhatsApp atau mengisi formulir pemesanan web di menu 'Pesan'. Tentukan titik jemput, tujuan, dan layanan. Driver yang standby akan menerima dan segera menuju lokasimu.",
      },
      {
        q: "Apakah bisa memesan untuk jam tertentu (jadwal besok)?",
        a: "Saat ini pemesanan terfokus pada layanan on-demand (langsung jalan). Untuk pemesanan terjadwal khusus (misal keberangkatan subuh ke stasiun/bandara), silakan hubungi admin WhatsApp terlebih dahulu.",
      },
    ],
  },
  {
    title: "Tarif & Pembayaran",
    items: [
      {
        q: "Kapan saya harus membayar ongkos antar?",
        a: "Pembayaran dilakukan setelah perjalanan selesai atau setelah pesanan jastip/dokumen tiba di lokasimu. Kamu bisa membayar tunai (cash) atau scan QRIS langsung milik driver.",
      },
      {
        q: "Bagaimana jika ada biaya tol atau parkir?",
        a: "Biaya parkir di lokasi umum (misal stasiun, mall, rumah sakit) menjadi tanggungan pemesan dan dibayarkan langsung kepada driver.",
      },
    ],
  },
  {
    title: "Keamanan & Barang Bawaan",
    items: [
      {
        q: "Apakah helm disediakan oleh driver?",
        a: "Ya, setiap mitra driver antar-jemput motor wajib menyediakan helm standar SNI yang bersih untuk kenyamanan dan keselamatan penumpang.",
      },
      {
        q: "Bagaimana jika ada barang tertinggal di motor driver?",
        a: "Segera hubungi admin WhatsApp resmi kami dengan menyebutkan ID order atau nama driver. Admin akan langsung mengoordinasikan dengan driver terkait.",
      },
    ],
  },
];

export default function BantuanPage() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({ "faq-0-0": true });
  const [search, setSearch] = useState("");

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const waAdminHref = buildWALink(
    siteConfig.whatsapp,
    "Halo Admin Anjem UIN, saya ingin menanyakan bantuan terkait layanan..."
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 pt-6 pb-16">
        <div className="container-main">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-12">
            <span className="badge badge-blue mb-3 inline-flex items-center gap-1.5">
              <HelpCircle size={13} />
              Pusat Bantuan & Layanan Pelanggan
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
              Ada yang Bisa Kami Bantu?
            </h1>
            <p className="text-slate-600 text-base leading-relaxed">
              Temukan jawaban atas pertanyaan seputar layanan Anjem UIN atau hubungi
              layanan pelanggan kami jika memerlukan panduan lebih lanjut.
            </p>
          </div>

          {/* Quick Contact Cards */}
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 mb-14">
            <a
              href={waAdminHref}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-green-400 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <MessageCircle size={22} />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">WhatsApp Customer Service</h3>
              <p className="text-xs text-slate-500 mb-2">Respon cepat via pesan WhatsApp resmi</p>
              <span className="text-xs font-semibold text-green-600 inline-flex items-center gap-1">
                Chat Sekarang <ExternalLink size={12} />
              </span>
            </a>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <Clock size={22} />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Jam Operasional</h3>
              <p className="text-xs text-slate-500 mb-1">{siteConfig.operatingHours.value}</p>
              <span className="text-[11px] text-slate-400">Siap melayani kebutuhan harianmu</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <Mail size={22} />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Email Pengaduan</h3>
              <p className="text-xs text-slate-500 mb-1">{siteConfig.email}</p>
              <span className="text-[11px] text-slate-400">Untuk kritik, saran, atau kemitraan</span>
            </div>
          </div>

          {/* FAQ Sections */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
              Pertanyaan yang Sering Diajukan (FAQ)
            </h2>

            <div className="space-y-8">
              {helpCategories.map((category, catIdx) => (
                <div key={catIdx} className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden p-6">
                  <h3 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
                    <span className="w-2 h-4 bg-blue-600 rounded-full" />
                    {category.title}
                  </h3>

                  <div className="space-y-3">
                    {category.items.map((item, itemIdx) => {
                      const key = `faq-${catIdx}-${itemIdx}`;
                      const isOpen = !!openItems[key];

                      return (
                        <div
                          key={itemIdx}
                          className="border border-slate-200 rounded-xl overflow-hidden transition-all"
                        >
                          <button
                            onClick={() => toggleItem(key)}
                            className="w-full text-left p-4 flex items-center justify-between gap-4 font-semibold text-slate-800 text-sm hover:bg-slate-50 transition-colors"
                          >
                            <span>{item.q}</span>
                            <ChevronDown
                              size={16}
                              className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                                isOpen ? "rotate-180 text-blue-600" : ""
                              }`}
                            />
                          </button>
                          {isOpen && (
                            <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50/50 border-t border-slate-100">
                              {item.a}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Hubungi jika belum terjawab */}
            <div className="mt-12 bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center">
              <h3 className="font-bold text-slate-900 text-base mb-1">
                Masih memiliki pertanyaan yang belum terjawab?
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm mb-4">
                Tim admin Anjem UIN siap membantumu secara langsung melalui pesan WhatsApp.
              </p>
              <a
                href={waAdminHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary text-xs sm:text-sm inline-flex items-center gap-2"
              >
                <MessageCircle size={16} />
                Hubungi Admin Sekarang
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <WhatsAppFAB />
    </div>
  );
}
