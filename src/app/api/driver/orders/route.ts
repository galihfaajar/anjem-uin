import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/driver/orders - Pending orders for drivers + driver's active orders
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch pending orders (available to take)
    const { data: pendingOrders, error: pendingErr } = await supabase
      .from("orders")
      .select(`
        *,
        service:services(name, icon)
      `)
      .eq("status", "pending")
      .is("driver_id", null)
      .order("created_at", { ascending: false })
      .limit(20);

    if (pendingErr) {
      return NextResponse.json({ error: pendingErr.message }, { status: 500 });
    }

    // Fetch driver record by profile_id
    const { data: driverRecord } = await supabase
      .from("drivers")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    // Fetch driver's own active orders
    let myOrders: any[] = [];
    if (driverRecord) {
      const { data: myOrdersData } = await supabase
        .from("orders")
        .select(`
          *,
          service:services(name, icon)
        `)
        .eq("driver_id", driverRecord.id)
        .in("status", ["assigned", "on_the_way", "completed"])
        .order("created_at", { ascending: false })
        .limit(30);
      myOrders = myOrdersData || [];
    }

    return NextResponse.json({
      pending: pendingOrders || [],
      mine: myOrders,
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Server error" },
      { status: 500 }
    );
  }
}
