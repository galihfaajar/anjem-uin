import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/admin/drivers - List all drivers (Admin only)
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

    const { data: drivers, error } = await supabase
      .from("drivers")
      .select(`
        *,
        profile:profiles(full_name, phone, avatar_url)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ drivers: drivers || [] });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/drivers - Update driver status
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
    const { driverId, status } = body;

    if (!driverId || !["pending", "approved", "blocked"].includes(status)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("drivers")
      .update({ status })
      .eq("id", driverId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ driver: data, message: "Status driver berhasil diperbarui" });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Server error" },
      { status: 500 }
    );
  }
}

// POST /api/admin/drivers - Mendaftarkan Mitra Driver Baru (Hanya Admin)
export async function POST(request: Request) {
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
      return NextResponse.json({ error: "Forbidden: Hanya admin yang dapat mendaftarkan driver" }, { status: 403 });
    }

    const body = await request.json();
    const {
      fullName,
      email,
      phone,
      password,
      vehicleType,
      plateNumber,
      status = "approved",
    } = body;

    // Validasi kelengkapan form
    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ error: "Nama lengkap driver wajib diisi" }, { status: 400 });
    }
    if (!email || !email.trim() || !email.includes("@")) {
      return NextResponse.json({ error: "Alamat email driver tidak valid" }, { status: 400 });
    }
    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: "Nomor WhatsApp / HP driver wajib diisi" }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Kata sandi driver minimal 6 karakter" }, { status: 400 });
    }
    if (!vehicleType || !vehicleType.trim()) {
      return NextResponse.json({ error: "Jenis / tipe kendaraan wajib diisi" }, { status: 400 });
    }
    if (!plateNumber || !plateNumber.trim()) {
      return NextResponse.json({ error: "Nomor plat kendaraan wajib diisi" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let newUserId: string | null = null;

    if (serviceRoleKey) {
      // Menggunakan Service Role Client (otomatis konfirmasi email dan bypass RLS)
      const { createClient: createClientJs } = await import("@supabase/supabase-js");
      const adminClient = createClientJs(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: createdUser, error: adminCreateErr } = await adminClient.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName.trim(),
          phone: phone.trim(),
          role: "driver",
          vehicle_type: vehicleType.trim(),
          plate_number: plateNumber.trim().toUpperCase(),
        },
      });

      if (adminCreateErr) {
        return NextResponse.json({ error: adminCreateErr.message }, { status: 400 });
      }

      newUserId = createdUser.user?.id || null;

      if (newUserId) {
        // Sinkronisasi tabel profiles
        await adminClient.from("profiles").upsert({
          id: newUserId,
          full_name: fullName.trim(),
          phone: phone.trim(),
          role: "driver",
        });

        // Masukkan ke tabel drivers
        await adminClient.from("drivers").upsert({
          profile_id: newUserId,
          vehicle_type: vehicleType.trim(),
          plate_number: plateNumber.trim().toUpperCase(),
          status: status || "approved",
          is_online: false,
        });
      }
    } else {
      // Fallback menggunakan isolated JS client (tanpa memodifikasi session admin)
      const { createClient: createClientJs } = await import("@supabase/supabase-js");
      const client = createClientJs(supabaseUrl, supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: signUpData, error: signUpErr } = await client.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            role: "driver",
            vehicle_type: vehicleType.trim(),
            plate_number: plateNumber.trim().toUpperCase(),
          },
        },
      });

      if (signUpErr) {
        return NextResponse.json({ error: signUpErr.message }, { status: 400 });
      }

      newUserId = signUpData.user?.id || null;

      if (newUserId) {
        // Beri jeda sejenak untuk trigger database
        await new Promise((r) => setTimeout(r, 600));

        // Update profil agar memiliki role driver
        await supabase
          .from("profiles")
          .update({
            full_name: fullName.trim(),
            phone: phone.trim(),
            role: "driver",
          })
          .eq("id", newUserId);

        // Masukkan data driver
        try {
          await supabase.from("drivers").insert({
            profile_id: newUserId,
            vehicle_type: vehicleType.trim(),
            plate_number: plateNumber.trim().toUpperCase(),
            status: status || "approved",
            is_online: false,
          });
        } catch {
          // Abaikan jika sudah terbuat oleh trigger
        }
      }
    }

    // Catat log audit aksi admin
    try {
      await supabase.from("admin_audit_logs").insert({
        admin_id: user.id,
        action: "CREATE_DRIVER",
        target_type: "DRIVER",
        target_id: newUserId,
        details: {
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          vehicle_type: vehicleType.trim(),
          plate_number: plateNumber.trim().toUpperCase(),
          status,
        },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Mitra driver "${fullName.trim()}" berhasil didaftarkan!`,
      userId: newUserId,
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Server error" },
      { status: 500 }
    );
  }
}

