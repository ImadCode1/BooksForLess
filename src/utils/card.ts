export type CardBrand = "Visa" | "Mastercard" | "Amex" | "Card";

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function detectBrand(number: string): CardBrand {
  const digits = digitsOnly(number);
  if (/^4/.test(digits)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  return "Card";
}

/** "4242424242424242" -> "4242 4242 4242 4242" (Amex: 4-6-5). */
export function formatCardNumber(value: string): string {
  const digits = digitsOnly(value);
  if (detectBrand(digits) === "Amex") {
    const d = digits.slice(0, 15);
    return [d.slice(0, 4), d.slice(4, 10), d.slice(10)].filter(Boolean).join(" ");
  }
  return digits.slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
}

/** "1228" -> "12/28" */
export function formatExpiry(value: string): string {
  const digits = digitsOnly(value).slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

/** Luhn checksum, used by all major card networks. */
export function isValidCardNumber(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let n = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

export function parseExpiry(value: string): { month: number; year: number } | null {
  const digits = digitsOnly(value);
  if (digits.length !== 4) return null;
  const month = Number(digits.slice(0, 2));
  const year = 2000 + Number(digits.slice(2));
  if (month < 1 || month > 12) return null;
  return { month, year };
}

/** Valid until the end of the expiry month. */
export function isValidExpiry(value: string, now = new Date()): boolean {
  const parsed = parseExpiry(value);
  if (!parsed) return false;
  const endOfMonth = new Date(parsed.year, parsed.month, 1);
  return endOfMonth > now;
}

export function isValidCvc(value: string, brand: CardBrand): boolean {
  const digits = digitsOnly(value);
  return brand === "Amex" ? digits.length === 4 : digits.length === 3;
}
