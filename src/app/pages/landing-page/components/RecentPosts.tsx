import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BookCard from "../../BookCard";
import { ACCENT, MUTED, TEXT } from "../../theme";
import { Book } from "../../types";

interface RecentPostsProps {
  books: Book[]; // pass the already-filtered list
  count?: number; // how many to show (default 6)
  onPressViewAll?: () => void;
}

export default function RecentPosts({
  books,
  count = 6,
  onPressViewAll,
}: RecentPostsProps) {
  // Most recent first (by publication year)
  const recent = [...books]
    .sort((a, b) => Number(b.date) - Number(a.date))
    .slice(0, count);

  var router = useRouter();

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Recently posted</Text>
        <TouchableOpacity onPress={onPressViewAll}>
          <Text
            style={styles.viewAll}
            onPress={(e) => router.replace("/pages/catalog-page/catalog-page")}
          >
            View all
          </Text>
        </TouchableOpacity>
      </View>

      {recent.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No recent books found.</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
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
  rowContent: {
    paddingHorizontal: 16,
    gap: 14,
  },
  card: {
    width: 160,
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
