import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/admin/orders/[id]/status - Update order status (Admin)
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { status, driverId, notes } = body;

    // Fetch current order
    const { data: currentOrder, error: fetchErr } = await supabase
      .from("orders")
      .select("status, driver_id")
      .eq("id", orderId)
      .single();

    if (fetchErr || !currentOrder) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }

    const updatePayload: Record<string, any> = { status };

    if (status === "assigned" && driverId) {
      updatePayload.driver_id = driverId;
      updatePayload.assigned_at = new Date().toISOString();
    }
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
      status_from: currentOrder.status,
      status_to: status,
      actor_id: user.id,
      notes: notes || `Status diubah oleh admin ke: ${status}`,
    });

    return NextResponse.json({ order: updatedOrder, message: "Status pesanan diperbarui" });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Server error" },
      { status: 500 }
    );
  }
}
