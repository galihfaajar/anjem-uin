import type { Order } from "@/types";
import { formatRupiah } from "@/lib/pricing/calculateFare";
import { buildWALink } from "@/lib/utils";

export type ChatTemplateType = "pickup" | "on_the_way" | "completed" | "inquiry";

export function getOrderServiceLabel(order: Order): string {
  return order.service_name || (order as any).service?.name || "Antar Jemput Motor (Ride)";
}

/**
 * Generate formatted WhatsApp message based on order details created by user
 */
export function buildDriverOrderMessage(
  order: Order,
  driverName: string,
  template: ChatTemplateType = "pickup"
): string {
  const customerName = order.customer_name || "Kak";
  const service = getOrderServiceLabel(order);
  const paymentMethod = order.payment_method === "cash" ? "Tunai" : "QRIS Driver";
  const fare = formatRupiah(order.fare);

  let greeting = `Halo kak ${customerName}, saya driver Anjem UIN (${driverName}) untuk order *${order.id}*.`;
  let statusMessage = "Saya sedang menuju ke lokasi penjemputan ya kak.";

  switch (template) {
    case "on_the_way":
      statusMessage = "Saya sudah dalam perjalanan mengantarkan pesanan kakak ke lokasi tujuan ya.";
      break;
    case "completed":
      statusMessage = "Pesanan kakak telah selesai diantar. Terima kasih banyak sudah mempercayakan pesanan pada Anjem UIN! 🙏";
      break;
    case "inquiry":
      statusMessage = "Mohon konfirmasi atau arahan tambahan mengenai pesanan/lokasi jemput kakak ya.";
      break;
    case "pickup":
    default:
      statusMessage = "Saya sedang bersiap dan menuju ke lokasi penjemputan sekarang ya kak.";
      break;
  }

  const lines: string[] = [
    greeting,
    "",
    "📋 *DETAIL ORDERAN:*",
    `• *Kode Order:* ${order.id}`,
    `• *Layanan:* ${service}`,
    `• *Lokasi Jemput/Beli:* ${order.pickup_name}`,
    `• *Lokasi Antar/Tujuan:* ${order.dropoff_name}`,
  ];

  if (order.item_notes && order.item_notes.trim()) {
    lines.push(`• *Catatan/Rincian:* ${order.item_notes.trim()}`);
  }

  lines.push(`• *Jarak Tempuh:* ${order.distance_km} km`);
  lines.push(`• *Total Ongkos:* ${fare} (${paymentMethod})`);
  lines.push("");
  lines.push(statusMessage);
  lines.push("");
  lines.push("Bila ada petunjuk arah atau catatan tambahan, langsung kabari saya di chat ini ya kak. Terima kasih! 🛵");

  return lines.join("\n");
}

export function buildDriverDirectWALink(
  order: Order,
  driverName: string,
  template?: ChatTemplateType
): string {
  if (!order.customer_phone) return "#";
  const defaultTemplate =
    template ||
    (order.status === "completed"
      ? "completed"
      : order.status === "on_the_way"
      ? "on_the_way"
      : "pickup");
  const msg = buildDriverOrderMessage(order, driverName, defaultTemplate);
  return buildWALink(order.customer_phone, msg);
}
