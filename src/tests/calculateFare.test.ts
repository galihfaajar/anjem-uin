import { describe, it, expect } from "vitest";
import { calculateFare, formatRupiah, getZoneForDistance } from "@/lib/pricing/calculateFare";
import { DEMO_FARE_ZONES } from "@/lib/data/demo";

describe("calculateFare domain pricing tests", () => {
  it("harus melempar error jika jarak negatif", () => {
    expect(() => calculateFare(-1, 0, DEMO_FARE_ZONES)).toThrowError(
      "Jarak tidak boleh negatif."
    );
  });

  it("harus menghitung tarif Zona 1 (0-3 km) dengan benar", () => {
    const res = calculateFare(2.5, 0, DEMO_FARE_ZONES);
    expect(res.zone.id).toBe("zone-1");
    expect(res.base_price).toBe(5000);
    expect(res.extra_fee).toBe(0);
    expect(res.per_km_extra).toBe(0);
    expect(res.total).toBe(5000);
  });

  it("harus menghitung tarif Zona 1 dengan batas tepat 3 km", () => {
    const res = calculateFare(3.0, 0, DEMO_FARE_ZONES);
    expect(res.zone.id).toBe("zone-1");
    expect(res.total).toBe(5000);
  });

  it("harus menghitung tarif Zona 2 (>3-6 km) dengan benar", () => {
    const res = calculateFare(4.5, 0, DEMO_FARE_ZONES);
    expect(res.zone.id).toBe("zone-2");
    expect(res.base_price).toBe(9500);
    expect(res.per_km_extra).toBe(0);
    expect(res.total).toBe(9500);
  });

  it("harus menghitung tarif Zona 3 (>6-10 km) dengan benar", () => {
    const res = calculateFare(8.5, 0, DEMO_FARE_ZONES);
    expect(res.zone.id).toBe("zone-3");
    expect(res.base_price).toBe(14000);
    expect(res.per_km_extra).toBe(0);
    expect(res.total).toBe(14000);
  });

  it("harus menghitung tarif Zona 4 (>10 km) dengan per_km_price Rp2.000/km di atas 10 km", () => {
    // 12 km = base 14.000 + (12 - 10) * 2.000 = 14.000 + 4.000 = 18.000
    const res = calculateFare(12.0, 0, DEMO_FARE_ZONES);
    expect(res.zone.id).toBe("zone-4");
    expect(res.base_price).toBe(14000);
    expect(res.per_km_extra).toBe(4000);
    expect(res.total).toBe(18000);
  });

  it("harus menghitung tarif dengan biaya tambahan layanan (misal jastip Rp2.000)", () => {
    const res = calculateFare(2.5, 2000, DEMO_FARE_ZONES);
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
    const zone = getZoneForDistance(5.0, DEMO_FARE_ZONES);
    expect(zone?.id).toBe("zone-2");
  });
});
