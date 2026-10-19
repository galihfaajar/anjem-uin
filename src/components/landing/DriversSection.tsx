import Link from "next/link";
import { Star, Bike, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={12}
          className={n <= Math.round(rating) ? "star-filled" : "star-empty"}
          fill={n <= Math.round(rating) ? "#f59e0b" : "none"}
        />
      ))}
    </div>
  );
}

export default async function DriversSection() {
  let drivers: any[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("drivers")
      .select("*, profile:profiles(full_name, avatar_url)")
      .eq("status", "approved")
      .order("rating_avg", { ascending: false });

    if (data && data.length > 0) {
      drivers = data.map((d: any) => ({
        ...d,
        initials: (d.profile?.full_name || "Driver")
          .split(" ")
          .map((n: string) => n[0])
          .slice(0, 2)
          .join(""),
      }));
    }
  } catch {}

  if (drivers.length === 0) {
    return (
      <section id="driver" className="py-20 bg-white">
        <div className="container-main text-center">
          <span className="section-eyebrow">DRIVER TERVERIFIKASI</span>
          <h2 className="section-title mb-4">Driver Lokal yang Siap Membantu</h2>
          <div className="card max-w-sm mx-auto mt-8 text-center">
            <Bike size={36} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 text-sm">
              Belum ada driver terverifikasi yang ditampilkan. Daftar sebagai
              driver pertama!
            </p>
            <div className="mt-4">
              <Link href="/daftar" className="btn btn-primary btn-sm inline-flex items-center gap-1.5">
                Daftar Jadi Driver <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="driver" className="py-20 bg-white">
      <div className="container-main">
        <div className="text-center mb-14">
          <span className="section-eyebrow">
            DRIVER TERVERIFIKASI & BERPENGALAMAN
          </span>
          <h2 className="section-title mb-4">Driver Lokal yang Siap Membantu</h2>
          <p className="section-subtitle mx-auto">
            Semua mitra driver Anjem UIN telah melalui verifikasi identitas.
            Aman, ramah, dan kenal area kampus.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {drivers.map((driver) => (
            <div key={driver.id} className="card text-center group">
              {/* Avatar */}
              <div className="relative mx-auto mb-4 w-20 h-20">
                {driver.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={driver.photo_url}
                    alt={driver.profile?.full_name ?? "Driver"}
                    className="w-20 h-20 rounded-full object-cover border-4 border-blue-100"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center border-4 border-blue-100">
                    <span className="text-white text-2xl font-extrabold">
                      {driver.initials}
                    </span>
                  </div>
                )}
                {/* Online indicator */}
                <span
                  className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${
                    driver.is_online ? "bg-green-500 animate-pulse-dot" : "bg-slate-300"
                  }`}
                  title={driver.is_online ? "Online" : "Offline"}
                />
              </div>

              <h3 className="font-bold text-slate-900 text-base leading-tight mb-1">
                {driver.profile?.full_name ?? "Driver"}
              </h3>
              <p className="text-xs text-slate-400 mb-3">{driver.plate_number || "Plat belum diatur"}</p>

              <div className="flex items-center justify-center gap-1 mb-1">
                <StarRating rating={driver.rating_avg || 5.0} />
                <span className="text-xs font-semibold text-slate-700">
                  {(driver.rating_avg || 5.0).toFixed(1)}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {driver.total_trips || 0} perjalanan
              </p>

              {/* Status badge */}
              <div className="mt-4">
                <span
                  className={`badge ${driver.is_online ? "badge-green" : "badge-blue"}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      driver.is_online ? "bg-green-500 animate-pulse-dot" : "bg-slate-400"
                    }`}
                  />
                  {driver.is_online ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/daftar"
            className="btn btn-outline inline-flex items-center gap-2"
          >
            Tertarik Menjadi Mitra? Daftar Driver Sekarang
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
