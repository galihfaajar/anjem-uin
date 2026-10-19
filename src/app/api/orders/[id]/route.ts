import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/orders/[id] - Get a single order by ID (public or auth)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: orderId } = await params;

    const { data: order, error } = await supabase
      .from("orders")
      .select(`
        *,
        service:services(name, icon),
        driver_info:drivers!orders_driver_id_fkey(
          plate_number,
          vehicle_type,
          rating_avg,
          profile:profiles!drivers_id_fkey(full_name, phone)
        )
      `)
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    // Flatten driver info for easier consumption
    const driverInfo = Array.isArray(order.driver_info)
      ? order.driver_info[0]
      : order.driver_info;
    const driverProfile = driverInfo?.profile
      ? Array.isArray(driverInfo.profile)
        ? driverInfo.profile[0]
        : driverInfo.profile
      : null;

    // Fetch order events
    const { data: events } = await supabase
      .from("order_events")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    let extractedDriverName = driverProfile?.full_name || null;
    if (!extractedDriverName && events) {
      const takeEv = events.find((e) => e.status_to === "assigned" && e.notes);
      if (takeEv) {
        const match = takeEv.notes.match(/Driver\s+(.+?)\s+\(/);
        if (match) extractedDriverName = match[1];
      }
    }

    const enrichedOrder = {
      ...order,
      driver_name: extractedDriverName,
      driver_phone: driverProfile?.phone || null,
      driver_plate: driverInfo?.plate_number || null,
      service_name: Array.isArray(order.service)
        ? order.service[0]?.name
        : order.service?.name || null,
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
