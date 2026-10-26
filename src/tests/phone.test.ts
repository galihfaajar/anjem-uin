import { describe, it, expect } from "vitest";
import { normalizePhoneNumber, isValidPhoneNumber, validatePhoneNumber } from "@/lib/phone";

describe("Phone Utility - normalizePhoneNumber", () => {
  it("normalizes numbers starting with 08 to 628", () => {
    expect(normalizePhoneNumber("081234567890")).toBe("6281234567890");
  });

  it("normalizes numbers starting with +62 to 62", () => {
    expect(normalizePhoneNumber("+6281234567890")).toBe("6281234567890");
  });

  it("strips whitespace and hyphens", () => {
    expect(normalizePhoneNumber(" 0812 - 3456 - 7890 ")).toBe("6281234567890");
  });

  it("keeps numbers already in 62 format unchanged", () => {
    expect(normalizePhoneNumber("6289876543210")).toBe("6289876543210");
  });
});

describe("Phone Utility - isValidPhoneNumber & validatePhoneNumber", () => {
  it("validates valid Indonesian mobile numbers", () => {
    expect(isValidPhoneNumber("6281234567890")).toBe(true);
    expect(isValidPhoneNumber("628999999999")).toBe(true); // 62 + 10 digits
    expect(isValidPhoneNumber("628123456789012")).toBe(true); // 62 + 13 digits
  });

  it("rejects numbers that are too short or too long", () => {
    expect(isValidPhoneNumber("6281234567")).toBe(false); // only 8 digits after 62
    expect(isValidPhoneNumber("62812345678901234")).toBe(false); // 15 digits after 62
  });

  it("validatePhoneNumber returns helpful error messages", () => {
    expect(validatePhoneNumber("").valid).toBe(false);
    expect(validatePhoneNumber("").error).toBe("Nomor WhatsApp belum diisi");

    const shortResult = validatePhoneNumber("08123456");
    expect(shortResult.valid).toBe(false);
    expect(shortResult.error).toContain("terlalu pendek");

    const validResult = validatePhoneNumber("081234567890");
    expect(validResult.valid).toBe(true);
    expect(validResult.normalized).toBe("6281234567890");
  });
});
