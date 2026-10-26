import { describe, it, expect } from "vitest";
import {
  calculateFare,
  formatRupiah,
  getZoneForDistance,
  isNightTime,
  DEFAULT_FARE_ZONES,
} from "@/lib/pricing/calculateFare";

describe("calculateFare domain pricing tests", () => {
  it("harus melempar error jika jarak negatif", () => {
    expect(() => calculateFare(-1, 0, DEFAULT_FARE_ZONES)).toThrowError(
      "Jarak tidak boleh negatif."
    );
  });

  it("harus menghitung tarif Zona 1: Radius sekitar UIN (<= 1.3 km) = Rp5.000", () => {
    const res = calculateFare(1.0, 0, DEFAULT_FARE_ZONES);
    expect(res.zone.id).toBe("zone-1");
    expect(res.base_price).toBe(5000);
    expect(res.per_km_extra).toBe(0);
    expect(res.total).toBe(5000);

    const resEdge = calculateFare(1.3, 0, DEFAULT_FARE_ZONES);
    expect(resEdge.zone.id).toBe("zone-1");
    expect(resEdge.total).toBe(5000);
  });

  it("harus menghitung tarif Zona 2: Radius 1.4 km (1.31 - 1.4 km) = Rp6.000", () => {
    const res = calculateFare(1.4, 0, DEFAULT_FARE_ZONES);
    expect(res.zone.id).toBe("zone-2");
    expect(res.base_price).toBe(6000);
    expect(res.per_km_extra).toBe(0);
    expect(res.total).toBe(6000);
  });

  it("harus menghitung tarif Zona 3: Radius 2 km (1.41 - 2.0 km) = Rp7.000", () => {
    const res = calculateFare(1.8, 0, DEFAULT_FARE_ZONES);
    expect(res.zone.id).toBe("zone-3");
    expect(res.base_price).toBe(7000);
    expect(res.per_km_extra).toBe(0);
    expect(res.total).toBe(7000);

    const resEdge = calculateFare(2.0, 0, DEFAULT_FARE_ZONES);
    expect(resEdge.zone.id).toBe("zone-3");
    expect(resEdge.total).toBe(7000);
  });

  it("harus menghitung tarif Zona 4: Radius 3 km (2.01 - 3.0 km) = Rp8.000", () => {
    const res = calculateFare(2.5, 0, DEFAULT_FARE_ZONES);
    expect(res.zone.id).toBe("zone-4");
    expect(res.base_price).toBe(8000);
    expect(res.per_km_extra).toBe(0);
    expect(res.total).toBe(8000);

    const resEdge = calculateFare(3.0, 0, DEFAULT_FARE_ZONES);
    expect(resEdge.zone.id).toBe("zone-4");
    expect(resEdge.total).toBe(8000);
  });

  it("harus menghitung tarif Zona 5: Lebih dari 3 km (+Rp1.000/km untuk 3-5 km)", () => {
    // 3.5 km -> 8.000 + 1 * 1.000 = 9.000
    const res = calculateFare(3.5, 0, DEFAULT_FARE_ZONES);
    expect(res.zone.id).toBe("zone-5");
    expect(res.base_price).toBe(8000);
    expect(res.per_km_extra).toBe(1000);
    expect(res.total).toBe(9000);

    // 5.0 km -> 8.000 + 2 * 1.000 = 10.000
    const res5km = calculateFare(5.0, 0, DEFAULT_FARE_ZONES);
    expect(res5km.zone.id).toBe("zone-5");
    expect(res5km.per_km_extra).toBe(2000);
    expect(res5km.total).toBe(10000);
  });

  it("harus menghitung tarif Zona 6: Di atas 5 km (+Rp2.000/km di atas 5 km)", () => {
    // 6.0 km -> base 10.000 + 1 * 2.000 = 12.000
    const res6km = calculateFare(6.0, 0, DEFAULT_FARE_ZONES);
    expect(res6km.zone.id).toBe("zone-6");
    expect(res6km.base_price).toBe(10000);
    expect(res6km.per_km_extra).toBe(2000);
    expect(res6km.total).toBe(12000);

    // 7.0 km -> base 10.000 + 2 * 2.000 = 14.000
    const res7km = calculateFare(7.0, 0, DEFAULT_FARE_ZONES);
    expect(res7km.zone.id).toBe("zone-6");
    expect(res7km.total).toBe(14000);
  });

  it("harus menambahkan opsi hujan driver (+Rp2.000)", () => {
    const res = calculateFare(1.0, { isRain: true }, DEFAULT_FARE_ZONES);
    expect(res.base_price).toBe(5000);
    expect(res.rain_fee).toBe(2000);
    expect(res.total).toBe(7000);
  });

  it("harus menambahkan biaya order di atas pukul 22.30 (+Rp1.000)", () => {
    const res = calculateFare(1.0, { isNight: true }, DEFAULT_FARE_ZONES);
    expect(res.base_price).toBe(5000);
    expect(res.night_fee).toBe(1000);
    expect(res.total).toBe(6000);
  });

  it("harus menggabungkan opsi hujan dan order malam bersamaan", () => {
    const res = calculateFare(1.0, { isRain: true, isNight: true }, DEFAULT_FARE_ZONES);
    expect(res.base_price).toBe(5000);
    expect(res.rain_fee).toBe(2000);
    expect(res.night_fee).toBe(1000);
    expect(res.total).toBe(8000);
  });

  it("harus menghitung mampir ke tempat tambahan pada anjem motor (+Rp1.000/tempat)", () => {
    const res = calculateFare(2.0, { extraStops: 2 }, DEFAULT_FARE_ZONES);
    expect(res.base_price).toBe(7000);
    expect(res.extra_stops_fee).toBe(2000);
    expect(res.total).toBe(9000);
  });

  it("harus menghitung jastip pindah tempat (+Rp2.000 per tempat tambahan)", () => {
    // 1 tempat tambahan
    const res1 = calculateFare(1.0, { jastipOptions: { extraPlaces: 1 } }, DEFAULT_FARE_ZONES);
    expect(res1.jastip_extra_fee).toBe(2000);
    expect(res1.total).toBe(7000);

    // 2 tempat tambahan
    const res2 = calculateFare(1.0, { jastipOptions: { extraPlaces: 2 } }, DEFAULT_FARE_ZONES);
    expect(res2.jastip_extra_fee).toBe(4000);
    expect(res2.total).toBe(9000);
  });

  it("harus membebaskan biaya tempat jika jastip beda tempat tetapi masih 1 area (foodcourt)", () => {
    const res = calculateFare(
      1.0,
      {
        jastipOptions: {
          extraPlaces: 2,
          isSameArea: true,
          totalItems: 4, // 4 items -> >3 item = 1 item extra = +1000
        },
      },
      DEFAULT_FARE_ZONES
    );
    // extraPlaces fee = 0 (karena same area)
    // items fee = 1000 (4 - 3 = 1 item)
    expect(res.jastip_extra_fee).toBe(1000);
    expect(res.total).toBe(6000);
  });

  it("harus menghitung jastip lebih dari 3 item (+Rp1.000/item)", () => {
    // 3 items -> tidak ada biaya tambahan item
    const res3 = calculateFare(1.0, { jastipOptions: { totalItems: 3 } }, DEFAULT_FARE_ZONES);
    expect(res3.jastip_extra_fee).toBe(0);

    // 5 items -> 2 item di atas 3 = +2000
    const res5 = calculateFare(1.0, { jastipOptions: { totalItems: 5 } }, DEFAULT_FARE_ZONES);
    expect(res5.jastip_extra_fee).toBe(2000);
    expect(res5.total).toBe(7000);
  });

  it("harus menghitung jastip toko tutup dan sudah terjadi 2 kali percobaan -> flat ongkir Rp2.000", () => {
    const res = calculateFare(5.0, { jastipOptions: { closedAttempts: 2 } }, DEFAULT_FARE_ZONES);
    expect(res.base_price).toBe(2000);
    expect(res.total).toBe(2000);
  });

  it("harus menghitung jastip di luar area UIN (estimasi 2 km) dikenakan ongkir Rp5.000", () => {
    const res = calculateFare(1.8, { jastipOptions: { isOutsideUin: true } }, DEFAULT_FARE_ZONES);
    expect(res.base_price).toBe(5000);
    expect(res.total).toBe(5000);
  });

  it("harus memformat Rupiah dengan benar", () => {
    const formatted = formatRupiah(15000);
    expect(formatted).toContain("15.000");
  });

  it("harus menemukan zona yang tepat untuk jarak tertentu", () => {
    const zone = getZoneForDistance(1.35, DEFAULT_FARE_ZONES);
    expect(zone?.id).toBe("zone-2");

    const zone6 = getZoneForDistance(8.5, DEFAULT_FARE_ZONES);
    expect(zone6?.id).toBe("zone-6");
  });

  it("harus memeriksa jam malam dengan benar pada fungsi isNightTime", () => {
    // 22:45 WIB
    const nightDate = new Date("2026-10-26T22:45:00+07:00");
    expect(isNightTime(nightDate)).toBe(true);

    // 14:15 WIB
    const dayDate = new Date("2026-10-26T14:15:00+07:00");
    expect(isNightTime(dayDate)).toBe(false);

    // 22:25 WIB
    const before2230 = new Date("2026-10-26T22:25:00+07:00");
    expect(isNightTime(before2230)).toBe(false);

    // 22:30 WIB
    const at2230 = new Date("2026-10-26T22:30:00+07:00");
    expect(isNightTime(at2230)).toBe(true);

    // 02:00 WIB (subuh)
    const earlyMorning = new Date("2026-10-26T02:00:00+07:00");
    expect(isNightTime(earlyMorning)).toBe(true);
  });
});
