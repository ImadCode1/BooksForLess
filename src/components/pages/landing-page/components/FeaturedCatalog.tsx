import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View, useColorScheme, useWindowDimensions } from "react-native";
import { palette } from "@/components/book-flow/ui";
import { Book } from "../../types";
import { ACCENT, MUTED } from "../../theme";
import BookCard from "../../BookCard";

interface FeaturedCatalogProps {
  books: Book[]; // pass the already-filtered list
  previewCount?: number; // 4 = a 2x2 grid
}

export default function FeaturedCatalog({
  books,
  previewCount = 4,
}: FeaturedCatalogProps) {
  useColorScheme();
  const { fontScale } = useWindowDimensions();
  const visible = books.slice(0, previewCount);

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Featured catalog</Text>
        {books.length > previewCount && (
          <TouchableOpacity accessibilityRole="button" style={{ minHeight: 48, justifyContent: "center" }} onPress={() => router.push("/pages/catalog-page/catalog-page")}>
            <Text style={styles.viewAll}>
              View all ({books.length})
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
              style={[styles.card, fontScale > 1.3 && { width: "100%" }]}
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
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 10,
  },
  title: {
    fontSize: 19,
    lineHeight: 26,
    fontWeight: "600",
    color: palette.ink,
  },
  viewAll: {
    fontSize: 13,
    color: ACCENT,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  card: {
    width: "47%",
    flexGrow: 1,
    marginBottom: 4,
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
