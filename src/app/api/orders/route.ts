import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateFare } from "@/lib/pricing/calculateFare";
import { DEMO_FARE_ZONES, DEMO_SERVICES } from "@/lib/data/demo";
import { createClient } from "@/lib/supabase/server";
import type { Order, OrderEvent } from "@/types";

const createOrderSchema = z.object({
  customerName: z.string().min(2, "Nama minimal 2 karakter"),
  customerPhone: z.string().min(8, "Nomor WhatsApp/HP minimal 8 digit"),
  serviceId: z.string().min(1, "Layanan wajib dipilih"),
  pickupName: z.string().min(3, "Titik jemput minimal 3 karakter"),
  pickupLat: z.number().default(-7.5576),
  pickupLng: z.number().default(110.7706),
  dropoffName: z.string().min(3, "Titik tujuan minimal 3 karakter"),
  dropoffLat: z.number().default(-7.5576),
  dropoffLng: z.number().default(110.7706),
  distanceKm: z.number().min(0.1, "Jarak minimal 0.1 km").max(30, "Jarak melebihi batas 30 km"),
  itemNotes: z.string().optional().nullable(),
  itemsEstimate: z.number().optional().nullable(),
  paymentMethod: z.enum(["cash", "qris_driver"]),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data pesanan tidak valid", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const service = DEMO_SERVICES.find((s) => s.id === data.serviceId);
    if (!service) {
      return NextResponse.json({ error: "Layanan tidak ditemukan" }, { status: 404 });
    }

    // HITUNG ULANG TARIF DI SERVER — jangan pernah percaya angka dari client
    const fareResult = calculateFare(data.distanceKm, service.extra_fee, DEMO_FARE_ZONES);

    const orderId = `ORD-UIN-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const newOrder: Order = {
      id: orderId,
      customer_id: "demo-user",
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
      fare_snapshot: {
        service_name: service.name,
        zone_name: fareResult.zone.name,
        base_price: fareResult.base_price,
        extra_fee: fareResult.extra_fee,
        per_km_extra: fareResult.per_km_extra,
        total: fareResult.total,
        distance_km: data.distanceKm,
        calculated_at: now,
      },
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
      actor_id: null,
      notes: "Pesanan berhasil dibuat, menunggu konfirmasi driver/admin.",
      created_at: now,
    };

    // Simpan ke Supabase jika URL konfigurasi aktif
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
    ) {
      try {
        const supabase = await createClient();
        const { data: authUser } = await supabase.auth.getUser();
        const customerId = authUser?.user?.id || null;

        await supabase.from("orders").insert({
          id: orderId,
          customer_id: customerId,
          customer_name: data.customerName,
          customer_phone: data.customerPhone,
          service_id: service.id,
          pickup_name: data.pickupName,
          pickup_lat: data.pickupLat,
          pickup_lng: data.pickupLng,
          dropoff_name: data.dropoffName,
          dropoff_lat: data.dropoffLat,
          dropoff_lng: data.dropoffLng,
          distance_km: data.distanceKm,
          fare: fareResult.total,
          fare_snapshot: newOrder.fare_snapshot,
          item_notes: data.itemNotes ?? null,
          items_estimate: data.itemsEstimate ?? null,
          payment_method: data.paymentMethod,
          status: "pending",
        });

        await supabase.from("order_events").insert({
          order_id: orderId,
          status_from: null,
          status_to: "pending",
          actor_id: customerId,
          notes: "Pesanan berhasil dibuat, menunggu konfirmasi driver/admin.",
        });
      } catch (dbErr) {
        console.error("Pemberitahuan simpan database Supabase:", dbErr);
      }
    }

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
