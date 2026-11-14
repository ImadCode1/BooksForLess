import type { LocalTicket, TicketDraft } from '@/types/local-ticket';

export const CONDITIONS = [
  { value: 'Like New', description: 'Clean pages, almost no signs of use.' },
  { value: 'Good', description: 'Light wear or a few notes. All pages intact.' },
  { value: 'Fair', description: 'Visible wear, highlighting, or folded corners.' },
  { value: 'Poor', description: 'Heavy wear or damage. Intake would need review.' },
] as const;

/** Parse CAD exactly in cents; do not silently round extra decimal places. */
export function parseCadPrice(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d{1,4}(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, decimal = ''] = normalized.split('.');
  const cents = Number(whole) * 100 + Number(decimal.padEnd(2, '0'));
  return cents > 0 && cents <= 999999 ? cents : null;
}

export function formatCad(cents: number): string {
  return `$${(cents / 100).toFixed(2)} CAD`;
}

let sequence = 0;
export function createLocalTicket(draft: TicketDraft): LocalTicket {
  if (!draft.photoUri || !draft.book.title.trim() ||
      !CONDITIONS.some(({ value }) => value === draft.condition) ||
      !Number.isInteger(draft.priceCents) || draft.priceCents <= 0 || draft.priceCents > 999999) {
    throw new Error('A book, condition, valid CAD price, and photo are required.');
  }
  sequence += 1;
  return {
    ...draft,
    book: { ...draft.book, authors: [...draft.book.authors] },
    id: `BFL-${Date.now().toString(36).toUpperCase()}-${sequence.toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    status: 'Awaiting drop-off',
  };
}

/** Stable, local identifier only—not a server URL or proof of co-op acceptance. */
export function ticketQrValue(ticket: LocalTicket): string {
  return `booksforless:ticket:${ticket.id}`;
}
