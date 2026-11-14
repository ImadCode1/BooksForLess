export function normalizeIsbn(value: string): string {
  return value.replace(/[\s-]/g, '');
}

/** ISBN-13 uses a 978/979 prefix and alternating 1/3 checksum weights. */
export function isValidIsbn13(value: string): boolean {
  const isbn = normalizeIsbn(value);
  if (!/^97[89]\d{10}$/.test(isbn)) return false;
  const sum = [...isbn].reduce(
    (total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 1 : 3),
    0
  );
  return sum % 10 === 0;
}
