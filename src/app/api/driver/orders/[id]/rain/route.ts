import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/driver/orders/[id]/rain — Driver mengaktifkan/menonaktifkan opsi hujan
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: orderId } = await params;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const isRain = Boolean(body.is_rain);

    // Fetch driver record & order in parallel
    const [{ data: driverRecord, error: driverErr }, { data: order, error: fetchErr }] =
      await Promise.all([
        supabase.from("drivers").select("id").eq("profile_id", user.id).single(),
        supabase
          .from("orders")
          .select("id, status, driver_id, fare, fare_snapshot, is_rain")
          .eq("id", orderId)
          .single(),
      ]);

    if (driverErr || !driverRecord) {
      return NextResponse.json({ error: "Akun driver tidak ditemukan" }, { status: 404 });
    }

    if (fetchErr || !order) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }

    if (order.driver_id !== driverRecord.id) {
      return NextResponse.json(
        { error: "Anda hanya bisa mengedit pesanan yang Anda terima." },
        { status: 403 }
      );
    }

    if (order.status === "completed" || order.status === "cancelled") {
      return NextResponse.json(
        { error: "Tidak dapat mengubah opsi cuaca pada order yang sudah selesai atau dibatalkan." },
        { status: 400 }
      );
    }

    const currentIsRain = Boolean(order.is_rain);
    if (currentIsRain === isRain) {
      return NextResponse.json({
        order,
        message: `Opsi hujan sudah dalam kondisi ${isRain ? "aktif" : "nonaktif"}.`,
      });
    }

    // Hitung penyesuaian tarif (+Rp2.000 saat aktif, -Rp2.000 saat nonaktif)
    const fareDiff = isRain ? 2000 : -2000;
    const newFare = Math.max(0, order.fare + fareDiff);

    const prevSnapshot = (order.fare_snapshot || {}) as Record<string, any>;
    const prevBreakdown = Array.isArray(prevSnapshot.breakdown)
      ? [...prevSnapshot.breakdown]
      : [];

    let updatedBreakdown = prevBreakdown;
    if (isRain) {
      if (!updatedBreakdown.some((b) => b.label?.toLowerCase().includes("hujan"))) {
        updatedBreakdown.push({ label: "Opsi Cuaca Hujan", amount: 2000 });
      }
    } else {
      updatedBreakdown = updatedBreakdown.filter(
        (b) => !b.label?.toLowerCase().includes("hujan")
      );
    }

    const updatedSnapshot = {
      ...prevSnapshot,
      is_rain: isRain,
      rain_fee: isRain ? 2000 : 0,
      total: newFare,
      breakdown: updatedBreakdown,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedOrder, error: updateErr } = await supabase
      .from("orders")
      .update({
        fare: newFare,
        is_rain: isRain,
        rain_fee: isRain ? 2000 : 0,
        fare_snapshot: updatedSnapshot,
      })
      .eq("id", orderId)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Insert order event
    supabase
      .from("order_events")
      .insert({
        order_id: orderId,
        status_from: order.status,
        status_to: order.status,
        actor_id: user.id,
        notes: isRain
          ? "Driver mengaktifkan opsi kondisi hujan (+Rp 2.000)."
          : "Driver menonaktifkan opsi kondisi hujan (-Rp 2.000).",
      })
      .then(({ error }) => {
        if (error) console.error("[rain] event insert error:", error);
      });

    return NextResponse.json({
      order: updatedOrder,
      message: isRain
        ? "Opsi hujan berhasil diaktifkan (+Rp2.000 ditambahkan ke tarif)."
        : "Opsi hujan berhasil dinonaktifkan.",
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Server error" },
      { status: 500 }
    );
  }
}
