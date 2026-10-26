"use client";

import { Suspense } from "react";
import AuthSliderCard from "@/components/auth/AuthSliderCard";

export default function MasukPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center">
          <div className="text-slate-500 font-semibold text-sm">Memuat halaman masuk...</div>
        </div>
      }
    >
      <AuthSliderCard initialMode="masuk" />
    </Suspense>
  );
}
