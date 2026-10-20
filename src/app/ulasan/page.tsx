import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppFAB from "@/components/layout/WhatsAppFAB";
import { Star, MessageSquare, ArrowRight, ShieldCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Ulasan Pelanggan – Anjem UIN",
  description: "Baca ulasan nyata dari mahasiswa UIN yang telah menggunakan layanan antar jemput dan jastip Anjem UIN.",
};

export default async function UlasanPage() {
  const supabase = await createClient();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at, service_id, customer_id, driver_id, service:services(name), driver:drivers(plate_number, profile:profiles(full_name))")
    .order("created_at", { ascending: false })
    .limit(50);

  const allReviews = (reviews || []).map((r: any) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
    service_id: r.service_id,
    service_name: r.service?.name || "Layanan",
    driver_name: r.driver?.profile?.full_name || "Driver",
    customer_name_masked: "Pelanggan UIN",
  }));

  const avgRating = allReviews.length > 0
    ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
    : "5.0";

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
                <span className="text-4xl font-extrabold text-slate-900">{avgRating}</span>
                <div>
                  <div className="flex gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} size={18} fill="#f59e0b" />
                    ))}
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {allReviews.length} ulasan
                  </span>
                </div>
              </div>
              <div className="h-8 w-px bg-slate-200 hidden sm:block" />
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-full border border-emerald-200">
                <ShieldCheck size={16} />
                <span>100% Ulasan Terverifikasi Setelah Order</span>
              </div>
            </div>
          </div>

          {/* Reviews Grid */}
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
            {allReviews.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
                <MessageSquare size={36} className="mx-auto text-slate-300 mb-3" />
                <p className="text-sm font-semibold text-slate-700 mb-1">Belum ada ulasan</p>
                <p className="text-xs text-slate-500">
                  Jadilah yang pertama memberikan ulasan setelah menggunakan layanan Anjem UIN!
                </p>
              </div>
            ) : (
              allReviews.map((review) => (
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

                  {/* Customer + Driver */}
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
        </div>
      </main>

      <Footer />
      <WhatsAppFAB />
    </div>
  );
}
