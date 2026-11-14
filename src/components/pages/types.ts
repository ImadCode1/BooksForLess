export interface Book {
  title: string;
  author: string;
  price: number | null;
  isbn: string;
  pages: number;
  subject: string;
  date: string; // publication year
  country: string;
  language: string;
}

export interface Subject {
  label: string;
  icon: string;
}

export interface Filters {
  dateRange: string; // key from DATE_RANGES ("any" = no filter)
  countries: string[];
  languages: string[];
  subjects: string[];
  minPrice: string; // kept as text so the inputs stay editable
  maxPrice: string;
}
