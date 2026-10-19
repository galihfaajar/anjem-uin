"use client";

import { useState } from "react";
import { Star, ArrowRight } from "lucide-react";
import Link from "next/link";
import { DEMO_REVIEWS, DEMO_SERVICES } from "@/lib/data/demo";
import { formatDate } from "@/lib/utils";
import { siteConfig } from "@/config/site";

type FilterKey = "semua" | "bintang5" | "antar-jemput-motor" | "jastip";

const filters: { key: FilterKey; label: string }[] = [
  { key: "semua", label: "Semua" },
  { key: "bintang5", label: "Bintang 5" },
  { key: "antar-jemput-motor", label: "Antar Jemput" },
  { key: "jastip", label: "Jastip" },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={13}
          className={n <= rating ? "star-filled" : "star-empty"}
          fill={n <= rating ? "#f59e0b" : "none"}
        />
      ))}
    </div>
  );
}

const serviceBadgeMap: Record<string, string> = {
  "svc-1": "badge-blue",
  "svc-2": "badge-orange",
  "svc-3": "badge-green",
  "svc-4": "badge-purple",
};

export default function TestimonialsSection() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("semua");

  const filtered = DEMO_REVIEWS.filter((r) => {
    if (activeFilter === "semua") return true;
    if (activeFilter === "bintang5") return r.rating === 5;
    if (activeFilter === "antar-jemput-motor") return r.service_id === "svc-1";
    if (activeFilter === "jastip")
      return r.service_id === "svc-2" || r.service_id === "svc-3";
    return true;
  });

  return (
    <section
      id="ulasan"
      className="py-20"
      style={{ background: "linear-gradient(180deg, #f8fafc 0%, #eff6ff 60%, #f8fafc 100%)" }}
    >
      <div className="container-main">
        <div className="text-center mb-10">
          <span className="section-eyebrow">TESTIMONI ASLI PENGGUNA</span>
          <h2 className="section-title mb-4">
            Apa Kata Mereka Tentang {siteConfig.name}?
          </h2>
          <p className="section-subtitle mx-auto">
            Ulasan dari pengguna nyata yang telah menggunakan layanan kami.
            Nama pelanggan disamarkan demi privasi.
          </p>
        </div>

        {/* Demo notice */}
        {siteConfig.isDemoMode && (
          <div className="demo-banner mb-8 max-w-2xl mx-auto">
            <span>📝</span>
            <span>
              Ulasan di bawah adalah data contoh (is_sample=true). Ulasan
              pelanggan nyata akan tampil setelah moderasi admin.
            </span>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-5 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
                activeFilter === f.key
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-blue-50"
              }`}
            >
              {f.label}
              {f.key === "semua" && (
                <span className="ml-1.5 text-xs opacity-70">
                  ({DEMO_REVIEWS.length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Reviews grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Star size={32} className="mx-auto mb-2 opacity-30" />
            <p>Belum ada ulasan untuk filter ini.</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
            {filtered.map((review) => {
              const badgeClass = serviceBadgeMap[review.service_id] ?? "badge-blue";
              return (
                <div
                  key={review.id}
                  className="card break-inside-avoid mb-5 hover:-translate-y-1"
                  style={{ display: "inline-block", width: "100%" }}
                >
                  {/* Rating + service */}
                  <div className="flex items-center justify-between mb-3">
                    <StarRating rating={review.rating} />
                    <span className={`badge ${badgeClass}`}>
                      {review.service_name}
                    </span>
                  </div>
                  {/* Comment */}
                  <p className="text-slate-700 text-sm leading-relaxed mb-4">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-3">
                    <div>
                      <span className="font-semibold text-slate-600">
                        {review.customer_name_masked}
                      </span>
                      <span className="mx-1">·</span>
                      <span>Driver: {review.driver_name}</span>
                    </div>
                    <span>{formatDate(review.created_at)}</span>
                  </div>
                  {review.is_sample && (
                    <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                      📋 Data contoh
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-10">
          <Link
            href="/ulasan"
            className="btn btn-outline inline-flex items-center gap-2"
          >
            Lihat Semua Ulasan ({DEMO_REVIEWS.length})
            <ArrowRight size={15} />
          </Link>
          <p className="text-xs text-slate-400 mt-3">
            Nama pelanggan disamarkan demi menjaga privasi pengguna.
          </p>
        </div>
      </div>
    </section>
  );
}
