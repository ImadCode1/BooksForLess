import type { Href } from 'expo-router';

import type { BookMetadata } from '@/types/book-metadata';

/**
 * Reserved for the Selling teammate's agreed Expo Router route.
 * The scanner currently runs BookPreparation locally; wiring this route into
 * navigation is an explicit future integration, not enabled by this constant.
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
