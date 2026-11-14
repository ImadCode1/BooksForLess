import { useSyncExternalStore } from "react";

import { type CardBrand, detectBrand, digitsOnly, parseExpiry } from "@/utils/card";

/**
 * A saved card. Only display details are kept — never the full number or CVC.
 * A real implementation must send card details to a payment provider
 * (e.g. Stripe) and store only the token it returns.
 */
export type SavedCard = {
  id: string;
  brand: CardBrand;
  last4: string;
  expMonth: number;
  expYear: number;
  holderName: string;
};

export type NewCardInput = {
  number: string;
  expiry: string;
  holderName: string;
};

// In-memory only: saved cards are lost when the app restarts.
let cards: SavedCard[] = [];
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getCards(): SavedCard[] {
  return cards;
}

export function toSavedCard(input: NewCardInput): SavedCard {
  const expiry = parseExpiry(input.expiry);
  if (!expiry) throw new Error("Invalid expiry date");
  return {
    id: `card_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    brand: detectBrand(input.number),
    last4: digitsOnly(input.number).slice(-4),
    expMonth: expiry.month,
    expYear: expiry.year,
    holderName: input.holderName.trim(),
  };
}

export function saveCard(card: SavedCard): void {
  cards = [...cards, card];
  listeners.forEach((listener) => listener());
}

export function useSavedCards(): SavedCard[] {
  return useSyncExternalStore(subscribe, getCards, getCards);
}

export function describeCard(card: SavedCard): string {
  return `${card.brand} •••• ${card.last4}`;
}

export function formatCardExpiry(card: SavedCard): string {
  return `${String(card.expMonth).padStart(2, "0")}/${String(card.expYear).slice(-2)}`;
}
