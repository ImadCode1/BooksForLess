import { Book, Filters } from "../types";
import { DATE_RANGES } from "./constants";

export function applyFilters(books: Book[], query: string, f: Filters): Book[] {
  const q = query.trim().toLowerCase();
  const range = DATE_RANGES.find((r) => r.key === f.dateRange);
  const min = parseFloat(f.minPrice);
  const max = parseFloat(f.maxPrice);

  return books.filter((book) => {
    if (
      q &&
      !book.title.toLowerCase().includes(q) &&
      !book.author.toLowerCase().includes(q)
    ) {
      return false;
    }

    const year = Number(book.date);
    if (range?.min !== undefined && year < range.min) return false;
    if (range?.max !== undefined && year > range.max) return false;

    if (f.countries.length && !f.countries.includes(book.country)) return false;
    if (f.languages.length && !f.languages.includes(book.language)) return false;
    if (f.subjects.length && !f.subjects.includes(book.subject)) return false;

    if (!isNaN(min) && (book.price === null || book.price < min)) return false;
    if (!isNaN(max) && (book.price === null || book.price > max)) return false;

    return true;
  });
}

/** Number of filter categories that are active (shown as the badge on the filter button). */
export function countActiveFilters(f: Filters): number {
  let count = 0;
  if (f.dateRange !== "any") count++;
  if (f.countries.length) count++;
  if (f.languages.length) count++;
  if (f.subjects.length) count++;
  if (f.minPrice !== "" || f.maxPrice !== "") count++;
  return count;
}
