import { describe, it, expect } from "vitest";
import { calculateFare, formatRupiah, getZoneForDistance } from "@/lib/pricing/calculateFare";
import type { FareZone } from "@/types";

const TEST_FARE_ZONES: FareZone[] = [
  { id: "zone-1", name: "Zona 1", min_km: 0, max_km: 3, base_price: 5000, per_km_price: 0, color: "#22c55e", sort_order: 1, is_active: true },
  { id: "zone-2", name: "Zona 2", min_km: 3, max_km: 6, base_price: 9500, per_km_price: 0, color: "#3b82f6", sort_order: 2, is_active: true },
  { id: "zone-3", name: "Zona 3", min_km: 6, max_km: 10, base_price: 14000, per_km_price: 0, color: "#f59e0b", sort_order: 3, is_active: true },
  { id: "zone-4", name: "Zona 4", min_km: 10, max_km: null, base_price: 14000, per_km_price: 2000, color: "#ef4444", sort_order: 4, is_active: true },
];

describe("calculateFare domain pricing tests", () => {
  it("harus melempar error jika jarak negatif", () => {
    expect(() => calculateFare(-1, 0, TEST_FARE_ZONES)).toThrowError(
      "Jarak tidak boleh negatif."
    );
  });

  it("harus menghitung tarif Zona 1 (0-3 km) dengan benar", () => {
    const res = calculateFare(2.5, 0, TEST_FARE_ZONES);
    expect(res.zone.id).toBe("zone-1");
    expect(res.base_price).toBe(5000);
    expect(res.extra_fee).toBe(0);
    expect(res.per_km_extra).toBe(0);
    expect(res.total).toBe(5000);
  });

  it("harus menghitung tarif Zona 1 dengan batas tepat 3 km", () => {
    const res = calculateFare(3.0, 0, TEST_FARE_ZONES);
    expect(res.zone.id).toBe("zone-1");
    expect(res.total).toBe(5000);
  });

  it("harus menghitung tarif Zona 2 (>3-6 km) dengan benar", () => {
    const res = calculateFare(4.5, 0, TEST_FARE_ZONES);
    expect(res.zone.id).toBe("zone-2");
    expect(res.base_price).toBe(9500);
    expect(res.per_km_extra).toBe(0);
    expect(res.total).toBe(9500);
  });

  it("harus menghitung tarif Zona 3 (>6-10 km) dengan benar", () => {
    const res = calculateFare(8.5, 0, TEST_FARE_ZONES);
    expect(res.zone.id).toBe("zone-3");
    expect(res.base_price).toBe(14000);
    expect(res.per_km_extra).toBe(0);
    expect(res.total).toBe(14000);
  });

  it("harus menghitung tarif Zona 4 (>10 km) dengan per_km_price Rp2.000/km di atas 10 km", () => {
    // 12 km = base 14.000 + (12 - 10) * 2.000 = 14.000 + 4.000 = 18.000
    const res = calculateFare(12.0, 0, TEST_FARE_ZONES);
    expect(res.zone.id).toBe("zone-4");
    expect(res.base_price).toBe(14000);
    expect(res.per_km_extra).toBe(4000);
    expect(res.total).toBe(18000);
  });

  it("harus menghitung tarif dengan biaya tambahan layanan (misal jastip Rp2.000)", () => {
    const res = calculateFare(2.5, 2000, TEST_FARE_ZONES);
    expect(res.zone.id).toBe("zone-1");
    expect(res.base_price).toBe(5000);
    expect(res.extra_fee).toBe(2000);
    expect(res.total).toBe(7000);
  });

  it("harus memformat Rupiah dengan benar", () => {
    const formatted = formatRupiah(15000);
    expect(formatted).toContain("15.000");
  });

  it("harus menemukan zona yang tepat untuk jarak tertentu", () => {
    const zone = getZoneForDistance(5.0, TEST_FARE_ZONES);
    expect(zone?.id).toBe("zone-2");
  });
});
