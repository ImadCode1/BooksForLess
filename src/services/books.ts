import { DEMO_BOOKS } from '@/data/demo-books';
import type { BookMetadata } from '@/types/book-metadata';
import { isValidIsbn13, normalizeIsbn } from '@/utils/isbn';

export type BookLookupResult =
  | { status: 'found'; book: BookMetadata }
  | { status: 'not-found' | 'network-error'; isbn: string };

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function getDemoBook(value: string): BookMetadata | undefined {
  const book = DEMO_BOOKS.find((item) => item.isbn === normalizeIsbn(value));
  return book ? { ...book, authors: [...book.authors] } : undefined;
}

/** Demo ISBNs resolve locally first so the presentation never depends on a network. */
export async function lookupBook(
  value: string,
  options: { signal?: AbortSignal; timeoutMs?: number } = {}
): Promise<BookLookupResult> {
  const isbn = normalizeIsbn(value);
  if (!isValidIsbn13(isbn)) throw new Error('Enter a valid ISBN-13, including its check digit.');
  if (options.signal?.aborted) throw new Error('Lookup cancelled');
  const demo = getDemoBook(isbn);
  if (demo) return { status: 'found', book: demo };

  const controller = new AbortController();
  const abort = () => controller.abort();
  options.signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, options.timeoutMs ?? 8000);
  try {
    const key = `ISBN:${isbn}`;
    const response = await fetch(
      `https://openlibrary.org/api/books?bibkeys=${encodeURIComponent(key)}&format=json&jscmd=data`,
      { signal: controller.signal }
    );
    if (!response.ok) throw new Error(`Open Library returned ${response.status}`);
    const payload: unknown = await response.json();
    const root = record(payload);
    if (!root) throw new Error('Invalid Open Library response');
    if (!(key in root)) return { status: 'not-found', isbn };
    const data = record(root[key]);
    const title = text(data?.title);
    if (!title) return { status: 'not-found', isbn };
    const authors = Array.isArray(data?.authors)
      ? data.authors.flatMap((author) => {
          const name = text(record(author)?.name);
          return name ? [name] : [];
        })
      : [];
    const cover = record(data?.cover);
    const coverUrl = text(cover?.large) ?? text(cover?.medium) ?? text(cover?.small);
    return {
      status: 'found',
      book: {
        isbn,
        title,
        authors,
        coverUrl: coverUrl && /^https?:\/\//.test(coverUrl)
          ? coverUrl.replace(/^http:/, 'https:')
          : undefined,
        source: 'open-library',
      },
    };
  } catch (error) {
    // Caller cancellation is not a lookup failure and must not update a stale screen.
    if (options.signal?.aborted) throw error;
    return { status: 'network-error', isbn };
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', abort);
  }
}
