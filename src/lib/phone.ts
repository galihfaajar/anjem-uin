/**
 * Utility functions for Indonesian WhatsApp/phone number normalization and validation.
 */

export const PHONE_REGEX = /^62[0-9]{9,13}$/;

/**
 * Normalisasi nomor HP ke format standard 62xxxxxxxxxx
 * - Membersihkan spasi, strip, dan karakter non-digit kecuali '+'
 * - Mengubah awalan +62 menjadi 62
 * - Mengubah awalan 0 menjadi 62 (contoh: 08123456789 -> 628123456789)
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return "";
  let clean = phone.replace(/[^0-9+]/g, "").trim();
  if (clean.startsWith("+")) {
    clean = clean.slice(1);
  }
  if (clean.startsWith("0")) {
    clean = "62" + clean.slice(1);
  }
  return clean;
}

/**
 * Validasi apakah nomor sudah sesuai format standar WhatsApp Indonesia: ^62[0-9]{9,13}$
 */
export function isValidPhoneNumber(phone: string): boolean {
  return PHONE_REGEX.test(phone);
}

/**
 * Validasi dan berikan pesan error spesifik dalam bahasa Indonesia
 */
export function validatePhoneNumber(phone: string): { valid: boolean; normalized: string; error?: string } {
  if (!phone || !phone.trim()) {
    return { valid: false, normalized: "", error: "Nomor WhatsApp belum diisi" };
  }

  const normalized = normalizePhoneNumber(phone);

  if (!isValidPhoneNumber(normalized)) {
    if (!normalized.startsWith("62")) {
      return {
        valid: false,
        normalized,
        error: "Nomor WhatsApp harus diawali dengan 62 atau 08 (contoh: 081234567890)",
      };
    }
    if (normalized.length < 11) {
      return {
        valid: false,
        normalized,
        error: "Nomor WhatsApp terlalu pendek (minimal 9 digit setelah 62)",
      };
    }
    if (normalized.length > 15) {
      return {
        valid: false,
        normalized,
        error: "Nomor WhatsApp terlalu panjang (maksimal 13 digit setelah 62)",
      };
    }
    return {
      valid: false,
      normalized,
      error: "Format nomor WhatsApp tidak valid. Gunakan format 62xxxxxxxxxx",
    };
  }

  return { valid: true, normalized };
}
