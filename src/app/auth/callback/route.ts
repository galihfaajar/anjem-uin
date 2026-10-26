import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || searchParams.get("redirect") || "/dashboard";

  if (code) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data?.user) {
        // Ambil role dari tabel profiles jika ada
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();

        const role = profile?.role || data.user.user_metadata?.role || "customer";

        // Jika tujuan default (/dashboard), sesuaikan berdasarkan role
        if (next === "/dashboard") {
          if (role === "admin") {
            return NextResponse.redirect(`${origin}/admin`);
          } else if (role === "driver") {
            return NextResponse.redirect(`${origin}/driver`);
          }
        }

        return NextResponse.redirect(`${origin}${next}`);
      }
    } catch (err) {
      console.error("Auth callback error:", err);
    }
  }

  // Jika gagal atau tidak ada code, redirect ke masuk dengan notifikasi
  return NextResponse.redirect(`${origin}/masuk?error=Gagal+masuk+dengan+Google`);
}

