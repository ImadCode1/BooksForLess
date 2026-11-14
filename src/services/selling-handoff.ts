import type { Href } from 'expo-router';

import type { BookMetadata } from '@/types/book-metadata';

/**
 * Selling is not implemented in this checkout. Set to its agreed Expo Router
 * route (e.g. '/selling') once available. Do not navigate to a nonexistent page.
 */
export const SELLING_ROUTE: Href | null = null;

let pendingBook: BookMetadata | null = null;

export function prepareSellingBook(book: BookMetadata): void {
  pendingBook = { ...book, authors: [...book.authors] };
}

/** In-memory only; deliberately retained so back navigation does not consume it. */
export function getPendingSellingBook(): BookMetadata | null {
  return pendingBook ? { ...pendingBook, authors: [...pendingBook.authors] } : null;
}
