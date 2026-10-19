import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/driver/orders/[id]/status - Driver updates own order status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: orderId } = await params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status, notes } = body;

    if (!["on_the_way", "completed", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
    }

    // Get driver's record by profile_id
    const { data: driverRecord, error: driverErr } = await supabase
      .from("drivers")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (driverErr || !driverRecord) {
      return NextResponse.json({ error: "Akun driver tidak ditemukan" }, { status: 404 });
    }

    // Fetch order to verify driver ownership (using drivers.id)
    const { data: order, error: fetchErr } = await supabase
      .from("orders")
      .select("status, driver_id")
      .eq("id", orderId)
      .single();

    if (fetchErr || !order) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }

    if (order.driver_id !== driverRecord.id) {
      return NextResponse.json({ error: "Bukan order Anda" }, { status: 403 });
    }

    const updatePayload: Record<string, any> = { status };
    if (status === "completed") {
      updatePayload.completed_at = new Date().toISOString();
    }

    const { data: updatedOrder, error: updateErr } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Insert order event
    await supabase.from("order_events").insert({
      order_id: orderId,
      status_from: order.status,
      status_to: status,
      actor_id: user.id,
      notes: notes || `Status diperbarui oleh driver ke: ${status}`,
    });

    return NextResponse.json({
      order: updatedOrder,
      message: "Status pesanan berhasil diperbarui",
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Server error" },
      { status: 500 }
    );
  }
}
