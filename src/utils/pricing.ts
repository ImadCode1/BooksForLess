import type { BookCondition } from '@/types/local-ticket';

/**
 * Share of the new price a used copy sells for, by condition. Like New, Good
 * and Fair match the ratios used by the store's own listings (data/books.ts).
 */
export const CONDITION_MULTIPLIERS: Record<BookCondition, number> = {
  'Like New': 0.7,
  Good: 0.52,
  Fair: 0.35,
  Poor: 0.15,
};

/** Used when no new price is known and the page count is missing too. */
export const DEFAULT_NEW_PRICE_CENTS = 6000;

/** Rough new price of a textbook from its length: 8¢ a page, $25 to $150. */
export function estimateNewPriceFromPages(pages: number): number {
  const cents = Math.round(pages * 8);
  return Math.min(15000, Math.max(2500, cents));
}

/** Suggested selling price in cents: new price × condition, rounded to the dollar. */
export function calculateSellingPrice(newPriceCents: number, condition: BookCondition): number {
  const dollars = Math.round((newPriceCents * CONDITION_MULTIPLIERS[condition]) / 100);
  return Math.max(1, dollars) * 100;
}
