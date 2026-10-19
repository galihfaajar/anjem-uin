import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppFAB from "@/components/layout/WhatsAppFAB";
import HeroSection from "@/components/landing/HeroSection";
import StatsSection from "@/components/landing/StatsSection";
import ServicesSection from "@/components/landing/ServicesSection";
import FareCalculatorSection from "@/components/landing/FareCalculatorSection";
import HowToOrderSection from "@/components/landing/HowToOrderSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import DriversSection from "@/components/landing/DriversSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CoverageAndFaqSection from "@/components/landing/CoverageAndFaqSection";
import { siteConfig } from "@/config/site";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${siteConfig.name} — Layanan Antar-Jemput Mahasiswa UIN Raden Mas Said`,
  description: siteConfig.description,
};

export default async function HomePage() {
  let services: any[] = [];
  let fareZones: any[] = [];
  let popularRoutes: any[] = [];
  let reviews: any[] = [];
  let faqs: any[] = [];

  try {
    const supabase = await createClient();
    const [
      { data: sData },
      { data: zData },
      { data: rData },
      { data: revData },
      { data: fData },
    ] = await Promise.all([
      supabase.from("services").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("fare_zones").select("*").eq("is_active", true).order("min_km"),
      supabase.from("popular_routes").select("*").eq("is_active", true).order("sort_order"),
      supabase
        .from("reviews")
        .select("*, order:orders(customer_name), driver:drivers(profile:profiles(full_name))")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase.from("faqs").select("*").eq("is_active", true).order("sort_order"),
    ]);

    if (sData) services = sData;
    if (zData) fareZones = zData;
    if (rData) popularRoutes = rData;
    if (revData) reviews = revData;
    if (fData) faqs = fData;
  } catch (err) {
    console.error("Failed to load homepage data:", err);
  }

  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <StatsSection />
        <ServicesSection services={services} />
        <FareCalculatorSection
          services={services}
          fareZones={fareZones}
          popularRoutes={popularRoutes}
        />
        <HowToOrderSection />
        <FeaturesSection />
        <DriversSection />
        <TestimonialsSection reviews={reviews} services={services} />
        <CoverageAndFaqSection faqs={faqs} />
      </main>
      <Footer />
      <WhatsAppFAB />
    </>
  );
}
