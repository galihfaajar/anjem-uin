import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/orders/[id] - Get a single order by ID with driver info
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: orderId } = await params;

    // Select all columns including denormalized driver fields
    const { data: order, error } = await supabase
      .from("orders")
      .select(`
        *,
        service:services(name, icon)
      `)
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan" },
        { status: 404 }
      );
    }

    // Fetch order events
    const { data: events } = await supabase
      .from("order_events")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    // If driver_name is not denormalized yet on the order row, try to get from
    // the drivers table via driver_id FK as a fallback
    let driverName = order.driver_name || null;
    let driverPhone = order.driver_phone || null;
    let driverPlate = order.driver_plate || null;

    if (order.driver_id && (!driverName || !driverPhone)) {
      const { data: driverRec } = await supabase
        .from("drivers")
        .select(`
          plate_number,
          vehicle_type,
          profile:profiles!drivers_profile_id_fkey(full_name, phone)
        `)
        .eq("id", order.driver_id)
        .maybeSingle();

      if (driverRec) {
        const profile = Array.isArray(driverRec.profile)
          ? driverRec.profile[0]
          : driverRec.profile;
        driverName = driverName || (profile as any)?.full_name || null;
        driverPhone = driverPhone || (profile as any)?.phone || null;
        driverPlate = driverPlate || driverRec.plate_number || null;
      }
    }

    // Last resort: parse from order event notes
    if (!driverName && events) {
      const takeEv = events.find(
        (e) => e.status_to === "assigned" && e.notes
      );
      if (takeEv) {
        const match = takeEv.notes.match(/Driver\s+(.+?)\s+\(/);
        if (match) driverName = match[1];
      }
    }

    const enrichedOrder = {
      ...order,
      driver_name: driverName,
      driver_phone: driverPhone,
      driver_plate: driverPlate,
      service_name: Array.isArray(order.service)
        ? order.service[0]?.name
        : order.service?.name || order.service_name || null,
    };

    return NextResponse.json({
      order: enrichedOrder,
      events: events || [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/orders/[id] - Update order status (customer cancel, etc.)
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
    const { status, cancel_reason } = body;

    const updatePayload: Record<string, any> = { status };
    if (cancel_reason) updatePayload.cancel_reason = cancel_reason;
    if (status === "completed")
      updatePayload.completed_at = new Date().toISOString();

    const { data: updatedOrder, error: updateErr } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId)
      .select()
      .single();

    if (updateErr || !updatedOrder) {
      return NextResponse.json(
        { error: updateErr?.message || "Gagal memperbarui pesanan" },
        { status: 500 }
      );
    }

    // Insert event log
    await supabase.from("order_events").insert({
      order_id: orderId,
      status_from: null,
      status_to: status,
      actor_id: user.id,
      notes: cancel_reason
        ? `Pesanan dibatalkan: ${cancel_reason}`
        : `Status diperbarui ke ${status}`,
    });

    return NextResponse.json({
      order: updatedOrder,
      message: "Pesanan berhasil diperbarui",
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Server error" },
      { status: 500 }
    );
  }
}
