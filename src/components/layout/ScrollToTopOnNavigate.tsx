"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Komponen pembantu untuk memastikan setiap perpindahan halaman (routing)
 * otomatis scroll ke bagian paling atas layar.
 */
export default function ScrollToTopOnNavigate() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  }, [pathname]);

  return null;
}
