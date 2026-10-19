"use client";

import { useState } from "react";
import { ChevronDown, Map } from "lucide-react";
import dynamic from "next/dynamic";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import type { Faq } from "@/types";

// Lazy-load map to avoid SSR issues with Leaflet
const ServiceAreaMap = dynamic(() => import("./ServiceAreaMap"), {
  ssr: false,
  loading: () => (
    <div
      className="skeleton rounded-2xl"
      style={{ height: 380 }}
      role="status"
      aria-label="Memuat peta..."
    />
  ),
});

const DEFAULT_FAQS: Faq[] = [
  {
    id: "faq-1",
    question: "Bagaimana cara memesan layanan Anjem UIN?",
    answer: "Kamu bisa pesan melalui menu Formulir Pemesanan di website ini atau via WhatsApp. Masukkan rute penjemputan dan tujuan, sistem akan langsung mencarikan driver terdekat.",
    sort_order: 1,
  },
  {
    id: "faq-2",
    question: "Berapa tarif layanan antar-jemput?",
    answer: "Tarif dihitung transparan sesuai zona jarak kampus UIN RM Said Surakarta. Mulai Rp 5.000 untuk area sekitar kampus.",
    sort_order: 2,
  },
  {
    id: "faq-3",
    question: "Di mana saja area yang dilayani?",
    answer: "Area layanan mencakup kawasan kampus UIN Raden Mas Said, Kartasura, Sukoharjo, hingga Solo Raya.",
    sort_order: 3,
  },
  {
    id: "faq-4",
    question: "Apa saja metode pembayaran yang diterima?",
    answer: "Mendukung pembayaran tunai (cash) langsung ke driver atau via QRIS pribadi driver saat sampai di tujuan.",
    sort_order: 4,
  },
  {
    id: "faq-5",
    question: "Apakah driver sudah terverifikasi?",
    answer: "Semua mitra driver adalah mahasiswa atau mitra lokal yang telah melalui proses verifikasi identitas dan kendaraan oleh admin kampus.",
    sort_order: 5,
  },
];

function AccordionItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="accordion-item">
      <button
        className="accordion-trigger"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`faq-${question.slice(0, 10)}`}
      >
        <span>{question}</span>
        <ChevronDown
          size={18}
          className={cn(
            "text-slate-400 transition-transform shrink-0 ml-4",
            isOpen ? "rotate-180 text-blue-600" : ""
          )}
        />
      </button>
      <div
        id={`faq-${question.slice(0, 10)}`}
        className="accordion-content"
        style={{ maxHeight: isOpen ? "500px" : "0" }}
        role="region"
      >
        <div className="accordion-content-inner">{answer}</div>
      </div>
    </div>
  );
}

interface CoverageAndFaqSectionProps {
  faqs?: Faq[];
}

export default function CoverageAndFaqSection({
  faqs: propFaqs,
}: CoverageAndFaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const faqs = propFaqs && propFaqs.length > 0 ? propFaqs : DEFAULT_FAQS;

  return (
    <section id="jangkauan" className="py-20 bg-white">
      <div className="container-main">
        {/* === COVERAGE MAP === */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <span className="section-eyebrow">WILAYAH JANGKAUAN</span>
            <h2 className="section-title mb-4">Area Layanan Kami</h2>
            <p className="section-subtitle mx-auto">
              Melayani kawasan kampus UIN Raden Mas Said Surakarta dan sekitarnya.
              Area resmi akan diperbarui setelah konfirmasi operasional.
            </p>
          </div>

          {/* Area chips */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {siteConfig.serviceArea.regions.map((region) => (
              <span
                key={region}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold border border-blue-200"
              >
                <Map size={12} />
                {region}
              </span>
            ))}
          </div>

          {/* Map */}
          <ServiceAreaMap />
        </div>

        {/* === FAQ === */}
        <div id="faq">
          <div className="text-center mb-10">
            <span className="section-eyebrow">TANYA JAWAB</span>
            <h2 className="section-title mb-4">Pertanyaan yang Sering Diajukan</h2>
            <p className="section-subtitle mx-auto">
              Tidak menemukan jawaban yang kamu cari?{" "}
              <a href="#" className="text-blue-600 font-semibold hover:underline">
                Hubungi kami via WhatsApp.
              </a>
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={faq.id}
                question={faq.question}
                answer={faq.answer}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
