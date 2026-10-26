import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateFare, isNightTime } from "@/lib/pricing/calculateFare";
import { createClient } from "@/lib/supabase/server";

const fareSchema = z.object({
  serviceId: z.string().min(1, "Layanan wajib dipilih"),
  distanceKm: z.number().min(0, "Jarak tidak boleh negatif").max(50, "Jarak melebihi batas maksimal 50 km"),
  isRain: z.boolean().optional(),
  isNight: z.boolean().optional(),
  extraStops: z.number().int().min(0).optional(),
  jastipOptions: z
    .object({
      extraPlaces: z.number().int().min(0).optional(),
      isSameArea: z.boolean().optional(),
      totalItems: z.number().int().min(0).optional(),
      isOutsideUin: z.boolean().optional(),
      waitHoursOver1: z.boolean().optional(),
      closedAttempts: z.number().int().min(0).optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = fareSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { serviceId, distanceKm, isRain, isNight, extraStops, jastipOptions } = parsed.data;
    const supabase = await createClient();

    // Ambil layanan dari database
    const { data: service } = await supabase
      .from("services")
      .select("id, name, extra_fee")
      .eq("id", serviceId)
      .eq("is_active", true)
      .single();

    const extraFee = service ? service.extra_fee : 0;

    // Ambil zona tarif dari database
    const { data: fareZones } = await supabase
      .from("fare_zones")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");

    if (!fareZones || fareZones.length === 0) {
      return NextResponse.json({ error: "Konfigurasi tarif belum tersedia" }, { status: 500 });
    }

    // Default jam malam: jika tidak dikirim spesifik, deteksi otomatis realtime
    const nightActive = typeof isNight === "boolean" ? isNight : isNightTime();

    const fareResult = calculateFare(
      distanceKm,
      {
        serviceExtraFee: extraFee,
        isRain: Boolean(isRain),
        isNight: nightActive,
        extraStops: extraStops || 0,
        jastipOptions,
      },
      fareZones
    );

    return NextResponse.json({
      success: true,
      serviceName: service?.name ?? "Layanan",
      data: fareResult,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Gagal menghitung tarif" },
      { status: 500 }
    );
  }
}
