export interface Book {
  title: string;
  author: string;
  /** Cheapest price in stock, or null when sold out. */
  price: number | null;
  isbn: string;
  pages: number;
  subject: string;
  date: string;
}

export interface Subject {
  label: string;
  icon: string;
}
