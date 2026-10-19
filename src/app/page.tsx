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

export const metadata: Metadata = {
  title: `${siteConfig.name} — Layanan Antar-Jemput Mahasiswa UIN Raden Mas Said`,
  description: siteConfig.description,
};

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <StatsSection />
        <ServicesSection />
        <FareCalculatorSection />
        <HowToOrderSection />
        <FeaturesSection />
        <DriversSection />
        <TestimonialsSection />
        <CoverageAndFaqSection />
      </main>
      <Footer />
      <WhatsAppFAB />
    </>
  );
}
