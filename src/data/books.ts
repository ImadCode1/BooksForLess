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
  subject: string;
  /** Retail price of a new copy, used to show savings. */
  originalPrice: number;
  publishedYear: number;
  pages: number;
  description: string;
  offers: BookOffer[];
  coverUrl?: string;
};

// Placeholder data until the app is connected to a backend.
// This is the single book list for the whole app (Home, book page, checkout).
export const BOOKS: Book[] = [
  {
    isbn: "9780132350884",
    title: "Clean Code",
    author: "Robert C. Martin",
    subject: "Computer Science",
    originalPrice: 45.99,
    publishedYear: 2008,
    pages: 464,
    description: "A handbook of agile software craftsmanship.",
    offers: [
      { condition: "Like new", price: 32, quantity: 2 },
      { condition: "Good", price: 24, quantity: 0 },
      { condition: "Acceptable", price: 15, quantity: 1 },
    ],
  },
  {
    isbn: "9780262033848",
    title: "Introduction to Algorithms",
    author: "Thomas H. Cormen",
    subject: "Computer Science",
    originalPrice: 89.99,
    publishedYear: 2009,
    pages: 1312,
    description: "Third edition. The standard reference on algorithms and data structures.",
    offers: [
      { condition: "Like new", price: 65, quantity: 1 },
      { condition: "Good", price: 45, quantity: 3 },
      { condition: "Acceptable", price: 30, quantity: 2 },
    ],
  },
  {
    isbn: "9780201633610",
    title: "Design Patterns",
    author: "Erich Gamma",
    subject: "Software Engineering",
    originalPrice: 54.99,
    publishedYear: 1994,
    pages: 395,
    description: "Elements of reusable object-oriented software.",
    offers: [
      { condition: "Good", price: 28, quantity: 0 },
      { condition: "Acceptable", price: 18, quantity: 0 },
    ],
  },
  {
    isbn: "9780136042594",
    title: "Artificial Intelligence: A Modern Approach",
    author: "Stuart Russell",
    subject: "Artificial Intelligence",
    originalPrice: 110,
    publishedYear: 2020,
    pages: 1152,
    description: "A comprehensive introduction to the theory and practice of AI.",
    offers: [
      { condition: "Like new", price: 80, quantity: 2 },
      { condition: "Good", price: 62, quantity: 1 },
    ],
  },
  {
    isbn: "9780134092669",
    title: "Computer Systems: A Programmer's Perspective",
    author: "Randal E. Bryant",
    subject: "Computer Engineering",
    originalPrice: 95.5,
    publishedYear: 2015,
    pages: 1120,
    description: "How computer systems execute programs, store information and communicate.",
    offers: [
      { condition: "Good", price: 48, quantity: 2 },
      { condition: "Acceptable", price: 35, quantity: 1 },
    ],
  },
  {
    isbn: "9780073523323",
    title: "Database System Concepts",
    author: "Abraham Silberschatz",
    subject: "Databases",
    originalPrice: 85,
    publishedYear: 2019,
    pages: 1376,
    description: "Fundamental concepts of database management and design.",
    offers: [{ condition: "Like new", price: 60, quantity: 1 }],
  },
  {
    isbn: "9781118063330",
    title: "Operating System Concepts",
    author: "Abraham Silberschatz",
    subject: "Operating Systems",
    originalPrice: 92,
    publishedYear: 2018,
    pages: 976,
    description: "Processes, memory, storage and protection in modern operating systems.",
    offers: [
      { condition: "Like new", price: 64, quantity: 0 },
      { condition: "Good", price: 46, quantity: 2 },
      { condition: "Acceptable", price: 30, quantity: 1 },
    ],
  },
  {
    isbn: "9781285740621",
    title: "Calculus",
    author: "James Stewart",
    subject: "Mathematics",
    originalPrice: 120,
    publishedYear: 2015,
    pages: 1368,
    description: "Limits, derivatives, integrals and series.",
    offers: [
      { condition: "Like new", price: 70, quantity: 1 },
      { condition: "Good", price: 55, quantity: 0 },
    ],
  },
  {
    isbn: "9780321973610",
    title: "University Physics",
    author: "Hugh D. Young",
    subject: "Physics",
    originalPrice: 105,
    publishedYear: 2015,
    pages: 1596,
    description: "Calculus-based introduction to mechanics, waves, thermodynamics and more.",
    offers: [{ condition: "Good", price: 50, quantity: 3 }],
  },
  {
    isbn: "9780133594140",
    title: "Computer Networking: A Top-Down Approach",
    author: "James Kurose",
    subject: "Networking",
    originalPrice: 98,
    publishedYear: 2016,
    pages: 864,
    description: "Networking explained from the application layer down.",
    offers: [
      { condition: "Like new", price: 66, quantity: 1 },
      { condition: "Acceptable", price: 32, quantity: 2 },
    ],
  },
  {
    isbn: "9780078022128",
    title: "Software Engineering: A Practitioner's Approach",
    author: "Roger S. Pressman",
    subject: "Software Engineering",
    originalPrice: 115,
    publishedYear: 2014,
    pages: 928,
    description: "Processes, methods and tools for building quality software.",
    offers: [{ condition: "Good", price: 52, quantity: 1 }],
  },
  {
    isbn: "9780203062916",
    title: "The Pragmatic Programmer",
    author: "David Thomas",
    subject: "Software Engineering",
    originalPrice: 49.99,
    publishedYear: 2019,
    pages: 352,
    description: "Practical advice for becoming a better programmer.",
    offers: [
      { condition: "Like new", price: 38, quantity: 2 },
      { condition: "Good", price: 29, quantity: 1 },
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
  return `$${amount.toFixed(2)} CAD`;
}
