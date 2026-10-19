"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppFAB from "@/components/layout/WhatsAppFAB";
import { Star, MessageSquare, Filter, Search, ArrowRight, ShieldCheck } from "lucide-react";
import { DEMO_REVIEWS, DEMO_SERVICES } from "@/lib/data/demo";
import { formatDate } from "@/lib/utils";

export default function UlasanPage() {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredReviews = useMemo(() => {
    return DEMO_REVIEWS.filter((rev) => {
      // Filter tab
      if (selectedFilter === "5star" && rev.rating !== 5) return false;
      if (selectedFilter === "motor" && rev.service_id !== "svc-1") return false;
      if (selectedFilter === "jastip" && !["svc-2", "svc-3"].includes(rev.service_id)) return false;

      // Filter search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesComment = rev.comment.toLowerCase().includes(query);
        const matchesService = rev.service_name.toLowerCase().includes(query);
        const matchesDriver = rev.driver_name.toLowerCase().includes(query);
        return matchesComment || matchesService || matchesDriver;
      }

      return true;
    });
  }, [selectedFilter, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 pt-6 pb-16">
        <div className="container-main">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-10">
            <span className="badge badge-blue mb-3 inline-flex items-center gap-1.5">
              <MessageSquare size={13} />
              Ulasan & Kepuasan Pelanggan
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
              Cerita Pengalaman Mahasiswa Bersama Anjem UIN
            </h1>
            <p className="text-slate-600 text-base leading-relaxed">
              Ulasan nyata dari mahasiswa UIN Raden Mas Said Surakarta yang telah
              menggunakan layanan antar jemput, jastip makanan, dan pengiriman kilat.
            </p>

            {/* Rating Summary Card */}
            <div className="mt-8 p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-center gap-6 max-w-xl mx-auto">
              <div className="text-center sm:text-left flex items-center gap-3">
                <span className="text-4xl font-extrabold text-slate-900">5.0</span>
                <div>
                  <div className="flex gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} size={18} fill="#f59e0b" />
                    ))}
                  </div>
                  <span className="text-xs text-slate-500 font-medium">Berdasarkan data contoh</span>
                </div>
              </div>
              <div className="h-8 w-px bg-slate-200 hidden sm:block" />
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-full border border-emerald-200">
                <ShieldCheck size={16} />
                <span>100% Ulasan Terverifikasi Setelah Order</span>
              </div>
            </div>
          </div>

          {/* Demo Alert */}
          <div className="demo-banner max-w-3xl mx-auto mb-8">
            <span>ℹ️</span>
            <span>
              <strong>Pemberitahuan Mode Demo:</strong> Ulasan yang ditampilkan di bawah
              adalah data contoh simulasi dengan penyamaran nama pelanggan. Sistem ulasan
              publik sesungguhnya akan mencatat ulasan setelah order selesai diverifikasi.
            </span>
          </div>

          {/* Filter & Search Bar */}
          <div className="max-w-4xl mx-auto mb-8 flex flex-col sm:flex-row gap-4 justify-between items-center">
            {/* Tabs */}
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {[
                { id: "all", label: "Semua Ulasan" },
                { id: "5star", label: "⭐ Bintang 5" },
                { id: "motor", label: "🛵 Antar Jemput" },
                { id: "jastip", label: "🍔 Jastip Kuliner & Belanja" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedFilter(tab.id)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                    selectedFilter === tab.id
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari ulasan..."
                className="w-full pl-9 pr-4 py-2 bg-white rounded-full text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Reviews Grid */}
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredReviews.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
                <p className="text-sm font-medium">Tidak ada ulasan yang cocok dengan pencarianmu.</p>
              </div>
            ) : (
              filteredReviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div>
                    {/* Stars + Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex gap-0.5 text-amber-400">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} size={15} fill="#f59e0b" />
                        ))}
                      </div>
                      <span className="badge badge-blue text-[11px] py-0.5 px-2.5">
                        {review.service_name}
                      </span>
                    </div>

                    {/* Comment */}
                    <p className="text-slate-700 text-sm leading-relaxed mb-4">
                      &ldquo;{review.comment}&rdquo;
                    </p>
                  </div>

                  {/* Customer Masked Info + Driver */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div>
                      <span className="font-bold text-slate-800">{review.customer_name_masked}</span>
                      <span className="text-slate-400 mx-1.5">•</span>
                      <span>Driver: {review.driver_name}</span>
                    </div>
                    <span>{formatDate(review.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* CTA Banner */}
          <div className="mt-14 max-w-3xl mx-auto bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-center text-white shadow-lg">
            <h3 className="text-xl sm:text-2xl font-bold mb-2">
              Ingin Rasakan Layanan Cepat & Praktis Ini?
            </h3>
            <p className="text-blue-100 text-sm max-w-xl mx-auto mb-6">
              Pesan sekarang melalui WhatsApp atau gunakan formulir pemesanan web kami.
              Estimasi ongkir langsung transparan tanpa biaya tersembunyi.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/pesan" className="btn btn-secondary text-sm">
                Pesan via Web Sekarang
                <ArrowRight size={16} />
              </Link>
              <Link href="/" className="btn bg-white/20 hover:bg-white/30 text-white text-sm border-0">
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <WhatsAppFAB />
    </div>
  );
}
