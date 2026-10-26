import { jsPDF } from "jspdf";
import type { Order } from "@/types";
import { formatRupiah } from "@/lib/pricing/calculateFare";

interface DriverInfo {
  name: string;
  plate: string;
  vehicle: string;
}

export function generateInvoicePdf(order: Order, driverInfo?: DriverInfo) {
  // Create A4 portrait document (210mm x 297mm)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 16;
  const contentWidth = pageWidth - margin * 2; // 178mm

  // Colors
  const primaryNavy = [15, 23, 42]; // #0f172a
  const primaryBlue = [2, 132, 199]; // #0284c7
  const successGreen = [16, 185, 129]; // #10b981
  const bgLight = [248, 250, 252]; // #f8fafc
  const textDark = [30, 41, 59]; // #1e293b
  const textMuted = [100, 116, 139]; // #64748b
  const borderColor = [226, 232, 240]; // #e2e8f0

  let y = margin;

  // ==================== 1. TOP HEADER BRANDING ====================
  // Header background card
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(margin, y, contentWidth, 32, 3, 3, "F");
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 32, 3, 3, "S");

  // Brand Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.text("ANJEM UIN", margin + 6, y + 11);

  // Subtitle / Campus
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Antar Jemput & Jastip Mahasiswa", margin + 6, y + 17);
  doc.text("UIN Raden Mas Said Surakarta", margin + 6, y + 22);

  // Right Side: INVOICE / STATUS
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("INVOICE RESMI", pageWidth - margin - 6, y + 11, { align: "right" });

  // Status Badge (SELESAI / LUNAS)
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.setDrawColor(successGreen[0], successGreen[1], successGreen[2]);
  doc.roundedRect(pageWidth - margin - 42, y + 14, 36, 7, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text("PESANAN SELESAI", pageWidth - margin - 24, y + 18.5, { align: "center" });

  // Invoice Number
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`No: INV-${order.id}`, pageWidth - margin - 6, y + 26, { align: "right" });

  y += 38;

  // ==================== 2. TRANSACTION METADATA ====================
  const completedDate = order.completed_at || order.created_at || new Date().toISOString();
  const dateFormatted = new Date(completedDate).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("KODE PESANAN:", margin + 5, y + 5.5);
  doc.text("WAKTU SELESAI:", margin + 65, y + 5.5);
  doc.text("METODE PEMBAYARAN:", margin + 125, y + 5.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(order.id, margin + 5, y + 10.5);
  doc.text(dateFormatted + " WIB", margin + 65, y + 10.5);
  doc.text(order.payment_method === "cash" ? "Tunai (Cash)" : "QRIS Driver", margin + 125, y + 10.5);

  y += 19;

  // ==================== 3. TWO COLUMNS: PEMESAN & DRIVER ====================
  const colWidth = (contentWidth - 6) / 2; // 86mm

  // Box Pemesan (Left)
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.roundedRect(margin, y, colWidth, 26, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.text("INFORMASI PEMESAN (USER)", margin + 4, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Nama:", margin + 4, y + 12);
  doc.text("No. WhatsApp:", margin + 4, y + 17);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(order.customer_name || "Pelanggan Anjem", margin + 28, y + 12);
  doc.text(order.customer_phone || "-", margin + 28, y + 17);

  // Box Driver (Right)
  const rightX = margin + colWidth + 6;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(rightX, y, colWidth, 26, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.text("INFORMASI MITRA DRIVER", rightX + 4, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Nama Driver:", rightX + 4, y + 12);
  doc.text("Kendaraan:", rightX + 4, y + 17);
  doc.text("Nomor Plat:", rightX + 4, y + 22);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const finalDriverName = driverInfo?.name || order.driver_name || "Mitra Driver Anjem";
  const finalPlate = driverInfo?.plate || order.driver_plate || "-";
  const finalVehicle = driverInfo?.vehicle || "Sepeda Motor";

  doc.text(finalDriverName, rightX + 28, y + 12);
  doc.text(finalVehicle, rightX + 28, y + 17);
  doc.text(finalPlate, rightX + 28, y + 22);

  y += 32;

  // ==================== 4. RINCIAN PESANAN (TABLE / CARD) ====================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("RINCIAN PERJALANAN & LAYANAN", margin, y + 4);

  y += 7;

  // Details Container
  const serviceLabel =
    order.service_name || (order as any).service?.name || "Antar Jemput Motor (Ride)";

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  
  // Calculate height needed for items notes & addresses
  const pickupLines = doc.splitTextToSize(order.pickup_name || "-", contentWidth - 45);
  const dropoffLines = doc.splitTextToSize(order.dropoff_name || "-", contentWidth - 45);
  const notesLines = order.item_notes ? doc.splitTextToSize(order.item_notes, contentWidth - 45) : [];

  let detailsHeight = 44 + (pickupLines.length - 1) * 4 + (dropoffLines.length - 1) * 4;
  if (notesLines.length > 0) {
    detailsHeight += 8 + notesLines.length * 4;
  }

  doc.roundedRect(margin, y, contentWidth, detailsHeight, 2, 2, "FD");

  let rowY = y + 7;

  // Row 1: Layanan & Jarak
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Jenis Layanan", margin + 5, rowY);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(serviceLabel, margin + 42, rowY);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Jarak:", pageWidth - margin - 35, rowY);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`${order.distance_km} km`, pageWidth - margin - 5, rowY, { align: "right" });

  // Divider
  rowY += 5;
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.line(margin + 5, rowY, pageWidth - margin - 5, rowY);
  rowY += 5;

  // Row 2: Titik Penjemputan / Beli
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Titik Jemput / Beli", margin + 5, rowY);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(pickupLines, margin + 42, rowY);

  rowY += Math.max(7, pickupLines.length * 4.5);

  // Row 3: Titik Pengantaran / Tujuan
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Titik Antar / Tujuan", margin + 5, rowY);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(dropoffLines, margin + 42, rowY);

  rowY += Math.max(7, dropoffLines.length * 4.5);

  // Row 4 (Optional): Catatan / Rincian Pesanan
  if (notesLines.length > 0) {
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.line(margin + 5, rowY - 1, pageWidth - margin - 5, rowY - 1);
    rowY += 4;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text("Catatan Pemesan", margin + 5, rowY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text(notesLines, margin + 42, rowY);
  }

  y += detailsHeight + 7;

  // ==================== 5. RINCIAN BIAYA & TOTAL ====================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("RINCIAN PEMBAYARAN & INVOICE", margin, y + 4);

  y += 7;

  // Build items breakdown list
  const snapshot = order.fare_snapshot;
  const breakdownRows: { label: string; amount: string }[] = [];

  if (snapshot?.breakdown && Array.isArray(snapshot.breakdown) && snapshot.breakdown.length > 0) {
    snapshot.breakdown.forEach((item) => {
      breakdownRows.push({
        label: item.label,
        amount: formatRupiah(item.amount),
      });
    });
  } else {
    if (snapshot?.base_price) {
      breakdownRows.push({
        label: `Tarif Dasar (${snapshot.zone_name || "Zona Standar"})`,
        amount: formatRupiah(snapshot.base_price),
      });
    } else {
      breakdownRows.push({
        label: "Tarif / Ongkos Layanan",
        amount: formatRupiah(order.fare),
      });
    }

    if (snapshot?.per_km_extra && snapshot.per_km_extra > 0) {
      breakdownRows.push({
        label: "Biaya Tambahan Jarak",
        amount: formatRupiah(snapshot.per_km_extra),
      });
    }

    if (order.is_rain || snapshot?.is_rain) {
      breakdownRows.push({
        label: "Opsi Cuaca Hujan",
        amount: formatRupiah(order.rain_fee || snapshot?.rain_fee || 2000),
      });
    }

    if (order.is_night || snapshot?.is_night) {
      breakdownRows.push({
        label: "Biaya Pesanan Larut Malam (> 22.30 WIB)",
        amount: formatRupiah(order.night_fee || snapshot?.night_fee || 1000),
      });
    }

    if (snapshot?.extra_fee && snapshot.extra_fee > 0) {
      breakdownRows.push({
        label: "Biaya Layanan",
        amount: formatRupiah(snapshot.extra_fee),
      });
    }
  }

  // Pastikan opsi hujan selalu muncul jika driver menyalakan toggle hujan
  const hasRainRow = breakdownRows.some((r) => r.label.toLowerCase().includes("hujan"));
  if ((order.is_rain || snapshot?.is_rain) && !hasRainRow) {
    breakdownRows.push({
      label: "Opsi Cuaca Hujan (Kondisi Lapangan)",
      amount: formatRupiah(order.rain_fee || snapshot?.rain_fee || 2000),
    });
  }

  const payBoxHeight = 22 + breakdownRows.length * 5.5;

  // Box Payment
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.roundedRect(margin, y, contentWidth, payBoxHeight, 2, 2, "FD");

  let payY = y + 6;
  doc.setFontSize(8);

  breakdownRows.forEach((row) => {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(row.label, margin + 5, payY);

    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(row.amount, pageWidth - margin - 5, payY, { align: "right" });
    payY += 5;
  });

  // Metode Pembayaran
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Metode Pembayaran", margin + 5, payY);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(
    order.payment_method === "cash" ? "Tunai kepada Driver" : "QRIS Driver (Non-Tunai)",
    pageWidth - margin - 5,
    payY,
    { align: "right" }
  );

  payY += 4.5;
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.line(margin + 5, payY, pageWidth - margin - 5, payY);

  payY += 5.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("TOTAL DIBAYAR", margin + 5, payY);

  doc.setFontSize(12.5);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text(formatRupiah(order.fare), pageWidth - margin - 5, payY, { align: "right" });

  y += payBoxHeight + 8;

  // ==================== 6. VERIFIKASI RESMI & CAP DIGITAL ====================
  // Verified Box
  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(successGreen[0], successGreen[1], successGreen[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(5, 150, 105);
  doc.text("✓ TRANSAKSI TERVERIFIKASI & SELESAI", margin + 6, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    "Dokumen ini diterbitkan oleh sistem Anjem UIN sebagai bukti transaksi resmi yang sah",
    margin + 6,
    y + 12
  );
  doc.text(
    "antara pelanggan dan mitra driver. Terima kasih telah mempercayakan perjalanan & pesanan Anda kepada kami.",
    margin + 6,
    y + 16.5
  );
  doc.text(
    "Layanan Pengaduan & Bantuan Pelanggan: WhatsApp CS Anjem UIN (+62 896-9172-2483)",
    margin + 6,
    y + 21
  );

  // Digital Stamp on right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(5, 150, 105);
  doc.text("[ VERIFIED ]", pageWidth - margin - 15, y + 8, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text("ANJEM UIN SYSTEM", pageWidth - margin - 15, y + 12.5, { align: "center" });

  // ==================== 7. FOOTER PAGE ====================
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(
    `Anjem UIN — Antar Jemput & Jastip Mahasiswa UIN Raden Mas Said Surakarta | Dicetak pada: ${new Date().toLocaleDateString("id-ID")}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );

  // Download trigger
  const fileName = `Invoice-${order.id}.pdf`;
  doc.save(fileName);
}
