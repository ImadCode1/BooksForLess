import type { LocalTicket } from '@/types/local-ticket';
import { isValidIsbn13 } from '@/utils/isbn';

type BookRow = {
  id: string;
  isbn: string;
  title: string;
  authors: string[];
  condition: LocalTicket['condition'];
  price_cents: number;
  metadata_source: LocalTicket['book']['source'];
  status: LocalTicket['status'];
  created_at: string;
};

function configuration() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Supabase is not configured. Check .env.local and restart Expo.');
  return { url, key };
}

async function request(path: string, init?: RequestInit, resource = 'demo_books'): Promise<unknown> {
  const { url, key } = configuration();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${url}/rest/v1/${resource}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { apikey: key, 'Content-Type': 'application/json', ...init?.headers },
    });
    if (!response.ok) throw new Error(`Database request failed (${response.status}). Please retry.`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function fromRow(row: BookRow): LocalTicket {
  return {
    id: row.id,
    book: { isbn: row.isbn, title: row.title, authors: row.authors, source: row.metadata_source },
    condition: row.condition,
    priceCents: row.price_cents,
    photoUri: '', // Device photos are never uploaded to this unauthenticated collection.
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function fetchSharedTickets(): Promise<LocalTicket[]> {
  const data = await request('?select=*&order=created_at.desc,id.desc&limit=100');
  if (!Array.isArray(data)) throw new Error('The database returned an unexpected response.');
  return (data as BookRow[]).map(fromRow);
}

/** Cancel one shared demo listing; direct table DELETE remains forbidden. */
export async function deleteSharedTicket(id: string): Promise<void> {
  if (!/^BFL-[A-Z0-9-]{3,70}$/.test(id)) throw new Error('A valid ticket ID is required.');
  const deleted = await request('', {
    method: 'POST',
    body: JSON.stringify({ ticket_id: id }),
  }, 'rpc/cancel_demo_book');
  // Zero is also success: another device or a previous timed-out attempt removed it.
  if (deleted !== 0 && deleted !== 1) throw new Error('The cancellation could not be verified. Please retry.');
}

/** Insert-only and idempotent: a retry uses the same ticket ID, never overwrites a row. */
export async function saveSharedTicket(ticket: LocalTicket): Promise<LocalTicket> {
  if (!isValidIsbn13(ticket.book.isbn)) throw new Error('A valid ISBN-13 is required.');
  const data = await request('?on_conflict=id', {
    method: 'POST',
    headers: { Prefer: 'resolution=ignore-duplicates,return=representation' },
    body: JSON.stringify({
      id: ticket.id, isbn: ticket.book.isbn, title: ticket.book.title,
      authors: ticket.book.authors, condition: ticket.condition,
      price_cents: ticket.priceCents, metadata_source: ticket.book.source,
    }),
  });
  // A timed-out first attempt may have committed. Verify its row on retry.
  const rows = Array.isArray(data) && data.length ? data
    : await request(`?id=eq.${encodeURIComponent(ticket.id)}&select=*`);
  const row: BookRow | undefined = Array.isArray(rows) ? rows[0] : undefined;
  if (!row || row.isbn !== ticket.book.isbn || row.title !== ticket.book.title ||
      row.condition !== ticket.condition || row.price_cents !== ticket.priceCents ||
      JSON.stringify(row.authors) !== JSON.stringify(ticket.book.authors)) {
    throw new Error('The saved ticket could not be verified. Your draft is still here.');
  }
  return { ...ticket, createdAt: row.created_at };
}
