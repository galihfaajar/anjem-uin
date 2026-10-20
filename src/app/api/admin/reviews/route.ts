import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/admin/reviews - Ambil daftar semua ulasan untuk panel admin
export async function GET() {
  try {
    const supabase = await createClient();

    // Verifikasi sesi & peran admin
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

    const { data: reviews, error } = await supabase
      .from("reviews")
      .select(`
        id,
        order_id,
        customer_id,
        driver_id,
        service_id,
        rating,
        comment,
        is_approved,
        created_at,
        service:services(name),
        driver:drivers(
          plate_number,
          vehicle_type,
          profile:profiles(full_name, phone)
        ),
        customer:profiles!reviews_customer_id_fkey(full_name, phone),
        order:orders!reviews_order_id_fkey(customer_name, customer_phone, pickup_name, dropoff_name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format struktur data ulasan agar rapi dan mudah dikonsumsi di frontend
    const formattedReviews = (reviews || []).map((r: any) => ({
      id: r.id,
      order_id: r.order_id,
      rating: r.rating,
      comment: r.comment,
      is_approved: r.is_approved,
      created_at: r.created_at,
      service_name: r.service?.name || "Layanan Anjem",
      customer_name: r.customer?.full_name || r.order?.customer_name || "Pelanggan Mahasiswa",
      customer_phone: r.customer?.phone || r.order?.customer_phone || "-",
      driver_name: r.driver?.profile?.full_name || "Driver Anjem",
      driver_plate: r.driver?.plate_number || "-",
      route_summary: r.order?.pickup_name && r.order?.dropoff_name
        ? `${r.order.pickup_name} → ${r.order.dropoff_name}`
        : null,
    }));

    return NextResponse.json({ reviews: formattedReviews });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/reviews - Hapus ulasan dari database (Admin only)
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();

    // Verifikasi sesi & peran admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Ambil ID dari search params atau JSON body
    const url = new URL(request.url);
    let id = url.searchParams.get("id");
    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ error: "ID ulasan wajib disertakan" }, { status: 400 });
    }

    // Ambil detail ulasan sebelum dihapus untuk pencatatan audit log
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id, order_id, rating, comment, customer_id, driver_id")
      .eq("id", id)
      .maybeSingle();

    // Eksekusi penghapusan
    const { error: delError } = await supabase
      .from("reviews")
      .delete()
      .eq("id", id);

    if (delError) {
      return NextResponse.json({ error: delError.message }, { status: 500 });
    }

    // Catat ke admin_audit_logs
    try {
      await supabase.from("admin_audit_logs").insert({
        admin_id: user.id,
        action: "DELETE_REVIEW",
        target_type: "REVIEW",
        target_id: id,
        details: {
          deleted_at: new Date().toISOString(),
          order_id: existingReview?.order_id,
          rating: existingReview?.rating,
          comment: existingReview?.comment,
          deleted_by: profile?.full_name || user.email || "Admin",
        },
      });
    } catch {
      // Abaikan jika audit log gagal tercatat
    }

    return NextResponse.json({
      success: true,
      message: "Ulasan berhasil dihapus dari sistem.",
      deletedId: id,
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Server error" },
      { status: 500 }
    );
  }
}
