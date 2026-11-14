import { useMemo } from "react";

import { BOOKS as ALL_BOOKS } from "@/data/books";
import { lowestAvailablePrice, useStock } from "@/services/inventory";

import { Book, Subject } from "./types";

/**
 * Home's book cards, built from the app's single book list (src/data/books.ts)
 * and live stock, so prices and "Sold out" stay in sync with the book page.
 */
export function useListingBooks(): Book[] {
  const stock = useStock();
  return useMemo(
    () =>
      ALL_BOOKS.map((book) => ({
        title: book.title,
        author: book.author,
        price: lowestAvailablePrice(stock.get(book.isbn) ?? []),
        isbn: book.isbn,
        pages: book.pages,
        subject: book.subject,
        date: String(book.publishedYear),
      })),
    [stock],
  );
}

// 6 popular subjects, shown as a 2-row x 3-column grid
export const POPULAR_SUBJECTS: Subject[] = [
  { label: "Mathematics", icon: "📐" },
  { label: "Algebra", icon: "🔢" },
  { label: "Geometry", icon: "📐" },
  { label: "Calculus", icon: "📈" },
  { label: "Statistics", icon: "📊" },
  { label: "Biology", icon: "🧬" },
  { label: "Chemistry", icon: "⚗️" },
  { label: "Physics", icon: "⚛️" },
  { label: "Earth Science", icon: "🌍" },
  { label: "Environmental Science", icon: "🌱" },
  { label: "English Language Arts", icon: "📖" },
  { label: "Literature", icon: "📚" },
  { label: "Creative Writing", icon: "✍️" },
  { label: "Grammar and Composition", icon: "📝" },
  { label: "World History", icon: "🏛️" },
  { label: "American History", icon: "📜" },
  { label: "Geography", icon: "🗺️" },
  { label: "Economics", icon: "📈" },
  { label: "Government and Politics", icon: "🏛️" },
  { label: "Psychology", icon: "🧠" },
  { label: "Sociology", icon: "👥" },
  { label: "Spanish", icon: "🇪🇸" },
  { label: "French", icon: "🇫🇷" },
  { label: "German", icon: "🇩🇪" },
  { label: "Mandarin Chinese", icon: "🇨🇳" },
  { label: "Latin", icon: "🏛️" },
  { label: "Computer Science", icon: "💻" },
  { label: "Information Technology", icon: "🖥️" },
  { label: "Web Development", icon: "🌐" },
  { label: "Visual Arts", icon: "🎨" },
  { label: "Graphic Design", icon: "🖌️" },
  { label: "Music Theory", icon: "🎵" },
  { label: "Band and Orchestra", icon: "🎻" },
  { label: "Theater and Drama", icon: "🎭" },
  { label: "Physical Education", icon: "⚽" },
  { label: "Health Education", icon: "❤️" },
  { label: "Business Studies", icon: "💼" },
  { label: "Accounting", icon: "📊" },
  { label: "Robotics", icon: "🤖" },
  { label: "Engineering and Design", icon: "🛠️" },
];
