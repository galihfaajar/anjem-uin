"use client";

import { MessageCircle } from "lucide-react";
import { siteConfig } from "@/config/site";
import { buildWALink } from "@/lib/utils";

export default function WhatsAppFAB() {
  const href = buildWALink(
    siteConfig.whatsapp,
    `Halo ${siteConfig.name}, saya ingin memesan layanan.`
  );

  if (href === "#") return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-200 hover:scale-110 active:scale-95"
      style={{ background: "#25d366" }}
      aria-label="Hubungi kami via WhatsApp"
      title="Chat via WhatsApp"
    >
      <MessageCircle size={26} className="text-white" fill="white" />
    </a>
  );
}
