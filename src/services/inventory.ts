import { useSyncExternalStore } from "react";

import { BOOKS, type BookCondition, type BookOffer, sortedOffers } from "@/data/books";

type Stock = ReadonlyMap<string, BookOffer[]>;

/**
 * Stock per ISBN, shared by every screen so a purchase on the payment page
 * shows up on Home and on the book page. In-memory only: it resets when the
 * app restarts.
 * TODO: replace with the backend's inventory once there is one.
 */
let stock: Stock = new Map(BOOKS.map((book) => [book.isbn, sortedOffers(book)]));
const listeners = new Set<() => void>();
const NO_OFFERS: BookOffer[] = [];

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getStock(): Stock {
  return stock;
}

export function getOffers(isbn: string | undefined): BookOffer[] {
  return (isbn && stock.get(isbn)) || NO_OFFERS;
}

/** Removes one copy. Returns false if that quality is out of stock. */
export function purchaseCopy(isbn: string, condition: BookCondition): boolean {
  const offers = stock.get(isbn);
  const offer = offers?.find((item) => item.condition === condition);
  if (!offers || !offer || offer.quantity === 0) return false;

  const next = new Map(stock);
  next.set(
    isbn,
    offers.map((item) =>
      item.condition === condition ? { ...item, quantity: item.quantity - 1 } : item,
    ),
  );
  stock = next;
  listeners.forEach((listener) => listener());
  return true;
}

/** Cheapest price among qualities that are in stock, or null if sold out. */
export function lowestAvailablePrice(offers: BookOffer[]): number | null {
  const prices = offers.filter((o) => o.quantity > 0).map((o) => o.price);
  return prices.length > 0 ? Math.min(...prices) : null;
}

export function useOffers(isbn: string | undefined): BookOffer[] {
  const snapshot = () => getOffers(isbn);
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

/** Stock for every book; re-renders whenever anything is bought. */
export function useStock(): Stock {
  return useSyncExternalStore(subscribe, getStock, getStock);
}
