import { NextResponse } from "next/server";

/**
 * Webhook stub untuk WhatsApp Business API / Gateway (Fonnte, Waba, dll.)
 * Status: NONAKTIF / STUB (memerlukan token provider eksternal)
 */
export async function POST(request: Request) {
  try {
    const signature = request.headers.get("x-hub-signature-256");

    // Di mode produksi, lakukan verifikasi HMAC signature di sini
    if (!process.env.WHATSAPP_WEBHOOK_SECRET) {
      return NextResponse.json(
        {
          status: "inactive",
          message:
            "WhatsApp gateway webhook stub siap, namun integrasi eksternal belum aktif (WHATSAPP_WEBHOOK_SECRET belum dikonfigurasi).",
        },
        { status: 200 }
      );
    }

    const payload = await request.json();
    console.log("WhatsApp webhook received:", payload);

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal memproses webhook" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  // Verifikasi challenge untuk Webhook WhatsApp Cloud API
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json(
    { message: "WhatsApp Webhook Endpoint Active" },
    { status: 200 }
  );
}
