import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/profile - Get current user profile
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      // Profile might not exist yet (race condition with trigger)
      // Try to create it
      if (error.code === "PGRST116") {
        const { data: newProfile } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
            phone: user.user_metadata?.phone || null,
            role: user.user_metadata?.role || "customer",
          })
          .select()
          .single();
        
        return NextResponse.json({
          profile: newProfile,
          driver: null,
          email: user.email,
        });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If driver role, also fetch driver details via profile_id
    let driverData = null;
    if (profile?.role === "driver") {
      const { data: driver } = await supabase
        .from("drivers")
        .select("*")
        .eq("profile_id", user.id)
        .single();
      driverData = driver;
    }

    return NextResponse.json({
      profile,
      driver: driverData,
      email: user.email,
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/profile - Update current user profile
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, phone } = body;

    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: full_name?.trim() || undefined,
        phone: phone?.trim() || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data, message: "Profil berhasil diperbarui" });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Server error" },
      { status: 500 }
    );
  }
}
