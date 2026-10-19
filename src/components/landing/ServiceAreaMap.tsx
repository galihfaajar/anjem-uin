"use client";

import { useEffect } from "react";
import { siteConfig } from "@/config/site";

// Komponen ini di-render hanya di client (Leaflet tidak support SSR)
export default function ServiceAreaMap() {
  useEffect(() => {
    let map: import("leaflet").Map | null = null;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      // Fix default marker icon path issue in Next.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const el = document.getElementById("service-area-map");
      if (!el || (el as HTMLElement & { _leaflet_id?: number })._leaflet_id) return;

      map = L.map("service-area-map", {
        center: [siteConfig.mapCenter.lat, siteConfig.mapCenter.lng],
        zoom: siteConfig.mapCenter.zoom,
        scrollWheelZoom: false,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      // Custom icon for campus marker
      const campusIcon = L.divIcon({
        html: `<div style="
          background:#2563eb;
          color:white;
          border-radius:50%;
          width:36px;
          height:36px;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:16px;
          border:3px solid white;
          box-shadow:0 2px 8px rgba(37,99,235,0.4)
        ">🎓</div>`,
        className: "",
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      // Campus marker
      L.marker(
        [siteConfig.mapCenter.lat, siteConfig.mapCenter.lng],
        { icon: campusIcon }
      )
        .addTo(map)
        .bindPopup(
          `<div style="font-family:sans-serif;padding:4px">
            <strong style="color:#2563eb">${siteConfig.campus}</strong><br>
            <span style="font-size:12px;color:#64748b">Kartasura, Sukoharjo</span>
          </div>`
        );

      // Service area circle (approximate, NOT official boundary)
      L.circle([siteConfig.mapCenter.lat, siteConfig.mapCenter.lng], {
        radius: siteConfig.maxDistanceKm * 1000,
        color: "#2563eb",
        fillColor: "#2563eb",
        fillOpacity: 0.06,
        weight: 2,
        dashArray: "6 4",
      })
        .addTo(map)
        .bindTooltip(
          `Area estimasi ±${siteConfig.maxDistanceKm} km (belum diverifikasi resmi)`,
          { sticky: true }
        );

      // Known locations
      const locations = [
        { name: "Stasiun Solo Balapan", lat: -7.5608, lng: 110.8265 },
        { name: "Terminal Tirtonadi", lat: -7.5572, lng: 110.8278 },
        { name: "Bandara Adi Soemarmo", lat: -7.5159, lng: 110.7571 },
        { name: "Pasar Kartasura", lat: -7.5584, lng: 110.7634 },
        { name: "Kampus UMS Pabelan", lat: -7.5561, lng: 110.7715 },
      ];

      const locIcon = L.divIcon({
        html: `<div style="
          background:white;
          border:2px solid #2563eb;
          border-radius:50%;
          width:12px;height:12px;
        "></div>`,
        className: "",
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });

      locations.forEach((loc) => {
        L.marker([loc.lat, loc.lng], { icon: locIcon })
          .addTo(map!)
          .bindTooltip(loc.name, { direction: "top" });
      });
    };

    initMap().catch(console.error);

    return () => {
      map?.remove();
    };
  }, []);

  return (
    <div
      id="service-area-map"
      className="rounded-2xl overflow-hidden border border-slate-200 shadow-md"
      style={{ height: 380 }}
      aria-label="Peta area layanan Anjem UIN"
      role="img"
    />
  );
}
