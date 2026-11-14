import { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BookCard from "../BookCard";
import { BOOKS } from "../data";
import { MUTED, TEXT } from "../theme";
import TopBar from "../TopBar";
import { applyFilters, countActiveFilters } from "./components/applyFilters";
import { DEFAULT_FILTERS } from "./components/constants";
import FilterPanel from "./components/FilterPanel";
import SearchBar from "./components/SearchBar";
import { Filters } from "./types";

export default function CatalogPage() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const books = useMemo(
    () => applyFilters(BOOKS, query, filters),
    [query, filters],
  );
  const activeCount = countActiveFilters(filters);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <TopBar notificationCount={1} />

      <SearchBar
        value={query}
        onChangeText={setQuery}
        onPressFilter={() => setFiltersOpen((open) => !open)}
        filterOpen={filtersOpen}
        activeFilterCount={activeCount}
      />

      {/* Slides down from under the search bar */}
      <View style={styles.panelWrap}>
        <FilterPanel
          open={filtersOpen}
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
          onClose={() => setFiltersOpen(false)}
          resultCount={books.length}
        />
      </View>

      <FlatList
        data={books}
        keyExtractor={(book) => book.isbn}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <Text style={styles.heading}>
            All books <Text style={styles.count}>({books.length})</Text>
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              No books match your search or filters.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <BookCard book={item} index={index} style={styles.card} />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },
  panelWrap: {
    marginTop: 12,
  },
  listContent: {
    paddingBottom: 32,
  },
  heading: {
    fontSize: 17,
    fontWeight: "600",
    color: TEXT,
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 12,
  },
  count: {
    fontWeight: "400",
    color: MUTED,
  },
  column: {
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  card: {
    width: "48%",
    marginBottom: 16,
  },
  empty: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: MUTED,
  },
});
