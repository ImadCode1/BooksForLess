import { getBookByIsbn } from '@/data/books';
import { normalizeIsbn } from '@/utils/isbn';
import { DEFAULT_NEW_PRICE_CENTS, estimateNewPriceFromPages } from '@/utils/pricing';

const GOOGLE_BOOKS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY;

export type NewPrice = {
  cents: number;
  source: 'google-books' | 'catalog' | 'page-estimate' | 'default';
};

type GoogleInfo = { priceCents?: number; pages?: number };

/** Canadian price and page count from Google Books. Never throws. */
async function fetchGoogleInfo(isbn: string, signal?: AbortSignal): Promise<GoogleInfo> {
  const params = new URLSearchParams({
    q: `isbn:${isbn}`,
    country: 'CA',
    maxResults: '1',
    fields: 'items(volumeInfo/pageCount,saleInfo(listPrice,retailPrice))',
  });
  if (GOOGLE_BOOKS_API_KEY) params.set('key', GOOGLE_BOOKS_API_KEY);

  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, 6000);
  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?${params}`, {
      signal: controller.signal,
    });
    if (!response.ok) return {};
    const data = (await response.json()) as {
      items?: {
        volumeInfo?: { pageCount?: unknown };
        saleInfo?: Record<string, { amount?: unknown; currencyCode?: unknown } | undefined>;
      }[];
    };
    const item = data.items?.[0];
    // Physical textbooks are usually "not for sale" on Google; ebooks may have a price.
    const sale = item?.saleInfo?.listPrice ?? item?.saleInfo?.retailPrice;
    const priceCents = sale && sale.currencyCode === 'CAD' && typeof sale.amount === 'number' && sale.amount > 0
      ? Math.round(sale.amount * 100)
      : undefined;
    const pages = typeof item?.volumeInfo?.pageCount === 'number' && item.volumeInfo.pageCount > 0
      ? item.volumeInfo.pageCount
      : undefined;
    return { priceCents, pages };
  } catch {
    return {}; // Offline, timeout or quota: fall back to local data.
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}

/**
 * New price of a book, used as the base for the condition-based selling price.
 * Order: Google Books price (CAD) → the store's own catalog → page-count
 * estimate → a fixed default. Always resolves, so selling never gets stuck.
 */
export async function getNewPrice(value: string, signal?: AbortSignal): Promise<NewPrice> {
  const isbn = normalizeIsbn(value);
  const google = await fetchGoogleInfo(isbn, signal);
  if (google.priceCents) return { cents: google.priceCents, source: 'google-books' };

  const catalog = getBookByIsbn(isbn);
  if (catalog) return { cents: Math.round(catalog.originalPrice * 100), source: 'catalog' };

  if (google.pages) return { cents: estimateNewPriceFromPages(google.pages), source: 'page-estimate' };
  return { cents: DEFAULT_NEW_PRICE_CENTS, source: 'default' };
}
