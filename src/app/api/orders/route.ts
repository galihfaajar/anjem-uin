import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateFare, isNightTime } from "@/lib/pricing/calculateFare";
import { createClient } from "@/lib/supabase/server";
import { normalizePhoneNumber } from "@/lib/phone";
import type { Order, OrderEvent } from "@/types";

const createOrderSchema = z.object({
  customerName: z.string().trim().min(2, "Nama pemesan minimal 2 karakter"),
  customerPhone: z
    .string({ message: "Nomor WhatsApp belum diisi" })
    .trim()
    .min(1, "Nomor WhatsApp belum diisi")
    .regex(/^62[0-9]{9,13}$/, "Format nomor WhatsApp tidak valid (contoh: 081234567890 atau 6281234567890)"),
  serviceId: z.string().min(1, "Layanan wajib dipilih"),
  pickupName: z.string().trim().min(3, "Titik penjemputan minimal 3 karakter"),
  pickupLat: z.number().default(-7.5576),
  pickupLng: z.number().default(110.7706),
  dropoffName: z.string().trim().min(3, "Titik pengantaran minimal 3 karakter"),
  dropoffLat: z.number().default(-7.5576),
  dropoffLng: z.number().default(110.7706),
  distanceKm: z.number().min(0.1, "Jarak minimal 0.1 km").max(30, "Jarak melebihi batas 30 km"),
  itemNotes: z.string().optional().nullable(),
  itemsEstimate: z.number().optional().nullable(),
  extraStops: z.number().int().min(0).default(0),
  jastipExtraPlaces: z.number().int().min(0).default(0),
  jastipSameArea: z.boolean().default(false),
  jastipItemsCount: z.number().int().min(0).default(0),
  jastipOutsideUin: z.boolean().default(false),
  paymentMethod: z.enum(["cash", "qris_driver"], {
    message: "Pilih metode pembayaran yang valid",
  }),
});


export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Normalisasi format nomor WhatsApp jika dikirimkan
    if (typeof body.customerPhone === "string" && body.customerPhone.trim()) {
      body.customerPhone = normalizePhoneNumber(body.customerPhone);
    }

    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const firstError =
        Object.values(flat.fieldErrors).flat()[0] ||
        flat.formErrors[0] ||
        "Data pesanan tidak lengkap atau tidak valid";

      return NextResponse.json(
        { error: firstError, details: flat },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const supabase = await createClient();

    // Require authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Anda harus login untuk membuat pesanan." }, { status: 401 });
    }
    const customerId = user.id;

    // Fetch service + fare_zones in parallel
    const [{ data: service, error: svcErr }, { data: fareZones, error: zonesErr }] = await Promise.all([
      supabase.from("services").select("id, name, extra_fee, slug").eq("id", data.serviceId).eq("is_active", true).single(),
      supabase.from("fare_zones").select("*").eq("is_active", true).order("sort_order"),
    ]);

    if (svcErr || !service) {
      return NextResponse.json({ error: "Layanan tidak ditemukan atau tidak aktif" }, { status: 404 });
    }

    if (zonesErr || !fareZones || fareZones.length === 0) {
      return NextResponse.json({ error: "Konfigurasi tarif belum tersedia" }, { status: 500 });
    }

    // Deteksi otomatis jam malam: Order di atas pukul 22.30 WIB (+Rp1.000)
    const isNight = isNightTime();
    const isRain = false; // Default awal adalah tidak hujan, driver yang menyalakan jika hujan di lapangan

    // HITUNG ULANG TARIF DI SERVER — jangan pernah percaya angka mentah dari client
    const fareResult = calculateFare(
      data.distanceKm,
      {
        serviceExtraFee: service.extra_fee,
        isRain,
        isNight,
        extraStops: data.extraStops,
        jastipOptions: {
          extraPlaces: data.jastipExtraPlaces,
          isSameArea: data.jastipSameArea,
          totalItems: data.jastipItemsCount,
          isOutsideUin: data.jastipOutsideUin,
        },
      },
      fareZones
    );

    const orderId = `ORD-UIN-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const extraFeeDetails = {
      extra_stops: data.extraStops,
      jastip_extra_places: data.jastipExtraPlaces,
      jastip_same_area: data.jastipSameArea,
      jastip_items_count: data.jastipItemsCount,
      jastip_outside_uin: data.jastipOutsideUin,
    };

    const fareSnapshot = {
      service_name: service.name,
      zone_name: fareResult.zone.name,
      base_price: fareResult.base_price,
      extra_fee: fareResult.extra_fee,
      per_km_extra: fareResult.per_km_extra,
      is_rain: false,
      rain_fee: 0,
      is_night: isNight,
      night_fee: isNight ? 1000 : 0,
      extra_stops: data.extraStops,
      extra_stops_fee: fareResult.extra_stops_fee,
      jastip_details: {
        places_count: (data.jastipExtraPlaces || 0) + 1,
        extra_places_fee: data.jastipSameArea ? 0 : (data.jastipExtraPlaces || 0) * 2000,
        items_count: data.jastipItemsCount,
        extra_items_fee: (data.jastipItemsCount || 0) > 3 ? ((data.jastipItemsCount || 0) - 3) * 1000 : 0,
        is_same_area: data.jastipSameArea,
        is_outside_uin: data.jastipOutsideUin,
      },
      breakdown: fareResult.breakdown,
      total: fareResult.total,
      distance_km: data.distanceKm,
      calculated_at: now,
    };

    const { error: insertErr } = await supabase.from("orders").insert({
      id: orderId,
      customer_id: customerId,
      customer_name: data.customerName,
      customer_phone: data.customerPhone,
      service_id: service.id,
      service_name: service.name,
      pickup_name: data.pickupName,
      pickup_lat: data.pickupLat,
      pickup_lng: data.pickupLng,
      dropoff_name: data.dropoffName,
      dropoff_lat: data.dropoffLat,
      dropoff_lng: data.dropoffLng,
      distance_km: data.distanceKm,
      fare: fareResult.total,
      fare_snapshot: fareSnapshot,
      is_rain: false,
      rain_fee: 0,
      is_night: isNight,
      night_fee: isNight ? 1000 : 0,
      extra_fee_details: extraFeeDetails,
      item_notes: data.itemNotes ?? null,
      items_estimate: data.itemsEstimate ?? null,
      payment_method: data.paymentMethod,
      status: "pending",
    });

    if (insertErr) {
      console.error("Error inserting order:", insertErr);
      return NextResponse.json(
        { error: insertErr.message || "Gagal menyimpan pesanan ke database" },
        { status: 500 }
      );
    }

    await supabase.from("order_events").insert({
      order_id: orderId,
      status_from: null,
      status_to: "pending",
      actor_id: customerId,
      notes: "Pesanan berhasil dibuat, menunggu konfirmasi driver/admin.",
    });

    const newOrder: Order = {
      id: orderId,
      customer_id: customerId,
      customer_name: data.customerName,
      customer_phone: data.customerPhone,
      driver_id: null,
      service_id: service.id,
      service_name: service.name,
      pickup_name: data.pickupName,
      pickup_lat: data.pickupLat,
      pickup_lng: data.pickupLng,
      dropoff_name: data.dropoffName,
      dropoff_lat: data.dropoffLat,
      dropoff_lng: data.dropoffLng,
      distance_km: data.distanceKm,
      fare: fareResult.total,
      fare_snapshot: fareSnapshot,
      item_notes: data.itemNotes ?? null,
      items_estimate: data.itemsEstimate ?? null,
      payment_method: data.paymentMethod,
      status: "pending",
      created_at: now,
      assigned_at: null,
      completed_at: null,
      cancel_reason: null,
    };

    const initialEvent: OrderEvent = {
      id: `ev-${Date.now()}`,
      order_id: orderId,
      status_from: null,
      status_to: "pending",
      actor_id: customerId,
      notes: "Pesanan berhasil dibuat, menunggu konfirmasi driver/admin.",
      created_at: now,
    };

    return NextResponse.json({
      success: true,
      message: "Pesanan berhasil dibuat",
      order: newOrder,
      event: initialEvent,
      redirectUrl: `/order/${orderId}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
