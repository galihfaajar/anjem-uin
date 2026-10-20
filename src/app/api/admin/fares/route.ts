import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/admin/fares - Ambil daftar zona tarif dan layanan (Admin)
export async function GET() {
  try {
    const supabase = await createClient();

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

    const [{ data: zones, error: zErr }, { data: services, error: sErr }] = await Promise.all([
      supabase.from("fare_zones").select("*").order("sort_order"),
      supabase.from("services").select("*").order("sort_order"),
    ]);

    if (zErr || sErr) {
      return NextResponse.json(
        { error: zErr?.message || sErr?.message || "Gagal mengambil data tarif" },
        { status: 500 }
      );
    }

    return NextResponse.json({ fareZones: zones || [], services: services || [] });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/fares - Update harga tarif zona & biaya layanan (Admin)
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

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
    const { zones, services } = body;

    // 1. Update zona tarif jika ada
    if (Array.isArray(zones) && zones.length > 0) {
      for (const z of zones) {
        if (!z.id) continue;
        const updateData: Record<string, any> = {};
        if (z.base_price !== undefined) {
          const bp = Number(z.base_price);
          if (isNaN(bp) || bp < 0) {
            return NextResponse.json({ error: `Tarif dasar ${z.id} tidak valid` }, { status: 400 });
          }
          updateData.base_price = bp;
        }
        if (z.per_km_price !== undefined) {
          const pkp = Number(z.per_km_price);
          if (isNaN(pkp) || pkp < 0) {
            return NextResponse.json({ error: `Tarif per-km ${z.id} tidak valid` }, { status: 400 });
          }
          updateData.per_km_price = pkp;
        }
        if (z.is_active !== undefined) {
          updateData.is_active = Boolean(z.is_active);
        }

        if (Object.keys(updateData).length > 0) {
          const { error: updateErr } = await supabase
            .from("fare_zones")
            .update(updateData)
            .eq("id", z.id);

          if (updateErr) {
            return NextResponse.json(
              { error: `Gagal memperbarui zona ${z.id}: ${updateErr.message}` },
              { status: 500 }
            );
          }
        }
      }
    }

    // 2. Update biaya tambahan layanan jika ada
    if (Array.isArray(services) && services.length > 0) {
      for (const s of services) {
        if (!s.id) continue;
        const updateData: Record<string, any> = {};
        if (s.extra_fee !== undefined) {
          const fee = Number(s.extra_fee);
          if (isNaN(fee) || fee < 0) {
            return NextResponse.json({ error: `Biaya layanan ${s.id} tidak valid` }, { status: 400 });
          }
          updateData.extra_fee = fee;
        }
        if (s.is_active !== undefined) {
          updateData.is_active = Boolean(s.is_active);
        }

        if (Object.keys(updateData).length > 0) {
          const { error: updateErr } = await supabase
            .from("services")
            .update(updateData)
            .eq("id", s.id);

          if (updateErr) {
            return NextResponse.json(
              { error: `Gagal memperbarui layanan ${s.id}: ${updateErr.message}` },
              { status: 500 }
            );
          }
        }
      }
    }

    // 3. Catat audit log jika tabel tersedia
    try {
      await supabase.from("admin_audit_logs").insert({
        admin_id: user.id,
        action: "UPDATE_FARES",
        target_type: "FARES_AND_SERVICES",
        target_id: "pricing_config",
        details: {
          zones_updated: zones?.length || 0,
          services_updated: services?.length || 0,
        },
      });
    } catch {
      // Abaikan jika audit log gagal
    }

    // Ambil data terbaru setelah update
    const [{ data: updatedZones }, { data: updatedServices }] = await Promise.all([
      supabase.from("fare_zones").select("*").order("sort_order"),
      supabase.from("services").select("*").order("sort_order"),
    ]);

    return NextResponse.json({
      success: true,
      message: "Tarif dan biaya layanan berhasil diperbarui!",
      fareZones: updatedZones || [],
      services: updatedServices || [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Server error" },
      { status: 500 }
    );
  }
}
