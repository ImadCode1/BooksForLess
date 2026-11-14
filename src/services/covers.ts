import { useEffect, useRef, useState } from "react";

import { type Book, getCoverUrl } from "@/data/books";

/**
 * Optional. Without a key, Google Books shares one small daily quota between
 * every anonymous caller and often answers 429, so the fallback silently does
 * nothing. Add EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY to .env.local to make it reliable.
 */
const GOOGLE_BOOKS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY;

// One lookup per ISBN per session, shared by every card and page.
const googleCovers = new Map<string, Promise<string | null>>();

async function fetchGoogleCover(isbn: string): Promise<string | null> {
  const params = new URLSearchParams({
    q: `isbn:${isbn}`,
    maxResults: "1",
    fields: "items(volumeInfo/imageLinks)",
  });
  if (GOOGLE_BOOKS_API_KEY) params.set("key", GOOGLE_BOOKS_API_KEY);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?${params}`,
      { signal: controller.signal },
    );
    // Quota (429) and server errors: let a later screen try again.
    if (!response.ok) throw new Error(`Google Books returned ${response.status}`);
    const data: unknown = await response.json();
    const links = (data as {
      items?: { volumeInfo?: { imageLinks?: Record<string, unknown> } }[];
    }).items?.[0]?.volumeInfo?.imageLinks;
    const url = links?.thumbnail ?? links?.smallThumbnail;
    if (typeof url !== "string") return null; // Google has no cover either.
    // Google returns http:// links (blocked on iOS) and a page-curl effect.
    return url.replace(/^http:/, "https:").replace("&edge=curl", "");
  } finally {
    clearTimeout(timeout);
  }
}

/** Resolves to a cover URL, or null when Google Books has none. */
export function getGoogleCover(isbn: string): Promise<string | null> {
  let lookup = googleCovers.get(isbn);
  if (!lookup) {
    lookup = fetchGoogleCover(isbn).catch(() => {
      googleCovers.delete(isbn); // Network or quota error: don't remember it.
      return null;
    });
    googleCovers.set(isbn, lookup);
  }
  return lookup;
}

type Stage = "primary" | "fallback-loading" | "fallback" | "none";

/**
 * Cover image with a fallback chain: the book's own URL or Open Library first,
 * then Google Books, then nothing (callers show CoverPlaceholder).
 */
export function useBookCover(
  book: Pick<Book, "isbn" | "coverUrl">,
  size: "M" | "L" = "M",
) {
  const [stage, setStage] = useState<Stage>("primary");
  const [fallbackUri, setFallbackUri] = useState<string>();
  const [loaded, setLoaded] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  function onError() {
    setLoaded(false);
    if (stage !== "primary") {
      setStage("none");
      return;
    }
    setStage("fallback-loading");
    void getGoogleCover(book.isbn).then((url) => {
      if (!mounted.current) return;
      if (url) {
        setFallbackUri(url);
        setStage("fallback");
      } else {
        setStage("none");
      }
    });
  }

  const uri =
    stage === "primary"
      ? getCoverUrl(book, size)
      : stage === "fallback"
        ? fallbackUri
        : undefined;

  return {
    /** Image URL to render, or undefined while looking up / when none exists. */
    uri,
    loaded,
    /** True while a cover may still appear. */
    loading: stage !== "none" && !loaded,
    onLoad: () => setLoaded(true),
    onError,
  };
}
