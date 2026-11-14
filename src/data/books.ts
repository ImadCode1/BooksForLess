export type BookCondition = "Like new" | "Good" | "Acceptable";

/** Display order for qualities, best first. */
export const CONDITIONS: BookCondition[] = [
  "Like new",
  "Good",
  "Acceptable",
];

/** Copies of a book in one quality. */
export type BookOffer = {
  condition: BookCondition;
  price: number;
  /** Number of copies in stock. 0 means this quality is unavailable. */
  quantity: number;
};

export type Book = {
  /** ISBN-13, digits only. This is the book's unique identifier. */
  isbn: string;
  title: string;
  author: string;
  /** Retail price of a new copy, used to show savings. */
  originalPrice: number;
  publishedYear: number;
  pages: number;
  description: string;
  offers: BookOffer[];
  coverUrl?: string;
};

// Placeholder data until the app is connected to a backend.
export const BOOKS: Book[] = [
  {
    isbn: "9780262046305",
    title: "Introduction to Algorithms",
    author: "Cormen, Leiserson, Rivest, Stein",
    originalPrice: 120,
    publishedYear: 2022,
    pages: 1312,
    description:
      "Fourth edition. The standard reference on algorithms and data structures.",
    offers: [
      { condition: "Like new", price: 70, quantity: 1 },
      { condition: "Good", price: 45, quantity: 3 },
      { condition: "Acceptable", price: 30, quantity: 2 },
    ],
  },
  {
    isbn: "9781285741550",
    title: "Calculus: Early Transcendentals",
    author: "James Stewart",
    originalPrice: 95,
    publishedYear: 2015,
    pages: 1368,
    description: "8th edition.",
    offers: [
      { condition: "Like new", price: 30, quantity: 1 },
      { condition: "Good", price: 22, quantity: 0 },
    ],
  },
  {
    isbn: "9780132350884",
    title: "Clean Code",
    author: "Robert C. Martin",
    originalPrice: 40,
    publishedYear: 2008,
    pages: 464,
    description: "A handbook of agile software craftsmanship.",
    offers: [
      { condition: "Good", price: 18, quantity: 0 },
      { condition: "Acceptable", price: 12, quantity: 0 },
    ],
  },
];

/** Strips hyphens and spaces so "978-0-13-235088-4" matches "9780132350884". */
export function normalizeIsbn(isbn: string): string {
  return isbn.replace(/[-\s]/g, "");
}

export function getBookByIsbn(isbn: string | undefined): Book | undefined {
  if (!isbn) return undefined;
  const wanted = normalizeIsbn(isbn);
  return BOOKS.find((book) => book.isbn === wanted);
}

/** Offers sorted from best to worst quality. */
export function sortedOffers(book: Book): BookOffer[] {
  return [...book.offers].sort(
    (a, b) => CONDITIONS.indexOf(a.condition) - CONDITIONS.indexOf(b.condition),
  );
}

/** Total copies across all qualities. */
export function totalQuantity(book: Book): number {
  return book.offers.reduce((sum, offer) => sum + offer.quantity, 0);
}

export function isAvailable(book: Book): boolean {
  return totalQuantity(book) > 0;
}

export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
