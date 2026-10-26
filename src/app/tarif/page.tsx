import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppFAB from "@/components/layout/WhatsAppFAB";
import {
  Tag,
  Calculator,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Bike,
  UtensilsCrossed,
  Package,
  ShoppingBasket,
} from "lucide-react";
import { formatRupiah, calculateFare } from "@/lib/pricing/calculateFare";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tarif Layanan – Anjem UIN",
  description: "Informasi tarif dan zona layanan antar jemput, jastip kuliner, dan pengiriman dokumen Anjem UIN.",
};

export default async function TarifPage() {
  const supabase = await createClient();

  const [{ data: fareZones }, { data: services }, { data: popularRoutes }] = await Promise.all([
    supabase.from("fare_zones").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("services").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("popular_routes").select("*").eq("is_active", true).order("sort_order"),
  ]);

  const zones = fareZones || [];
  const svcs = services || [];
  const routes = popularRoutes || [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 pt-6 pb-16">
        <div className="container-main">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-10">
            <span className="badge badge-blue mb-3 inline-flex items-center gap-1.5">
              <Tag size={13} />
              Struktur Tarif Transparan
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
              Tarif Terjangkau, Khusus Mahasiswa UIN
            </h1>
            <p className="text-slate-600 text-base leading-relaxed">
              Ketahui rincian tarif sebelum memesan. Tanpa biaya tersembunyi, sistem zona
              yang jelas, dan ramah di kantong mahasiswa.
            </p>
          </div>

          {/* Disclaimer Banner */}
          <div className="p-3.5 rounded-xl border bg-amber-50 border-amber-200 text-amber-800 flex items-center gap-2.5 max-w-4xl mx-auto mb-10">
            <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm">
              <strong className="font-bold">Perhatian:</strong> Tarif resmi operasional
              ditetapkan oleh pengelola Anjem UIN dan dapat berubah sewaktu-waktu. Konfirmasi tarif
              final dilakukan saat pemesanan.
            </div>
          </div>

          {/* Zona Tarif Grid */}
          <div className="max-w-4xl mx-auto mb-14">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="w-2.5 h-6 bg-blue-600 rounded-full inline-block" />
              Tabel Zona Tarif Layanan Resmi
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm relative overflow-hidden flex flex-col justify-between"
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ backgroundColor: zone.color || "#3b82f6" }}
                  />

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {zone.name}
                      </span>
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${zone.color || "#3b82f6"}15`,
                          color: zone.color || "#3b82f6",
                        }}
                      >
                        {zone.max_km ? `${zone.min_km} – ${zone.max_km} km` : `> ${zone.min_km} km`}
                      </span>
                    </div>

                    <div className="text-2xl font-extrabold text-slate-900 mb-1">
                      {formatRupiah(zone.base_price)}
                    </div>

                    <p className="text-xs text-slate-500 mb-4">
                      {zone.max_km
                        ? `Tarif flat untuk jarak hingga ${zone.max_km} km`
                        : `Tarif dasar + ${formatRupiah(zone.per_km_price)}/km di atas ${zone.min_km} km`}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      <span>Termasuk jemput di lokasi</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      <span>Helm bersih & safety</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ketentuan Biaya Tambahan & Jastip Resmi */}
          <div className="max-w-4xl mx-auto mb-14">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="w-2.5 h-6 bg-blue-600 rounded-full inline-block" />
              Biaya Tambahan Operasional &amp; Ketentuan Jastip
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Box Kondisi Lapangan & Waktu */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  Kondisi Khusus &amp; Jam Layanan
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <strong className="text-slate-800 block">☔ Saat Cuaca Hujan:</strong>
                      <span className="text-slate-500 text-[11px]">
                        Dinyalakan oleh driver melalui toggle jika kondisi di lapangan sedang hujan
                      </span>
                    </div>
                    <span className="font-extrabold text-blue-600 whitespace-nowrap">+Rp2.000</span>
                  </div>

                  <div className="flex items-start justify-between gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <strong className="text-slate-800 block">🌙 Order di Atas Pukul 22.30 WIB:</strong>
                      <span className="text-slate-500 text-[11px]">
                        Otomatis terdeteksi dan ditambahkan oleh sistem untuk operasional larut malam
                      </span>
                    </div>
                    <span className="font-extrabold text-indigo-600 whitespace-nowrap">+Rp1.000</span>
                  </div>

                  <div className="flex items-start justify-between gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <strong className="text-slate-800 block">📍 Anjem Mampir ke Tempat Tambahan:</strong>
                      <span className="text-slate-500 text-[11px]">
                        Dikenakan per titik mampir tambahan sebelum sampai di titik akhir
                      </span>
                    </div>
                    <span className="font-extrabold text-slate-800 whitespace-nowrap">+Rp1.000/tempat</span>
                  </div>
                </div>
              </div>

              {/* Box Ketentuan Jastip */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  🛍️ Aturan Layanan Jastip
                </h3>

                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-start justify-between gap-2">
                    <span>• <strong>1 Tempat Belanja:</strong> Bebas biaya tempat</span>
                    <span className="font-bold text-emerald-600">Gratis</span>
                  </li>
                  <li className="flex items-start justify-between gap-2">
                    <span>• <strong>Pindah Tempat Belanja:</strong> Tambah titik toko/warung</span>
                    <span className="font-bold text-slate-800">+Rp2.000/tempat</span>
                  </li>
                  <li className="flex items-start justify-between gap-2">
                    <span>• <strong>Titipan Lebih dari 3 Item:</strong> Dihitung per item ke-4 dst</span>
                    <span className="font-bold text-slate-800">+Rp1.000/item</span>
                  </li>
                  <li className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed">
                    <strong>Catatan Foodcourt / Pujasera:</strong> Jastip berbeda tempat namun masih dalam 1 area dihitung <strong>Rp1.000/item</strong> sesuai ketentuan lebih dari 3 item, <u>bukan</u> per tempat.
                  </li>
                  <li className="flex items-start justify-between gap-2">
                    <span>• <strong>Menunggu Belanja Lebih dari 1 Jam:</strong></span>
                    <span className="font-bold text-slate-800">+Rp2.000</span>
                  </li>
                  <li className="flex items-start justify-between gap-2">
                    <span>• <strong>Tempat Jastip Tutup (sudah 2x percobaan):</strong> Ongkir tetap</span>
                    <span className="font-bold text-slate-800">Rp2.000</span>
                  </li>
                  <li className="flex items-start justify-between gap-2">
                    <span>• <strong>Jastip di Luar Area UIN:</strong> Estimasi 2 km</span>
                    <span className="font-bold text-blue-600">Ongkir Rp5.000</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Biaya Layanan Tambahan */}
          <div className="max-w-4xl mx-auto mb-14">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="w-2.5 h-6 bg-blue-600 rounded-full inline-block" />
              Biaya Tambahan Per Jenis Layanan
            </h2>

            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100">
                {svcs.map((svc) => (
                  <div
                    key={svc.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">
                        {svc.slug === "antar-jemput-motor" && <Bike size={20} />}
                        {svc.slug === "jastip-kuliner" && <UtensilsCrossed size={20} />}
                        {svc.slug === "jastip-belanja" && <ShoppingBasket size={20} />}
                        {svc.slug === "kirim-dokumen" && <Package size={20} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{svc.name}</span>
                          {svc.badge_text && (
                            <span className="badge badge-blue text-[10px] py-0.5 px-2">
                              {svc.badge_text}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{svc.description}</p>
                      </div>
                    </div>

                    <div className="sm:text-right pl-14 sm:pl-0">
                      <span className="text-xs text-slate-400 block sm:inline mr-1">Biaya Layanan:</span>
                      <span className="font-extrabold text-slate-900 text-sm">
                        {svc.extra_fee === 0 ? "Gratis (+Rp0)" : `+${formatRupiah(svc.extra_fee)}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Estimasi Rute Populer */}
          {routes.length > 0 && zones.length > 0 && (
            <div className="max-w-4xl mx-auto mb-14">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span className="w-2.5 h-6 bg-blue-600 rounded-full inline-block" />
                Contoh Estimasi Tarif Rute Populer Kampus
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {routes.map((route) => {
                  const fareRes = calculateFare(route.distance_km, 0, zones);
                  return (
                    <div
                      key={route.id}
                      className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm flex items-center justify-between hover:border-blue-300 transition-colors"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                          <MapPin size={13} className="text-blue-600 flex-shrink-0" />
                          <span className="truncate">{route.origin_name}</span>
                        </div>
                        <div className="font-semibold text-slate-900 text-sm truncate">
                          → {route.destination_name}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Jarak estimasi: {route.distance_km} km ({fareRes.zone.name})
                        </span>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="text-base font-extrabold text-blue-600">
                          {formatRupiah(fareRes.total)}
                        </div>
                        <span className="text-[10px] text-slate-400">Antar Jemput</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Syarat & Kebijakan Ongkir */}
          <div className="max-w-4xl mx-auto bg-slate-100 rounded-2xl p-6 border border-slate-200 text-xs text-slate-600 leading-relaxed space-y-2">
            <div className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-2">
              <Info size={16} className="text-blue-600" />
              Ketentuan Perhitungan Tarif Anjem UIN:
            </div>
            <p>
              1. <strong>Jarak & Rute:</strong> Jarak yang digunakan pada formulir pemesanan
              merupakan estimasi rute peta. Jika terdapat pengalihan rute atau perubahan titik jemput/tujuan
              oleh pemesan, driver dan pelanggan dapat menyepakati penyesuaian tarif.
            </p>
            <p>
              2. <strong>Batas Maksimal Jangkauan:</strong> Layanan melayani jarak maksimal 20 km dari
              kampus UIN Raden Mas Said Surakarta. Di luar jarak ini, konfirmasi admin diperlukan.
            </p>
            <p>
              3. <strong>Harga Barang Jastip:</strong> Untuk jastip kuliner dan belanja, tarif di atas
              hanya mencakup jasa antar dan jasa beli. Biaya riil makanan/belanjaan dibayarkan terpisah
              sesuai struk belanja yang valid.
            </p>
            <p>
              4. <strong>Pembayaran:</strong> Dapat dilakukan secara tunai (cash) kepada driver atau QRIS
              langsung ke driver saat pesanan tiba.
            </p>
          </div>

          {/* Action CTA */}
          <div className="mt-10 text-center">
            <Link href="/pesan" className="btn btn-primary text-sm inline-flex items-center gap-2">
              <Calculator size={16} />
              Coba Pesan Layanan Sekarang
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
      <WhatsAppFAB />
    </div>
  );
}
