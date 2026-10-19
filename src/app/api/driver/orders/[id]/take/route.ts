import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/driver/orders/[id]/take - Driver takes a pending order (atomic, race-safe)
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: orderId } = await params;

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch driver record
    const { data: driverRecord, error: driverErr } = await supabase
      .from("drivers")
      .select(
        "id, status, is_online, plate_number, vehicle_type, profile:profiles!drivers_profile_id_fkey(full_name, phone)"
      )
      .eq("profile_id", user.id)
      .single();

    if (driverErr || !driverRecord) {
      console.error("[take] driver fetch error:", driverErr);
      return NextResponse.json(
        { error: "Akun driver tidak ditemukan" },
        { status: 404 }
      );
    }

    if (driverRecord.status !== "approved") {
      return NextResponse.json(
        { error: "Akun driver belum disetujui admin" },
        { status: 403 }
      );
    }

    if (driverRecord.is_online === false) {
      return NextResponse.json(
        {
          error:
            "Anda sedang Offline. Aktifkan status Online terlebih dahulu untuk mengambil orderan.",
        },
        { status: 400 }
      );
    }

    // Check if this driver already has an active/ongoing order
    const { data: ongoingOrder } = await supabase
      .from("orders")
      .select("id, status")
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

    // Verify order exists and is still truly pending with no driver (double-check before atomic update)
    const { data: orderCheck, error: checkErr } = await supabase
      .from("orders")
      .select("id, status, driver_id")
      .eq("id", orderId)
      .maybeSingle();

    if (checkErr || !orderCheck) {
      return NextResponse.json(
        { error: "Order tidak ditemukan" },
        { status: 404 }
      );
    }

    if (orderCheck.status !== "pending") {
      return NextResponse.json(
        {
          error: `Order ini sudah dalam status "${orderCheck.status}". Silakan pilih orderan lain.`,
        },
        { status: 409 }
      );
    }

    if (orderCheck.driver_id !== null) {
      return NextResponse.json(
        { error: "Order ini sudah diambil driver lain." },
        { status: 409 }
      );
    }

    const profile = Array.isArray(driverRecord.profile)
      ? driverRecord.profile[0]
      : driverRecord.profile;

    const driverFullName = (profile as any)?.full_name || "Driver";
    const driverPhone = (profile as any)?.phone || null;

    // ATOMIC UPDATE: Only succeeds if status is still 'pending' (optimistic lock)
    const { data: updatedOrder, error: updateErr } = await supabase
      .from("orders")
      .update({
        driver_id: driverRecord.id,
        driver_name: driverFullName,
        driver_phone: driverPhone,
        driver_plate: driverRecord.plate_number || null,
        status: "assigned",
        assigned_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("status", "pending") // Atomic optimistic lock – only matches if still pending
      .is("driver_id", null) // Extra safety: only if no driver assigned yet
      .select()
      .maybeSingle();

    if (updateErr) {
      console.error("[take] update error:", updateErr);
      return NextResponse.json(
        { error: "Gagal mengambil order: " + updateErr.message },
        { status: 500 }
      );
    }

    if (!updatedOrder) {
      // Another driver took it between our check and update
      return NextResponse.json(
        {
          error:
            "Order baru saja diambil driver lain! Silakan pilih orderan lainnya.",
        },
        { status: 409 }
      );
    }

    // Record the event
    await supabase.from("order_events").insert({
      order_id: orderId,
      status_from: "pending",
      status_to: "assigned",
      actor_id: user.id,
      notes: `Driver ${driverFullName} (${driverRecord.plate_number || "—"}) mengambil pesanan ini.`,
    });

    return NextResponse.json({
      order: updatedOrder,
      message: "Pesanan berhasil diambil",
    });
  } catch (err) {
    console.error("[take] unexpected error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Server error" },
      { status: 500 }
    );
  }
}
