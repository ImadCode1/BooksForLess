import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Book } from "../types";
import { ACCENT, MUTED, TEXT } from "../theme";
import BookCard from "./BookCard";

interface FeaturedCatalogProps {
  books: Book[]; // pass the already-filtered list
  previewCount?: number; // 4 = a 2x2 grid
}

export default function FeaturedCatalog({
  books,
  previewCount = 4,
}: FeaturedCatalogProps) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? books : books.slice(0, previewCount);

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Featured catalog</Text>
        {books.length > previewCount && (
          <TouchableOpacity onPress={() => setShowAll((v) => !v)}>
            <Text style={styles.viewAll}>
              {showAll ? "Show less" : `View all (${books.length})`}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {visible.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            No books found matching your criteria.
          </Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {visible.map((book, index) => (
            <BookCard
              key={book.isbn}
              book={book}
              index={index}
              style={styles.card}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 22,
    marginBottom: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: TEXT,
  },
  viewAll: {
    fontSize: 12,
    color: ACCENT,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  card: {
    width: "48%",
    marginBottom: 16,
  },
  empty: {
    paddingVertical: 30,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: MUTED,
  },
});
