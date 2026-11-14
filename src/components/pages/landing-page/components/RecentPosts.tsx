import React from "react";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from "react-native";
import { palette } from "@/components/book-flow/ui";
import { Book } from "../../types";
import { ACCENT, MUTED } from "../../theme";
import BookCard from "../../BookCard";

interface RecentPostsProps {
  books: Book[]; // pass the already-filtered list
  count?: number; // how many to show (default 6)
  onPressViewAll?: () => void;
}

export default function RecentPosts({
  books,
  count = 6,
  onPressViewAll = () => router.push("/pages/catalog-page/catalog-page"),
}: RecentPostsProps) {
  useColorScheme();
  // Most recent first (by publication year)
  const recent = [...books]
    .sort((a, b) => Number(b.date) - Number(a.date))
    .slice(0, count);

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.title}>On the bookshelf</Text>
        {onPressViewAll ? <TouchableOpacity onPress={onPressViewAll} accessibilityRole="button" style={{ minHeight: 48, justifyContent: "center" }}>
          <Text style={styles.viewAll}>View all</Text>
        </TouchableOpacity> : null}
      </View>

      {recent.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No recent books found.</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          style={styles.edgeToEdge}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rowContent}
        >
          {recent.map((book, index) => (
            <BookCard
              key={book.isbn}
              book={book}
              index={index}
              style={styles.card}
            />
          ))}
        </ScrollView>
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
    marginBottom: 10,
  },
  title: {
    fontSize: 19,
    lineHeight: 26,
    fontWeight: "600",
    color: palette.ink,
  },
  viewAll: {
    fontSize: 12,
    color: ACCENT,
    fontWeight: "600",
  },
  rowContent: {
    gap: 12,
    paddingBottom: 4,
    paddingHorizontal: 20,
  },
  edgeToEdge: {
    marginHorizontal: -20,
  },
  card: {
    width: 136,
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
