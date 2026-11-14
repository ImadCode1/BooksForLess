import { useSyncExternalStore } from "react";

import { BOOKS, type BookCondition, type BookOffer, sortedOffers } from "@/data/books";

/**
 * Stock per ISBN, shared by every screen so a purchase on the payment page
 * shows up on the book page. In-memory only: it resets when the app restarts.
 * TODO: replace with the backend's inventory once there is one.
 */
const stock = new Map<string, BookOffer[]>(
  BOOKS.map((book) => [book.isbn, sortedOffers(book)]),
);
const listeners = new Set<() => void>();
const NO_OFFERS: BookOffer[] = [];

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getOffers(isbn: string | undefined): BookOffer[] {
  return (isbn && stock.get(isbn)) || NO_OFFERS;
}

/** Removes one copy. Returns false if that quality is out of stock. */
export function purchaseCopy(isbn: string, condition: BookCondition): boolean {
  const offers = stock.get(isbn);
  const offer = offers?.find((item) => item.condition === condition);
  if (!offers || !offer || offer.quantity === 0) return false;

  stock.set(
    isbn,
    offers.map((item) =>
      item.condition === condition ? { ...item, quantity: item.quantity - 1 } : item,
    ),
  );
  listeners.forEach((listener) => listener());
  return true;
}

export function useOffers(isbn: string | undefined): BookOffer[] {
  const snapshot = () => getOffers(isbn);
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}
