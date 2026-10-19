import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppFAB from "@/components/layout/WhatsAppFAB";
import { FileText, AlertTriangle } from "lucide-react";

export default function SyaratPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 pt-6 pb-16">
        <div className="container-main max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <span className="badge badge-blue mb-3 inline-flex items-center gap-1.5">
              <FileText size={13} />
              Ketentuan Layanan
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
              Syarat & Ketentuan Layanan Anjem UIN
            </h1>
            <p className="text-slate-500 text-sm">
              Terakhir diperbarui: Oktober 2026 • Draf Operasional Komunitas Kampus
            </p>
          </div>

          {/* Draf Disclaimer */}
          <div className="p-3.5 rounded-xl border bg-amber-50 border-amber-200 text-amber-800 flex items-center gap-2.5 mb-8">
            <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
            <div className="text-xs sm:text-sm">
              <strong>Catatan:</strong> Dokumen ini merupakan draf syarat dan ketentuan
              operasional awal Anjem UIN yang berlaku bagi pemesan dan mitra driver di area
              UIN Raden Mas Said Surakarta dan sekitarnya.
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm text-slate-700 text-sm leading-relaxed space-y-6">
            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">1. Ketentuan Umum</h2>
              <p>
                Dengan mengakses website atau memesan layanan Anjem UIN melalui formulir web maupun
                WhatsApp resmi, Anda menyetujui seluruh ketentuan yang tercantum dalam dokumen ini.
                Layanan ini diselenggarakan untuk memfasilitasi kebutuhan mobilitas, jastip, dan pengiriman
                mahasiswa UIN Raden Mas Said Surakarta serta masyarakat sekitar.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">2. Pemesanan & Pembatalan</h2>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li>Pemesan wajib memberikan informasi titik jemput dan tujuan yang akurat.</li>
                <li>
                  Pembatalan order dapat dilakukan tanpa biaya sebelum driver ditugaskan (status <code>pending</code>).
                </li>
                <li>
                  Jika driver telah menuju lokasi jemput (status <code>assigned</code> atau <code>on_the_way</code>),
                  pembatalan mendadak tanpa alasan mendesak dapat dikenai penalti etika atau biaya pengganti bensin driver.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">3. Jastip Makanan & Belanja</h2>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li>
                  Harga makanan/barang yang tertera pada estimasi awal hanyalah perkiraan. Pemesan wajib
                  mengganti biaya riil pembelian sesuai nota/struk belanja resmi dari toko atau warung.
                </li>
                <li>
                  Barang yang dititipkan tidak boleh berupa barang terlarang, narkoba, miras, senjata, atau
                  benda melanggar hukum Republik Indonesia.
                </li>
                <li>
                  Jika stok barang di toko habis, driver akan menghubungi pemesan untuk konfirmasi pengganti
                  atau pembatalan pembelian.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">4. Pengiriman Dokumen & Paket Kilat</h2>
              <p>
                Layanan kirim dokumen dikhususkan untuk berkas perkuliahan, skripsi, buku, dan paket ringan
                maksimal 5 kg yang muat di motor. Barang pecah belah atau bernilai sangat tinggi wajib dikonfirmasi
                terlebih dahulu kepada driver.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">5. Metode Pembayaran</h2>
              <p>
                Pembayaran dilakukan langsung kepada driver saat pesanan selesai. Metode yang diterima adalah
                tunai (uang pas dianjurkan) atau QRIS driver. Platform website saat ini tidak memproses pembayaran kartu kredit.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-slate-900 mb-2">6. Keselamatan & Etika Berkendara</h2>
              <p>
                Semua penumpang dan driver diwajibkan menggunakan helm SNI selama perjalanan. Driver berhak menolak
                mengangkut penumpang yang melebihi kapasitas (maksimal 1 penumpang per motor) atau membahayakan
                keselamatan berkendara.
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
