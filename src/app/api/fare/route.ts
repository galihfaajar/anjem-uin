import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateFare } from "@/lib/pricing/calculateFare";
import { DEMO_FARE_ZONES, DEMO_SERVICES } from "@/lib/data/demo";

const fareSchema = z.object({
  serviceId: z.string().min(1, "Layanan wajib dipilih"),
  distanceKm: z.number().min(0, "Jarak tidak boleh negatif").max(50, "Jarak melebihi batas maksimal 50 km"),
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

    const { serviceId, distanceKm } = parsed.data;

    const service = DEMO_SERVICES.find((s) => s.id === serviceId);
    const extraFee = service ? service.extra_fee : 0;

    const fareResult = calculateFare(distanceKm, extraFee, DEMO_FARE_ZONES);

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
