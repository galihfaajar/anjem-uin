import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/customer/orders - Get current customer's orders (includes driver info)
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: orders, error } = await supabase
      .from("orders")
      .select(`
        id,
        customer_id,
        customer_name,
        customer_phone,
        driver_id,
        driver_name,
        driver_phone,
        driver_plate,
        service_id,
        service_name,
        pickup_name,
        pickup_lat,
        pickup_lng,
        dropoff_name,
        dropoff_lat,
        dropoff_lng,
        distance_km,
        fare,
        fare_snapshot,
        item_notes,
        items_estimate,
        payment_method,
        status,
        created_at,
        assigned_at,
        completed_at,
        cancel_reason,
        service:services(name, icon)
      `)
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Normalize service_name from join if not already stored
    const enriched = (orders || []).map((o) => ({
      ...o,
      service_name:
        o.service_name ||
        (Array.isArray(o.service)
          ? o.service[0]?.name
          : (o.service as any)?.name) ||
        null,
    }));

    return NextResponse.json({ orders: enriched });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Server error" },
      { status: 500 }
    );
  }
}
