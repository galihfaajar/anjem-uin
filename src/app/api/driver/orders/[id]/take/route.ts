import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/driver/orders/[id]/take - Driver takes a pending order
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: orderId } = await params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is an approved driver via profile_id
    const { data: driverRecord, error: driverErr } = await supabase
      .from("drivers")
      .select("id, status, is_online, plate_number, vehicle_type, profile:profiles!drivers_profile_id_fkey(full_name, phone)")
      .eq("profile_id", user.id)
      .single();

    if (driverErr || !driverRecord) {
      return NextResponse.json({ error: "Akun driver tidak ditemukan" }, { status: 404 });
    }

    if (driverRecord.status !== "approved") {
      return NextResponse.json(
        { error: "Akun driver belum disetujui admin" },
        { status: 403 }
      );
    }

    // Pastikan driver sedang online
    if (driverRecord.is_online === false) {
      return NextResponse.json(
        { error: "Anda sedang Offline. Aktifkan status Online terlebih dahulu untuk mengambil orderan." },
        { status: 400 }
      );
    }

    // ATURAN KETAT: Driver yang sedang menjalankan orderan TIDAK BISA mengambil orderan lain
    const { data: ongoingOrder } = await supabase
      .from("orders")
      .select("id")
      .eq("driver_id", driverRecord.id)
      .in("status", ["assigned", "on_the_way"])
      .maybeSingle();

    if (ongoingOrder) {
      return NextResponse.json(
        {
          error: `Anda masih memiliki orderan aktif (${ongoingOrder.id}) yang sedang berjalan. Selesaikan pesanan tersebut terlebih dahulu!`,
        },
        { status: 400 }
      );
    }

    // Fetch order to verify it's still pending
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("status, driver_id")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }

    if (order.status !== "pending" || order.driver_id !== null) {
      return NextResponse.json(
        { error: "Order baru saja diambil oleh driver lain! Silakan pilih orderan lainnya." },
        { status: 409 }
      );
    }

    const profile = Array.isArray(driverRecord.profile)
      ? driverRecord.profile[0]
      : driverRecord.profile;

    // Assign the order atomically using driver UUID (driverRecord.id)
    const { data: updatedOrder, error: updateErr } = await supabase
      .from("orders")
      .update({
        driver_id: driverRecord.id,  // Use driver table ID, not profile/auth ID
        status: "assigned",
        assigned_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("status", "pending") // Atomic optimistic lock
      .select()
      .maybeSingle();

    if (updateErr || !updatedOrder) {
      return NextResponse.json(
        { error: "Order baru saja diambil oleh driver lain! Silakan pilih orderan lainnya." },
        { status: 409 }
      );
    }

    // Insert order event
    await supabase.from("order_events").insert({
      order_id: orderId,
      status_from: "pending",
      status_to: "assigned",
      actor_id: user.id,
      notes: `Driver ${profile?.full_name || "Driver"} (${driverRecord.plate_number}) mengambil pesanan ini.`,
    });

    return NextResponse.json({
      order: updatedOrder,
      message: "Pesanan berhasil diambil",
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Server error" },
      { status: 500 }
    );
  }
}
