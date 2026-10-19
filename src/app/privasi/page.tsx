import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppFAB from "@/components/layout/WhatsAppFAB";
import { Shield, AlertTriangle } from "lucide-react";

export default function PrivasiPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 pt-6 pb-16">
        <div className="container-main max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <span className="badge badge-blue mb-3 inline-flex items-center gap-1.5">
              <Shield size={13} />
              Kebijakan Privasi
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
              Kebijakan Privasi Anjem UIN
            </h1>
            <p className="text-slate-500 text-sm">
              Terakhir diperbarui: Oktober 2026 • Draf Operasional Kampus
            </p>
          </div>

          {/* Draf Disclaimer */}
          <div className="p-3.5 rounded-xl border bg-amber-50 border-amber-200 text-amber-800 flex items-center gap-2.5 mb-8">
            <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
            <div className="text-xs sm:text-sm">
              <strong>Catatan Hukum:</strong> Halaman ini merupakan draf kebijakan privasi awal
              yang dirancang untuk operasional layanan komunitas mahasiswa Anjem UIN. Kebijakan final
              dapat disesuaikan oleh pengelola dan penasihat hukum resmi layanan.
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm text-slate-700 text-sm leading-relaxed space-y-6">
            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">1. Pendahuluan</h2>
              <p>
                Anjem UIN menghargai dan melindungi privasi setiap mahasiswa dan pengguna layanan
                kami di lingkungan UIN Raden Mas Said Surakarta dan sekitarnya. Kebijakan ini
                menjelaskan bagaimana data pribadi dikumpulkan, digunakan, dan dilindungi saat
                Anda menggunakan website dan layanan kami.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">2. Data yang Kami Kumpulkan</h2>
              <p className="mb-2">Kami hanya mengumpulkan data yang diperlukan untuk pelaksanaan layanan:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li><strong>Informasi Kontak:</strong> Nama lengkap/panggilan dan nomor WhatsApp.</li>
                <li><strong>Data Lokasi & Rute:</strong> Titik jemput, titik tujuan, dan jarak estimasi untuk keperluan pengantaran.</li>
                <li><strong>Detail Pemesanan:</strong> Catatan barang jastip, dokumen, atau instruksi khusus untuk driver.</li>
                <li><strong>Data Driver (Mitra):</strong> Nomor plat kendaraan, jenis motor, foto identitas (disimpan di penyimpanan privat terenkripsi), dan status operasional.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">3. Penggunaan Data</h2>
              <p className="mb-2">Data Anda digunakan semata-mata untuk:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li>Menghubungkan pemesan dengan mitra driver yang bersedia.</li>
                <li>Menghitung estimasi tarif dan rute perjalanan secara transparan.</li>
                <li>Koordinasi pengantaran melalui pesan WhatsApp resmi.</li>
                <li>Verifikasi keamanan dan moderasi ulasan terverifikasi.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">4. Perlindungan Data & Kerahasiaan</h2>
              <p>
                Kami tidak menjual, menyewakan, atau memberikan data pribadi Anda kepada pihak ketiga
                untuk keperluan periklanan. Nama pada ulasan publik selalu disamarkan demi melindungi privasi
                mahasiswa. Dokumen verifikasi mitra driver disimpan pada bucket privat dengan akses terbatas
                hanya untuk admin yang berwenang.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">5. Hak Pengguna</h2>
              <p>
                Pengguna berhak untuk meminta pembaruan data kontak, penonaktifan akun, atau
                penghapusan riwayat pemesanan lama dengan menghubungi layanan pelanggan Anjem UIN.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">6. Kontak Kami</h2>
              <p>
                Jika Anda memiliki pertanyaan mengenai kebijakan privasi ini, silakan hubungi tim kami
                melalui email resmi di <strong>bantuan@anjemuin.id</strong> atau pesan WhatsApp admin.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
      <WhatsAppFAB />
    </div>
  );
}
