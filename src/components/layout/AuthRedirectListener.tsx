"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Mendeteksi jika user mendarat di halaman utama ('/') setelah autentikasi OAuth Google
 * (misal saat Supabase mengembalikan token ke Site URL) dan mengarahkannya langsung ke dashboard.
 */
export default function AuthRedirectListener() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash;
    const search = window.location.search;

    // Cek apakah ada parameter callback OAuth Google
    const isOAuthReturn =
      hash.includes("access_token") ||
      search.includes("code=") ||
      hash.includes("type=recovery");

    if (pathname === "/" && isOAuthReturn) {
      const supabase = createClient();
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (event === "SIGNED_IN" && session?.user) {
            router.replace("/dashboard");
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [pathname, router]);

  return null;
}
